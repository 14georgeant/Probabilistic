
import React, { useState, useCallback, useEffect } from 'react';
import { Variable, AnalysisResult } from './types';
import Header from './components/Header';
import VariableInputList from './components/VariableInputList';
import ResultsDisplay from './components/ResultsDisplay';
import { generateAnalysisSummary } from './services/geminiService';
import LinkAnalyzer from './components/LinkAnalyzer';
import TermsModal from './components/TermsModal';

const App: React.FC = () => {
    const [variables, setVariables] = useState<Variable[]>([
        {
            id: crypto.randomUUID(),
            name: 'Marketing Campaign',
            states: [
                { id: crypto.randomUUID(), name: 'Social Media', outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 70 }] },
                { id: crypto.randomUUID(), name: 'Email Outreach', outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 60 }] },
            ]
        },
        {
            id: crypto.randomUUID(),
            name: 'Product Pricing',
            states: [
                { id: crypto.randomUUID(), name: 'Premium Tier', outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 55 }] },
                { id: crypto.randomUUID(), name: 'Standard Tier', outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 80 }] },
            ]
        }
    ]);
    const [targetOutcomeName, setTargetOutcomeName] = useState<string>('Success');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [geminiInsights, setGeminiInsights] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    
    // Terms and Privacy State
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
    const [showTermsModal, setShowTermsModal] = useState<boolean>(true);

    useEffect(() => {
        const accepted = localStorage.getItem('poa_terms_accepted');
        if (accepted === 'true') {
            setHasAcceptedTerms(true);
            setShowTermsModal(false);
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleAcceptTerms = () => {
        localStorage.setItem('poa_terms_accepted', 'true');
        setHasAcceptedTerms(true);
        setShowTermsModal(false);
    };

    const handleOpenTerms = () => {
        setShowTermsModal(true);
    };

    const handleSecurityRisk = () => {
        setError('AI-generated content was flagged for a potential security risk. This session has been blocked pending review. Please refresh to start over.');
        setIsBlocked(true);
        setIsLoading(false);
    };

    const handleAnalyze = useCallback(async () => {
        if (!isOnline) {
            setError('You are offline. Please connect to the internet to use AI features.');
            return;
        }

        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setGeminiInsights('');

        if (!targetOutcomeName.trim()) {
            setError('Please specify a target outcome name.');
            setIsLoading(false);
            return;
        }

        if (variables.length === 0) {
            setError('Please add at least one variable to analyze.');
            setIsLoading(false);
            return;
        }

        try {
            // Local Analysis
            // Defines the structure for internal calculation
            type ComboItem = { variableName: string; stateName: string; baseProbability: number };
            
            const combinations: { combination: ComboItem[]; probability: number; }[] = [];
            
            const generateCombinations = (
                index: number,
                currentCombination: ComboItem[],
                currentProbability: number
            ) => {
                if (index === variables.length) {
                    combinations.push({ combination: currentCombination, probability: currentProbability });
                    return;
                }

                const variable = variables[index];
                for (const state of variable.states) {
                    const outcome = state.outcomes.find(o => o.name.toLowerCase() === targetOutcomeName.trim().toLowerCase());
                    const outcomeProbability = outcome ? outcome.probability : 0; // Keep as 0-100 for now

                    generateCombinations(
                        index + 1,
                        [...currentCombination, { variableName: variable.name, stateName: state.name, baseProbability: outcomeProbability }],
                        currentProbability * (outcomeProbability / 100)
                    );
                }
            };

            generateCombinations(0, [], 1);
            
            if (combinations.length === 0) {
                throw new Error("Could not generate any combinations.");
            }

            const best = combinations.reduce((max, current) => current.probability > max.probability ? current : max, combinations[0]);

            const result: AnalysisResult = {
                bestCombination: best.combination,
                highestProbability: best.probability,
                outcomeName: targetOutcomeName
            };
            setAnalysisResult(result);
            
            // Gemini Insights
            const insights = await generateAnalysisSummary(variables, result);
            setGeminiInsights(insights);

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis.';
            if (errorMessage.startsWith('SECURITY_RISK_DETECTED')) {
                handleSecurityRisk();
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }, [variables, targetOutcomeName, isOnline]);
    
    const handleAddVariable = (newVariable: Variable) => {
        setVariables(prevVariables => [...prevVariables, newVariable]);
        setActiveTab('manual');
    };

    const TabButton: React.FC<{tabName: 'manual' | 'ai'; label: string;}> = ({ tabName, label }) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
                activeTab === tabName
                ? 'bg-gray-700 text-cyan-400'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
        >
            {label}
        </button>
    );

    if (showTermsModal) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
                    <TermsModal onAccept={handleAcceptTerms} />
                </main>
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center text-center p-4">
                <Header onOpenTerms={handleOpenTerms} />
                <main className="flex-grow container mx-auto flex items-center justify-center">
                     <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg">
                        <h2 className="text-3xl font-bold text-red-500 mb-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Security Alert
                        </h2>
                        <p className="text-gray-300">{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            <Header onOpenTerms={handleOpenTerms} />
            {!isOnline && (
                <div className="bg-amber-600/90 text-white text-center px-4 py-2 text-sm font-medium shadow-md backdrop-blur-sm">
                    You are currently offline. AI features are disabled, but you can still edit variables manually.
                </div>
            )}
            <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col">
                    <h2 className="text-2xl font-bold mb-4 text-cyan-400">1. Define Variables & Outcomes</h2>
                     <div className="mb-6">
                        <label htmlFor="targetOutcome" className="block text-sm font-medium text-gray-300 mb-2">Target Outcome Name</label>
                        <input
                            id="targetOutcome"
                            type="text"
                            value={targetOutcomeName}
                            onChange={(e) => setTargetOutcomeName(e.target.value)}
                            placeholder="e.g., Success, Sale, Conversion"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                    
                    <div className="flex border-b border-gray-700 mb-4">
                        <TabButton tabName="manual" label="Manual Input" />
                        <TabButton tabName="ai" label="AI Assistant (from Link)" />
                    </div>

                    <div className="flex-grow">
                        {activeTab === 'manual' ? (
                            <VariableInputList variables={variables} setVariables={setVariables} />
                        ) : (
                            <LinkAnalyzer 
                                onVariableGenerated={handleAddVariable} 
                                onSecurityRisk={handleSecurityRisk} 
                                isOnline={isOnline}
                            />
                        )}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
                     <h2 className="text-2xl font-bold mb-4 text-cyan-400">2. Analysis & Impact</h2>
                     <div className="h-full flex flex-col">
                         {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-md mb-4">{error}</div>}
                         <ResultsDisplay 
                            result={analysisResult} 
                            insights={geminiInsights} 
                            isLoading={isLoading}
                            variables={variables}
                         />
                     </div>
                </div>
            </main>
            <footer className="sticky bottom-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
                <div className="container mx-auto flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !isOnline}
                        className={`w-full md:w-1/2 lg:w-1/3 font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform transition-all duration-300 ease-in-out ${
                            isLoading || !isOnline
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-105'
                        }`}
                    >
                        {isLoading ? 'Analyzing...' : !isOnline ? 'Offline - Connect to Internet for AI' : 'Run Analysis'}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default App;
