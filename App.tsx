import React, { useState, useCallback, useEffect } from 'react';
import { Variable, AnalysisResult } from './types';
import Header from './components/Header';
import VariableInputList from './components/VariableInputList';
import ResultsDisplay from './components/ResultsDisplay';
import { generateAnalysisSummary } from './services/geminiService';
import LinkAnalyzer from './components/LinkAnalyzer';
import TermsModal from './components/TermsModal';
import GeminiTerminal from './components/GeminiTerminal';

const App: React.FC = () => {
    // App Mode: 'general' (Cyan), 'financial' (Emerald), 'health' (Rose)
    const [appMode, setAppMode] = useState<'general' | 'financial' | 'health'>('general');

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
    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
    
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

    const handleLoadFinancialTemplate = () => {
        setAppMode('financial');
        setTargetOutcomeName('High ROI');
        setVariables([
            {
                id: crypto.randomUUID(),
                name: 'Asset Allocation',
                states: [
                    { id: crypto.randomUUID(), name: 'Aggressive (Stocks/Crypto)', outcomes: [{ id: crypto.randomUUID(), name: 'High ROI', probability: 65 }] },
                    { id: crypto.randomUUID(), name: 'Balanced (60/40)', outcomes: [{ id: crypto.randomUUID(), name: 'High ROI', probability: 50 }] },
                    { id: crypto.randomUUID(), name: 'Conservative (Bonds)', outcomes: [{ id: crypto.randomUUID(), name: 'High ROI', probability: 30 }] },
                ]
            },
            {
                id: crypto.randomUUID(),
                name: 'Market Condition',
                states: [
                    { id: crypto.randomUUID(), name: 'Bull Market', outcomes: [{ id: crypto.randomUUID(), name: 'High ROI', probability: 85 }] },
                    { id: crypto.randomUUID(), name: 'Bear Market', outcomes: [{ id: crypto.randomUUID(), name: 'High ROI', probability: 20 }] },
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleLoadHealthTemplate = () => {
        setAppMode('health');
        setTargetOutcomeName('Peak Performance');
        setVariables([
            {
                id: crypto.randomUUID(),
                name: 'Diet Protocol',
                states: [
                    { id: crypto.randomUUID(), name: 'High Protein / Low Carb', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 75 }] },
                    { id: crypto.randomUUID(), name: 'Intermittent Fasting', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 60 }] },
                    { id: crypto.randomUUID(), name: 'Standard American Diet', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 15 }] },
                ]
            },
            {
                id: crypto.randomUUID(),
                name: 'Sleep Hygiene',
                states: [
                    { id: crypto.randomUUID(), name: '8+ Hours Consistent', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 90 }] },
                    { id: crypto.randomUUID(), name: '6 Hours Fragmented', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 40 }] },
                ]
            },
            {
                id: crypto.randomUUID(),
                name: 'Training Load',
                states: [
                    { id: crypto.randomUUID(), name: 'Progressive Overload', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 80 }] },
                    { id: crypto.randomUUID(), name: 'Overtraining', outcomes: [{ id: crypto.randomUUID(), name: 'Peak Performance', probability: 25 }] },
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
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
            
            // Gemini Insights with Mode Context
            const insights = await generateAnalysisSummary(variables, result, appMode);
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
    }, [variables, targetOutcomeName, isOnline, appMode]);
    
    const handleAddVariable = (newVariable: Variable) => {
        setVariables(prevVariables => [...prevVariables, newVariable]);
        setActiveTab('manual');
    };

    const handleBatchVariables = (newVariables: Variable[]) => {
        setVariables(prev => [...prev, ...newVariables]);
        setActiveTab('manual');
    };

    // Dynamic Theme Colors
    const getThemeColors = () => {
        switch (appMode) {
            case 'financial': return {
                text: 'text-emerald-400',
                bg: 'bg-emerald-900',
                border: 'border-emerald-500',
                hover: 'hover:text-emerald-300',
                btn: 'bg-emerald-600 hover:bg-emerald-500',
                focus: 'focus:ring-emerald-500'
            };
            case 'health': return {
                text: 'text-rose-400',
                bg: 'bg-rose-900',
                border: 'border-rose-500',
                hover: 'hover:text-rose-300',
                btn: 'bg-rose-600 hover:bg-rose-500',
                focus: 'focus:ring-rose-500'
            };
            default: return {
                text: 'text-cyan-400',
                bg: 'bg-gray-700', // special case
                border: 'border-cyan-500',
                hover: 'hover:text-cyan-300',
                btn: 'bg-cyan-600 hover:bg-cyan-500',
                focus: 'focus:ring-cyan-500'
            };
        }
    };

    const theme = getThemeColors();

    const TabButton: React.FC<{tabName: 'manual' | 'ai'; label: string;}> = ({ tabName, label }) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
                activeTab === tabName
                ? `${appMode === 'general' ? 'bg-gray-700' : theme.bg}/80 ${theme.text}`
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
                            Security Alert
                        </h2>
                        <p className="text-gray-300">{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative transition-colors duration-500">
            <Header onOpenTerms={handleOpenTerms} onOpenTerminal={() => setIsTerminalOpen(!isTerminalOpen)} />
            
            {/* Mode Switcher Bar */}
            <div className="bg-gray-800/50 border-b border-gray-700 py-3 px-4">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 bg-gray-900 p-1 rounded-lg border border-gray-700">
                        <button 
                            onClick={() => setAppMode('general')}
                            className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${appMode === 'general' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            General Strategy
                        </button>
                        <button 
                            onClick={() => setAppMode('financial')}
                            className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${appMode === 'financial' ? 'bg-emerald-900 text-emerald-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Financial Adviser
                        </button>
                        <button 
                            onClick={() => setAppMode('health')}
                            className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${appMode === 'health' ? 'bg-rose-900 text-rose-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            Health & Sport
                            <span className="ml-1 bg-gradient-to-r from-amber-300 to-orange-500 text-black text-[8px] px-1 rounded font-black tracking-tighter">PREMIUM</span>
                        </button>
                    </div>
                    
                    {appMode === 'financial' && (
                         <button onClick={handleLoadFinancialTemplate} className="text-xs text-emerald-400 hover:text-emerald-300 underline decoration-dotted">
                             Populate Financial Template
                         </button>
                    )}
                    {appMode === 'health' && (
                         <button onClick={handleLoadHealthTemplate} className="text-xs text-rose-400 hover:text-rose-300 underline decoration-dotted">
                             Populate Fitness Template
                         </button>
                    )}
                </div>
            </div>

            <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col border-t-4 ${theme.border}`}>
                    <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>
                        1. {appMode === 'health' ? 'Bio-Metrics & Routines' : appMode === 'financial' ? 'Portfolio & Risk Factors' : 'Define Variables & Outcomes'}
                    </h2>
                     <div className="mb-6">
                        <label htmlFor="targetOutcome" className="block text-sm font-medium text-gray-300 mb-2">
                            {appMode === 'health' ? 'Performance Goal (e.g., Weight Loss, Hypertrophy)' : appMode === 'financial' ? 'Financial Goal (e.g., High ROI, Solvency)' : 'Target Outcome Name'}
                        </label>
                        <input
                            id="targetOutcome"
                            type="text"
                            value={targetOutcomeName}
                            onChange={(e) => setTargetOutcomeName(e.target.value)}
                            placeholder={appMode === 'health' ? "e.g., Sub-3 Hour Marathon" : appMode === 'financial' ? "e.g., Maximize Returns" : "e.g., Success, Sale, Conversion"}
                            className={`w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 transition ${theme.focus}`}
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
                                mode={appMode}
                            />
                        )}
                    </div>
                </div>
                <div className={`bg-gray-800 p-6 rounded-lg shadow-2xl border-t-4 ${theme.border}`}>
                     <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>
                         2. {appMode === 'health' ? 'Performance Analysis' : appMode === 'financial' ? 'Advisory & Forecast' : 'Analysis & Impact'}
                     </h2>
                     <div className="h-full flex flex-col">
                         {error && <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded-md mb-4">{error}</div>}
                         <ResultsDisplay 
                            result={analysisResult} 
                            insights={geminiInsights} 
                            isLoading={isLoading}
                            variables={variables}
                            mode={appMode}
                         />
                     </div>
                </div>
            </main>
            
            <GeminiTerminal 
                isOpen={isTerminalOpen} 
                onClose={() => setIsTerminalOpen(false)} 
                onExecute={handleBatchVariables}
                variables={variables}
            />

            <footer className="sticky bottom-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
                <div className="container mx-auto flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !isOnline}
                        className={`w-full md:w-1/2 lg:w-1/3 font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform transition-all duration-300 ease-in-out ${
                            isLoading || !isOnline
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : `${theme.btn} text-white hover:scale-105`
                        }`}
                    >
                        {isLoading ? 'Analyzing...' : !isOnline ? 'Offline - Connect to Internet for AI' : `Generate ${appMode === 'health' ? 'Health Report' : appMode === 'financial' ? 'Financial Plan' : 'Analysis'}`}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default App;