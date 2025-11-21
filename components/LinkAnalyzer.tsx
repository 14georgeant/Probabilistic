import React, { useState } from 'react';
import { analyzeLinkForVariables } from '../services/geminiService';
import { Variable } from '../types';

interface LinkAnalyzerProps {
    onVariableGenerated: (variable: Variable) => void;
    onSecurityRisk: () => void;
    isOnline: boolean;
}

const LinkAnalyzer: React.FC<LinkAnalyzerProps> = ({ onVariableGenerated, onSecurityRisk, isOnline }) => {
    const [url, setUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [suggestedVariable, setSuggestedVariable] = useState<Variable | null>(null);
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

    const handleAnalyzeClick = async () => {
        if (!isOnline) {
            setError('You are offline. Please connect to the internet to use this feature.');
            return;
        }

        if (!url.trim()) {
            setError('Please enter a URL.');
            return;
        }
        try {
            // Use the URL constructor for robust validation.
            // It requires a protocol like https://
            new URL(url);
        } catch (e) {
            setError('Please enter a valid URL format (e.g., https://example.com).');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestedVariable(null);
        setSources([]);

        try {
            const { variable, sources } = await analyzeLinkForVariables(url);
            setSuggestedVariable(variable);
            setSources(sources);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            if (errorMessage.startsWith('SECURITY_RISK_DETECTED')) {
                onSecurityRisk();
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVariable = () => {
        if (suggestedVariable) {
            onVariableGenerated(suggestedVariable);
            setSuggestedVariable(null);
            setSources([]);
            setUrl('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm text-gray-400 mb-4">
                Paste a link (e.g., <strong>YouTube video, X/Twitter post, Facebook page</strong>) and the AI will use Google Search to research it and suggest a relevant strategic variable.
            </p>
            <div className="flex gap-2 mb-4">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={isOnline ? "https://twitter.com/user/status/..." : "Offline - Feature Unavailable"}
                    className={`flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading || !isOnline}
                />
                <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading || !isOnline}
                    className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                        isLoading || !isOnline 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                >
                    {isLoading ? '...' : 'Research'}
                </button>
            </div>
            
            {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-md mb-4">{error}</div>}

            <div className="flex-grow mt-4">
                {isLoading && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                        <p className="text-md font-semibold text-gray-300">Analyzing Content...</p>
                        <p className="text-xs text-gray-400 mt-2">Searching for engagement & virality signals...</p>
                    </div>
                )}
                {suggestedVariable && (
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 animate-fade-in">
                        <h4 className="text-md font-semibold text-gray-200 mb-3">AI Suggestion:</h4>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                             <p className="text-lg font-bold text-cyan-300">{suggestedVariable.name}</p>
                             <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-600">
                                {suggestedVariable.states.map(state => (
                                    <div key={state.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">{state.name}</span>
                                        <span className="font-mono text-white bg-gray-700 px-2 py-1 rounded">{state.outcomes[0]?.probability}%</span>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-600">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sources Consulted</h5>
                                <ul className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                                    {sources.map((source, idx) => (
                                        <li key={idx}>
                                            <a 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline truncate block flex items-center"
                                            >
                                                <svg className="w-3 h-3 mr-1 inline-block" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={handleAddVariable}
                            className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            + Add Variable to Model
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkAnalyzer;