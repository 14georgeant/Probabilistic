
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createProgrammerChat } from '../services/geminiService';
import { generateUUID } from '../utils';

interface ProgrammerChatProps {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: { title: string; uri: string }[];
};

const ProgrammerChat: React.FC<ProgrammerChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'intro', 
            role: 'model', 
            text: "Hello, Dev. I'm your Programmer's Mate. I can help you find libraries, debug race conditions, or architect your next system.\n\n*Ready to compile some ideas?*" 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize chat session when opened
    useEffect(() => {
        if (isOpen && !chatSession) {
            try {
                const session = createProgrammerChat();
                setChatSession(session);
                setInitError(null);
            } catch (e: any) {
                console.error("Failed to init programmer chat", e);
                setInitError(e.message || "Connection Error");
            }
        }
    }, [isOpen, chatSession]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isMinimized]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isMinimized]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        let activeSession = chatSession;
        if (!activeSession) {
            try {
                activeSession = createProgrammerChat();
                setChatSession(activeSession);
                setInitError(null);
            } catch (e: any) {
                console.error("Recovery failed:", e);
                const msg = e.message || "Unknown error";
                setInitError(msg);
                setMessages(prev => [...prev, { 
                     id: generateUUID(), 
                     role: 'model', 
                     text: `System Error: ${msg.includes("API_KEY") ? "API Key configuration missing." : "Unable to connect."} Please check your deployment settings.` 
                }]);
                setInput(''); 
                return;
            }
        }

        const userText = input;
        const userMsg: Message = { id: generateUUID(), role: 'user', text: userText };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await activeSession.sendMessageStream({ message: userText });
            
            let fullText = "";
            const currentMsgId = generateUUID();
            let sources: { title: string; uri: string }[] = [];
            
            // Optimistic update for stream start
            setMessages(prev => [...prev, { id: currentMsgId, role: 'model', text: "" }]);

            for await (const chunk of result) {
                const c = chunk as GenerateContentResponse;
                if (c.text) {
                    fullText += c.text;
                    setMessages(prev => prev.map(m => 
                        m.id === currentMsgId ? { ...m, text: fullText } : m
                    ));
                }
                
                if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    const chunks = c.candidates[0].groundingMetadata.groundingChunks;
                    const newSources: { title: string; uri: string }[] = [];
                     chunks.forEach(k => {
                        if (k.web) {
                            newSources.push({
                                title: k.web.title || 'Source',
                                uri: k.web.uri || '#'
                            });
                        }
                    });
                    if (newSources.length > 0) {
                        sources = newSources;
                    }
                }
            }

            // Final update with sources
            setMessages(prev => prev.map(m => 
                m.id === currentMsgId ? { ...m, text: fullText, sources: sources } : m
            ));

        } catch (e: any) {
            console.error("Chat Error:", e);
            setMessages(prev => [...prev, { 
                id: generateUUID(), 
                role: 'model', 
                text: e.message?.includes("API_KEY") 
                    ? "Error: API Key not found. Please ensure the API_KEY environment variable is set."
                    : "Error: Unable to connect to developer knowledge base. Please check your network connection." 
            }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed z-50 flex flex-col bg-gray-900 shadow-2xl transition-all duration-300 ease-in-out
            ${isMinimized 
                ? 'bottom-0 right-4 w-72 h-14 rounded-t-xl border border-lime-500/50 border-b-0' 
                : 'inset-y-0 right-0 w-full md:w-[600px] border-l border-lime-500/50 animate-fade-in'
            }
        `}>
            {/* Header */}
            <div 
                className={`bg-lime-900/80 backdrop-blur-md p-4 border-b border-lime-700 flex justify-between items-center select-none ${isMinimized ? 'cursor-pointer rounded-t-xl hover:bg-lime-900/95' : ''}`}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-full bg-gray-900 flex items-center justify-center shadow-lg border border-lime-500 transition-all ${isMinimized ? 'w-8 h-8' : 'w-10 h-10'}`}>
                        <span className={`${isMinimized ? 'text-lg' : 'text-2xl'}`}>👨‍💻</span>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className={`font-bold text-white whitespace-nowrap ${isMinimized ? 'text-sm' : 'text-base'}`}>Programmer's Mate</h3>
                        {!isMinimized && (
                            <span className="text-[10px] text-lime-300 flex items-center gap-1 whitespace-nowrap">
                                <div className={`w-2 h-2 rounded-full ${initError ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`}></div>
                                {initError ? 'Service Unavailable' : 'Connected to Dev Knowledge Base'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                     <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsMinimized(!isMinimized); 
                        }} 
                        className="text-lime-300 hover:text-white p-1.5 rounded hover:bg-lime-800/50 transition-colors"
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                         {isMinimized ? (
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                         ) : (
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                         )}
                    </button>
                    <button onClick={onClose} className="text-lime-300 hover:text-white p-1.5 rounded hover:bg-lime-800/50 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Body - Hidden when minimized */}
            {!isMinimized && (
                <>
                    {/* Messages Area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-800/50 terminal-scrollbar font-mono">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-xl p-4 ${
                                    msg.role === 'user' 
                                    ? 'bg-lime-700 text-white rounded-br-none shadow-lg' 
                                    : 'bg-gray-900 border border-lime-500/30 text-lime-100 rounded-bl-none shadow-md'
                                }`}>
                                    <div className="prose prose-invert text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.text || <span className="animate-pulse text-lime-500">Compiling response...</span>}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-lime-500/30">
                                            <p className="text-[10px] font-bold text-lime-400 uppercase mb-1">References</p>
                                            <ul className="space-y-1">
                                                {msg.sources.map((s, i) => (
                                                    <li key={i}>
                                                        <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-lime-300 hover:underline flex items-center gap-1 truncate">
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
                                                            {s.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-900 border-t border-lime-900">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={initError ? "System offline..." : "Ask about React hooks, Rust borrowing, or System Design..."}
                                className={`w-full bg-gray-800 border rounded-lg py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent pr-12 shadow-inner transition-colors font-mono text-sm ${
                                    initError 
                                    ? 'border-red-500/50 focus:ring-red-500/50 placeholder-red-400/50' 
                                    : 'border-lime-500/30 focus:ring-lime-500'
                                }`}
                                disabled={isLoading}
                                autoComplete="off"
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-lime-700 hover:bg-lime-600 text-white p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                            </button>
                        </div>
                        {!initError && (
                            <div className="flex justify-center items-center gap-2 mt-2">
                                 <span className="text-[10px] text-gray-500">AI Generated Code & Advice. Always review before use.</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgrammerChat;