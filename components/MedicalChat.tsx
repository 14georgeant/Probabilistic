
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createMedicalChat } from '../services/geminiService';

interface MedicalChatProps {
    isOpen: boolean;
    onClose: () => void;
}

type Message = {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: { title: string; uri: string }[];
};

const MedicalChat: React.FC<MedicalChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'intro', 
            role: 'model', 
            text: "Hello. I am your Medical Research Assistant. I can help you analyze clinical data, understand medical journals, or explore symptoms using authorized medical sources. \n\n*Note: I provide information, not medical diagnosis.*" 
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
                const session = createMedicalChat();
                setChatSession(session);
                setInitError(null);
            } catch (e: any) {
                console.error("Failed to init medical chat", e);
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
        
        // Fail-safe: If chatSession is missing, try to create it one last time
        let activeSession = chatSession;
        if (!activeSession) {
            try {
                activeSession = createMedicalChat();
                setChatSession(activeSession);
                setInitError(null);
            } catch (e: any) {
                console.error("Recovery failed:", e);
                const msg = e.message || "Unknown error";
                setInitError(msg);
                setMessages(prev => [...prev, { 
                     id: crypto.randomUUID(), 
                     role: 'model', 
                     text: `System Error: ${msg.includes("API_KEY") ? "API Key configuration missing." : "Unable to connect."} Please check your deployment settings.` 
                }]);
                // Clear input so user can try again if they fix it
                setInput(''); 
                return;
            }
        }

        const userText = input;
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: userText };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await activeSession.sendMessageStream({ message: userText });
            
            let fullText = "";
            const currentMsgId = crypto.randomUUID();
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
                
                // Extract sources from grounding metadata
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
                id: crypto.randomUUID(), 
                role: 'model', 
                text: e.message?.includes("API_KEY") 
                    ? "Error: API Key not found. Please ensure the API_KEY environment variable is set."
                    : "Error: Unable to connect to medical knowledge base. Please check your network connection." 
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
                ? 'bottom-0 right-4 w-72 h-14 rounded-t-xl border border-indigo-500/50 border-b-0' 
                : 'inset-y-0 right-0 w-full md:w-[500px] border-l border-indigo-500/50 animate-fade-in'
            }
        `}>
            {/* Header */}
            <div 
                className={`bg-indigo-900/80 backdrop-blur-md p-4 border-b border-indigo-700 flex justify-between items-center select-none ${isMinimized ? 'cursor-pointer rounded-t-xl hover:bg-indigo-900/95' : ''}`}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-full bg-white flex items-center justify-center shadow-lg transition-all ${isMinimized ? 'w-8 h-8' : 'w-10 h-10'}`}>
                        <svg className={`${isMinimized ? 'w-5 h-5' : 'w-6 h-6'} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className={`font-bold text-white whitespace-nowrap ${isMinimized ? 'text-sm' : 'text-base'}`}>Medical Helper AI</h3>
                        {!isMinimized && (
                            <span className="text-[10px] text-indigo-300 flex items-center gap-1 whitespace-nowrap">
                                <div className={`w-2 h-2 rounded-full ${initError ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`}></div>
                                {initError ? 'Service Unavailable' : 'Connected to Medical Journals'}
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
                        className="text-indigo-300 hover:text-white p-1.5 rounded hover:bg-indigo-800/50 transition-colors"
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                         {isMinimized ? (
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                         ) : (
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                         )}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="text-indigo-300 hover:text-white p-1.5 rounded hover:bg-indigo-800/50 transition-colors"
                        title="Close Chat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Body - Hidden when minimized */}
            {!isMinimized && (
                <>
                    {/* Messages Area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-800/50 terminal-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg' 
                                    : 'bg-gray-700 border border-gray-600 text-gray-100 rounded-bl-none shadow-md'
                                }`}>
                                    <div className="prose prose-invert text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.text || <span className="animate-pulse">Thinking...</span>}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gray-600/50">
                                            <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Referenced Sources</p>
                                            <ul className="space-y-1">
                                                {msg.sources.map((s, i) => (
                                                    <li key={i}>
                                                        <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
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
                    <div className="p-4 bg-gray-900 border-t border-indigo-900">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={initError ? "System offline - Check config..." : "Ask about symptoms, drug interactions, or research..."}
                                className={`w-full bg-gray-800 border rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent pr-12 shadow-inner transition-colors ${
                                    initError 
                                    ? 'border-red-500/50 focus:ring-red-500/50 placeholder-red-400/50' 
                                    : 'border-indigo-500/30 focus:ring-indigo-500'
                                }`}
                                disabled={isLoading}
                                autoComplete="off"
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                            </button>
                        </div>
                        {initError && (
                            <p className="text-[10px] text-center text-red-400 mt-2 animate-pulse">
                                {initError.includes("API_KEY") ? "Configuration Error: API Key is missing." : "Connection Failed"}
                            </p>
                        )}
                        {!initError && (
                            <p className="text-[10px] text-center text-gray-500 mt-2">
                                AI-generated content. For research only. Not a substitute for professional medical advice.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MedicalChat;
