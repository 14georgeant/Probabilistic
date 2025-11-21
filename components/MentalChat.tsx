
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createMentalChat, formatGenAIError } from '../services/geminiService';
import { generateUUID } from '../utils';

interface MentalChatProps {
    isOpen: boolean;
    onClose: () => void;
    isFullPage?: boolean;
}

type Message = {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: { title: string; uri: string }[];
};

const MentalChat: React.FC<MentalChatProps> = ({ isOpen, onClose, isFullPage = false }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'intro', 
            role: 'model', 
            text: "Hello. I'm Serenity, your supportive companion. I'm here to listen with an open heart and no judgment. Whether you're feeling overwhelmed, anxious, or just need to talk, you are safe here.\n\n*How are you feeling right now?*" 
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
        if ((isOpen || isFullPage) && !chatSession) {
            try {
                const session = createMentalChat();
                setChatSession(session);
                setInitError(null);
            } catch (e: any) {
                console.error("Failed to init mental chat", e);
                setInitError(e.message || "Connection Error");
            }
        }
    }, [isOpen, isFullPage, chatSession]);

    // Focus input when opened (and not minimized)
    useEffect(() => {
        if ((isOpen || isFullPage) && !isMinimized) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isFullPage, isMinimized]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isMinimized]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;
        
        let activeSession = chatSession;
        if (!activeSession) {
            try {
                activeSession = createMentalChat();
                setChatSession(activeSession);
                setInitError(null);
            } catch (e: any) {
                console.error("Recovery failed:", e);
                const msg = e.message || "Unknown error";
                setInitError(msg);
                setMessages(prev => [...prev, { 
                     id: generateUUID(), 
                     role: 'model', 
                     text: formatGenAIError(e)
                }]);
                setInput(''); 
                return;
            }
        }

        const userMsg: Message = { id: generateUUID(), role: 'user', text: textToSend };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await activeSession.sendMessageStream({ message: textToSend });
            
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
            const friendlyError = formatGenAIError(e);
            setMessages(prev => [...prev, { 
                id: generateUUID(), 
                role: 'model', 
                text: friendlyError
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
    
    if (!isOpen && !isFullPage) return null;

    const containerClass = isFullPage
        ? "w-full h-full flex flex-col bg-gray-900 rounded-xl border border-amber-500/30 shadow-2xl overflow-hidden animate-fade-in"
        : `fixed z-50 flex flex-col bg-gray-900 shadow-2xl transition-all duration-300 ease-in-out ${isMinimized ? 'bottom-0 right-4 w-72 h-14 rounded-t-xl border border-amber-500/50 border-b-0' : 'inset-y-0 right-0 w-full md:w-[500px] border-l border-amber-500/50 animate-fade-in'}`;

    return (
        <div className={containerClass}>
            {/* Header */}
            <div 
                className={`bg-amber-900/80 backdrop-blur-md p-4 border-b border-amber-700 flex justify-between items-center select-none ${!isFullPage && isMinimized ? 'cursor-pointer rounded-t-xl hover:bg-amber-900/95' : ''}`}
                onClick={() => !isFullPage && isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className={`rounded-full bg-white flex items-center justify-center shadow-lg border border-amber-500 transition-all ${isMinimized ? 'w-8 h-8' : 'w-10 h-10'}`}>
                        <span className={`${isMinimized ? 'text-lg' : 'text-2xl'}`}>🧘</span>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className={`font-bold text-white whitespace-nowrap ${isMinimized ? 'text-sm' : 'text-xl'}`}>Mental Sanctuary</h3>
                        {!isMinimized && (
                            <span className="text-[10px] text-amber-300 flex items-center gap-1 whitespace-nowrap">
                                <div className={`w-2 h-2 rounded-full ${initError ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`}></div>
                                {initError ? 'Service Unavailable' : 'Serenity (AI)'}
                            </span>
                        )}
                    </div>
                </div>
                {!isFullPage && (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setIsMinimized(!isMinimized); 
                            }} 
                            className="text-amber-300 hover:text-white p-1.5 rounded hover:bg-amber-800/50 transition-colors"
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
                            className="text-amber-300 hover:text-white p-1.5 rounded hover:bg-amber-800/50 transition-colors"
                            title="Close Chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Body - Hidden when minimized (if not full page) */}
            {(!isMinimized || isFullPage) && (
                <>
                    {/* Messages Area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-800/50 terminal-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 ${
                                    msg.role === 'user' 
                                    ? 'bg-amber-600 text-white rounded-br-none shadow-lg' 
                                    : 'bg-gray-700 border border-gray-600 text-gray-100 rounded-bl-none shadow-md'
                                }`}>
                                    <div className="prose prose-invert text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.text || <span className="animate-pulse text-amber-300">Listening...</span>}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gray-600/50">
                                            <p className="text-[10px] font-bold text-amber-300 uppercase mb-1">Helpful Resources</p>
                                            <ul className="space-y-1">
                                                {msg.sources.map((s, i) => (
                                                    <li key={i}>
                                                        <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-400 hover:underline flex items-center gap-1">
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
                    <div className="p-4 bg-gray-900 border-t border-amber-900">
                        
                         {/* Quick Prompt Chips for Feelings */}
                         <div className="mb-3 overflow-x-auto no-scrollbar flex gap-2 pb-1">
                            {[
                                "I'm feeling overwhelmed", 
                                "Struggling with motivation", 
                                "Anxiety is high today",
                                "Need a mindfulness tip",
                                "Just need to vent"
                            ].map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(prompt)}
                                    disabled={isLoading}
                                    className="whitespace-nowrap px-3 py-1.5 bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs rounded-full hover:bg-amber-800 hover:text-white transition-colors flex-shrink-0"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={initError ? "System offline..." : "Share what's on your mind..."}
                                className={`w-full bg-gray-800 border rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent pr-12 shadow-inner transition-colors ${
                                    initError 
                                    ? 'border-red-500/50 focus:ring-red-500/50 placeholder-red-400/50' 
                                    : 'border-amber-500/30 focus:ring-amber-500'
                                }`}
                                disabled={isLoading}
                                autoComplete="off"
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                            </button>
                        </div>
                        {!initError && (
                            <p className="text-[10px] text-center text-gray-500 mt-2">
                                Serenity is an AI. Not a substitute for professional therapy. In crisis, dial 988.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MentalChat;
