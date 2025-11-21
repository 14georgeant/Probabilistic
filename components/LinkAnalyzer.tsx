
import React, { useState } from 'react';
import { analyzeLinkForVariables } from '../services/geminiService';
import { Variable } from '../types';

interface LinkAnalyzerProps {
    onVariableGenerated: (variable: Variable) => void;
    onSecurityRisk: () => void;
    isOnline: boolean;
    mode?: 'general' | 'financial' | 'health' | 'medical' | 'programmer' | 'mental';
}

const LinkAnalyzer: React.FC<LinkAnalyzerProps> = ({ onVariableGenerated, onSecurityRisk, isOnline, mode = 'general' }) => {
    const [url, setUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [suggestedVariable, setSuggestedVariable] = useState<Variable | null>(null);
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

    const handleAnalyzeClick = async () => {
        // Removed strict offline check to allow retries
        let urlToProcess = url.trim();

        if (!urlToProcess) {
            setError('Validation Error: Please enter a URL to analyze.');
            return;
        }

        // Auto-prepend https:// if protocol is missing
        if (!/^https?:\/\//i.test(urlToProcess)) {
            urlToProcess = 'https://' + urlToProcess;
        }

        try {
            new URL(urlToProcess);
        } catch (e) {
            setError('Invalid Format: Please enter a valid URL (e.g., https://example.com).');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestedVariable(null);
        setSources([]);

        try {
            const { variable, sources } = await analyzeLinkForVariables(urlToProcess, mode as any);
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

    let placeholderText = "instagram.com/p/...";
    let instructionsText = <span>Paste a link (e.g., <strong>Instagram, TikTok, YouTube</strong>) and the AI will research it to suggest a relevant strategic variable.</span>;
    let buttonClass = "bg-cyan-600 hover:bg-cyan-500";
    let textClass = "text-cyan-300";

    if (mode === 'financial') {
        placeholderText = "bloomberg.com/news/...";
        instructionsText = <span>Paste a link to a <strong>Stock, Asset, or Economic News</strong> and the AI will analyze its impact on your portfolio.</span>;
        buttonClass = "bg-emerald-600 hover:bg-emerald-500";
        textClass = "text-emerald-300";
    } else if (mode === 'health') {
        placeholderText = "youtube.com/watch?v=workout...";
        instructionsText = <span>Paste a link to a <strong>Workout, Diet Plan, or Supplement</strong> and the AI will analyze its impact on your performance.</span>;
        buttonClass = "bg-rose-600 hover:bg-rose-500";
        textClass = "text-rose-300";
    } else if (mode === 'medical') {
        placeholderText = "pubmed.ncbi.nlm.nih.gov/...";
        instructionsText = <span>Paste a link to a <strong>Clinical Study (PubMed), Journal Article, or Disease Profile</strong> and the AI will extract the prognostic factors.</span>;
        buttonClass = "bg-indigo-600 hover:bg-indigo-500";
        textClass = "text-indigo-300";
    } else if (mode === 'programmer') {
        placeholderText = "github.com/user/repo...";
        instructionsText = <span>Paste a link to a <strong>GitHub Repo, Documentation, or StackOverflow</strong> and the AI will analyze the technical impact.</span>;
        buttonClass = "bg-lime-600 hover:bg-lime-500";
        textClass = "text-lime-300";
    } else if (mode === 'mental') {
        placeholderText = "psychologytoday.com/...";
        instructionsText = <span>Paste a link to a <strong>Wellness Article, Meditation, or Study</strong> and the AI will analyze its impact on mental resilience.</span>;
        buttonClass = "bg-amber-600 hover:bg-amber-500";
        textClass = "text-amber-300";
    }

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm text-gray-400 mb-4">
                {instructionsText}
            </p>
            <div className="flex gap-2 mb-4">
                <input
                    type="text" 
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if (error) setError('');
                    }}
                    placeholder={placeholderText}
                    className={`flex-grow bg-gray-700 border rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 transition ${
                        error 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-600 focus:ring-2'
                    }`}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeClick()}
                />
                <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading}
                    className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                        isLoading
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : buttonClass
                    }`}
                >
                    {isLoading ? '...' : 'Research'}
                </button>
            </div>
            
            {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-3 py-2 rounded-md mb-4 text-sm flex items-center gap-2 animate-fade-in">
                     <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <span>{error}</span>
                </div>
            )}

            <div className="flex-grow mt-4">
                {isLoading && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4 ${mode === 'financial' ? 'border-emerald-500' : mode === 'health' ? 'border-rose-500' : mode === 'medical' ? 'border-indigo-500' : mode === 'programmer' ? 'border-lime-500' : mode === 'mental' ? 'border-amber-500' : 'border-cyan-500'}`}></div>
                        <p className="text-md font-semibold text-gray-300">Analyzing Content...</p>
                        <p className="text-xs text-gray-400 mt-2">Evaluating {mode === 'financial' ? 'financial indicators' : mode === 'health' ? 'metabolic impact' : mode === 'medical' ? 'clinical significance' : mode === 'programmer' ? 'code quality' : mode === 'mental' ? 'wellness factors' : 'engagement & virality'}...</p>
                    </div>
                )}
                {suggestedVariable && (
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 animate-fade-in">
                        <h4 className="text-md font-semibold text-gray-200 mb-3">AI Suggestion:</h4>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                             <p className={`text-lg font-bold ${textClass}`}>{suggestedVariable.name}</p>
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
                                                className={`text-xs ${mode === 'financial' ? 'text-emerald-400 hover:text-emerald-300' : mode === 'health' ? 'text-rose-400 hover:text-rose-300' : mode === 'medical' ? 'text-indigo-400 hover:text-indigo-300' : mode === 'programmer' ? 'text-lime-400 hover:text-lime-300' : mode === 'mental' ? 'text-amber-400 hover:text-amber-300' : 'text-cyan-400 hover:text-cyan-300'} hover:underline truncate block flex items-center`}
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
                            className={`mt-4 w-full text-white font-bold py-2 px-4 rounded-lg transition ${buttonClass}`}
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
