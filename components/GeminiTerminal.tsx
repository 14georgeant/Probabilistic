import React, { useState, useRef, useEffect } from 'react';
import { Variable } from '../types';
import { processBatchData, generateCppAdaptivityCode } from '../services/geminiService';

interface GeminiTerminalProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (variables: Variable[]) => void;
    variables: Variable[]; // Access to current app state for code generation
}

const GeminiTerminal: React.FC<GeminiTerminalProps> = ({ isOpen, onClose, onExecute, variables }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([
        "Gemini 2.5 Flash CLI [Version 1.0.0]",
        "(c) Google Cloud AI. All rights reserved.",
        "",
        "Ready to process large datasets. Paste CSV, JSON, or text below.",
        "Type 'help' for commands.",
        ""
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [isOpen, history]);

    const addToHistory = (line: string, type: 'info' | 'success' | 'error' | 'command' | 'code' = 'info') => {
        setHistory(prev => [...prev, type === 'code' ? `CODE_BLOCK_START\n${line}\nCODE_BLOCK_END` : `[${new Date().toLocaleTimeString()}] ${line}`]);
    };

    const handleCommand = async () => {
        const cmd = input.trim();
        if (!cmd) return;

        addToHistory(`> ${cmd}`, 'command');
        setInput('');
        setIsProcessing(true);

        try {
            // Local Commands
            if (cmd.toLowerCase() === 'clear') {
                setHistory([]);
                setIsProcessing(false);
                return;
            }
            if (cmd.toLowerCase() === 'help') {
                addToHistory("Available Commands:", 'info');
                addToHistory("  - [paste data] : Automatically detects and processes data into variables.", 'info');
                addToHistory("  - generate cpp : Generates a C++ class for model adaptivity.", 'info');
                addToHistory("  - clear        : Clears the terminal screen.", 'info');
                addToHistory("  - close        : Closes the terminal.", 'info');
                setIsProcessing(false);
                return;
            }
            if (cmd.toLowerCase() === 'close') {
                onClose();
                setIsProcessing(false);
                return;
            }
            
            // C++ Code Generation
            if (cmd.toLowerCase() === 'generate cpp' || cmd.toLowerCase() === 'codegen') {
                addToHistory("Analyzing model structure...", 'info');
                addToHistory("Generating optimized C++ adaptivity engine...", 'info');
                const code = await generateCppAdaptivityCode(variables);
                addToHistory(code, 'code');
                addToHistory("C++ Source code generated successfully.", 'success');
                setIsProcessing(false);
                return;
            }

            // Remote Processing (Batch Data)
            addToHistory("Initializing Gemini 2.5 Flash environment...", 'info');
            addToHistory(`Uploading ${cmd.length} bytes of data context...`, 'info');
            
            const newVariables = await processBatchData(cmd);
            
            addToHistory(`Processing complete. Generated ${newVariables.length} variables.`, 'success');
            addToHistory("Merging with main application state...", 'info');
            
            onExecute(newVariables);
            
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            addToHistory(`ERROR: ${msg}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCommand();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 h-2/3 md:h-3/4 bg-gray-900/95 border-t-2 border-cyan-500/50 backdrop-blur-md flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 animate-in slide-in-from-bottom">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 text-xs text-gray-400 font-mono">user@gemini-cli:~</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-wider border border-cyan-500/30 px-2 py-0.5 rounded">
                        Gemini 2.5 Flash Connected
                    </span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-grow p-4 overflow-y-auto font-mono text-sm terminal-scrollbar space-y-1" onClick={() => inputRef.current?.focus()}>
                {history.map((line, i) => {
                    // Handle Code Block Rendering
                    if (line.startsWith('CODE_BLOCK_START')) {
                        const codeContent = line.replace('CODE_BLOCK_START\n', '').replace('\nCODE_BLOCK_END', '');
                        return (
                            <div key={i} className="my-4 bg-gray-950 border border-gray-700 rounded p-3 overflow-x-auto">
                                <pre className="text-green-400 text-xs whitespace-pre">{codeContent}</pre>
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={i} 
                            className={`${line.includes('ERROR') ? 'text-red-400' : line.includes('successfully') ? 'text-green-400' : line.startsWith('[') ? 'text-gray-300' : 'text-cyan-300'}`}
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            {line}
                        </div>
                    );
                })}
                {isProcessing && (
                    <div className="text-yellow-400 animate-pulse">
                        _ processing data stream...
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 bg-gray-800 border-t border-gray-700 flex gap-2">
                <span className="text-green-500 font-mono py-2 select-none">{'>'}</span>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type 'help', 'generate cpp', or paste large data..."
                    className="flex-grow bg-transparent text-gray-200 font-mono text-sm focus:outline-none resize-none h-20 md:h-16 custom-scrollbar placeholder-gray-600"
                />
                <button 
                    onClick={handleCommand}
                    disabled={isProcessing || !input.trim()}
                    className={`px-4 rounded-md font-bold uppercase text-xs tracking-wider transition-colors ${
                        isProcessing || !input.trim() 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                >
                    Run
                </button>
            </div>
        </div>
    );
};

export default GeminiTerminal;