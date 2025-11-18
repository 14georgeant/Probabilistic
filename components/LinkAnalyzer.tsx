import React, { useState } from 'react';
import { analyzeLinkForVariables } from '../services/geminiService';
import { Variable } from '../types';

interface LinkAnalyzerProps {
    onVariableGenerated: (variable: Variable) => void;
    onSecurityRisk: () => void;
}

const LinkAnalyzer: React.FC<LinkAnalyzerProps> = ({ onVariableGenerated, onSecurityRisk }) => {
    const [url, setUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [suggestedVariable, setSuggestedVariable] = useState<Variable | null>(null);

    const handleAnalyzeClick = async () => {
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
        try {
            const result = await analyzeLinkForVariables(url);
            setSuggestedVariable(result);
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
            setUrl('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm text-gray-400 mb-4">
                Paste a link (e.g., product page, social media profile) and the AI will suggest a relevant variable for your model based on its purpose.
            </p>
            <div className="flex gap-2 mb-4">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-website.com/product"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    disabled={isLoading}
                />
                <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {isLoading ? '...' : 'Generate'}
                </button>
            </div>
            
            {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-md mb-4">{error}</div>}

            <div className="flex-grow mt-4">
                {isLoading && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                        <p className="text-md font-semibold text-gray-300">Analyzing Link's Purpose...</p>
                        <p className="text-xs text-gray-400">This is a privacy-preserving analysis and does not access the live website.</p>
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