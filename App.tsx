
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Variable, AnalysisResult } from './types';
import Header from './components/Header';
import VariableInputList from './components/VariableInputList';
import ResultsDisplay from './components/ResultsDisplay';
import { generateAnalysisSummary } from './services/geminiService';
import LinkAnalyzer from './components/LinkAnalyzer';
import PriceActionAnalyzer from './components/PriceActionAnalyzer';
import TermsModal from './components/TermsModal';
import GeminiTerminal from './components/GeminiTerminal';
import MedicalChat from './components/MedicalChat';
import FinancialChat from './components/FinancialChat';
import ProgrammerChat from './components/ProgrammerChat';
import HealthChat from './components/HealthChat';
import MentalChat from './components/MentalChat';
import TradaysCalendar from './components/TradaysCalendar';
import CodeExportModal from './components/CodeExportModal';
import NotebookSection from './components/NotebookSection';
import DNAStartup from './components/DNAStartup';
import { generateUUID } from './utils';

const App: React.FC = () => {
    const [showSplash, setShowSplash] = useState(true);

    // App Mode: 'general', 'financial', 'health', 'medical', 'programmer', 'mental'
    const [appMode, setAppMode] = useState<'general' | 'financial' | 'health' | 'medical' | 'programmer' | 'mental'>(() => {
        const saved = localStorage.getItem('poa_app_mode');
        return (saved as 'general' | 'financial' | 'health' | 'medical' | 'programmer' | 'mental') || 'general';
    });

    const [variables, setVariables] = useState<Variable[]>(() => {
        const saved = localStorage.getItem('poa_variables');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Error parsing saved variables:", e);
            }
        }
        // Default Initial State
        return [
            {
                id: generateUUID(),
                name: 'Marketing Campaign',
                states: [
                    { id: generateUUID(), name: 'Social Media', outcomes: [{ id: generateUUID(), name: 'Success', probability: 70 }] },
                    { id: generateUUID(), name: 'Email Outreach', outcomes: [{ id: generateUUID(), name: 'Success', probability: 60 }] },
                ]
            },
            {
                id: generateUUID(),
                name: 'Product Pricing',
                states: [
                    { id: generateUUID(), name: 'Premium Tier', outcomes: [{ id: generateUUID(), name: 'Success', probability: 55 }] },
                    { id: generateUUID(), name: 'Standard Tier', outcomes: [{ id: generateUUID(), name: 'Success', probability: 80 }] },
                ]
            }
        ];
    });
    
    const [targetOutcomeName, setTargetOutcomeName] = useState<string>(() => {
        return localStorage.getItem('poa_target_outcome') || 'Success';
    });

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [geminiInsights, setGeminiInsights] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'price_action'>('manual');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
    const [isMedicalChatOpen, setIsMedicalChatOpen] = useState<boolean>(false);
    const [isFinancialChatOpen, setIsFinancialChatOpen] = useState<boolean>(false);
    const [isProgrammerChatOpen, setIsProgrammerChatOpen] = useState<boolean>(false);
    const [isHealthChatOpen, setIsHealthChatOpen] = useState<boolean>(false);
    const [isMentalChatOpen, setIsMentalChatOpen] = useState<boolean>(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
    
    // Terms and Privacy State
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
    const [showTermsModal, setShowTermsModal] = useState<boolean>(true);

    // Reset Key to force remounting of persistent components
    const [resetKey, setResetKey] = useState<number>(0);

    // Scroll Container Ref for Mode Selector
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('poa_app_mode', appMode);
    }, [appMode]);

    useEffect(() => {
        localStorage.setItem('poa_variables', JSON.stringify(variables));
    }, [variables]);

    useEffect(() => {
        localStorage.setItem('poa_target_outcome', targetOutcomeName);
    }, [targetOutcomeName]);

    useEffect(() => {
        if (appMode !== 'financial' && activeTab === 'price_action') {
            setActiveTab('manual');
        }
    }, [appMode]);

    useEffect(() => {
        const accepted = localStorage.getItem('poa_terms_accepted');
        if (accepted === 'true') {
            setHasAcceptedTerms(true);
            setShowTermsModal(false);
        }
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
        setIsFinancialChatOpen(true);
        setVariables([
            {
                id: generateUUID(),
                name: 'Asset Allocation',
                states: [
                    { id: generateUUID(), name: 'Aggressive (Stocks/Crypto)', outcomes: [{ id: generateUUID(), name: 'High ROI', probability: 65 }] },
                    { id: generateUUID(), name: 'Balanced (60/40)', outcomes: [{ id: generateUUID(), name: 'High ROI', probability: 50 }] },
                    { id: generateUUID(), name: 'Conservative (Bonds)', outcomes: [{ id: generateUUID(), name: 'High ROI', probability: 30 }] },
                ]
            },
            {
                id: generateUUID(),
                name: 'Market Condition',
                states: [
                    { id: generateUUID(), name: 'Bull Market', outcomes: [{ id: generateUUID(), name: 'High ROI', probability: 85 }] },
                    { id: generateUUID(), name: 'Bear Market', outcomes: [{ id: generateUUID(), name: 'High ROI', probability: 20 }] },
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleLoadHealthTemplate = () => {
        setAppMode('health');
        setTargetOutcomeName('Peak Performance');
        setIsHealthChatOpen(true);
        setVariables([
            {
                id: generateUUID(),
                name: 'Diet Protocol',
                states: [
                    { id: generateUUID(), name: 'High Protein / Low Carb', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 75 }] },
                    { id: generateUUID(), name: 'Intermittent Fasting', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 60 }] },
                    { id: generateUUID(), name: 'Standard American Diet', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 15 }] },
                ]
            },
            {
                id: generateUUID(),
                name: 'Sleep Hygiene',
                states: [
                    { id: generateUUID(), name: '8+ Hours Consistent', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 90 }] },
                    { id: generateUUID(), name: '6 Hours Fragmented', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 40 }] },
                ]
            },
            {
                id: generateUUID(),
                name: 'Training Load',
                states: [
                    { id: generateUUID(), name: 'Progressive Overload', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 80 }] },
                    { id: generateUUID(), name: 'Overtraining', outcomes: [{ id: generateUUID(), name: 'Peak Performance', probability: 25 }] },
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleLoadMedicalTemplate = () => {
        setAppMode('medical');
        setTargetOutcomeName('Positive Prognosis');
        setIsMedicalChatOpen(true);
        setVariables([
            {
                id: generateUUID(),
                name: 'Symptom Presentation',
                states: [
                    { id: generateUUID(), name: 'Acute Onset (<24h)', outcomes: [{ id: generateUUID(), name: 'Positive Prognosis', probability: 45 }] },
                    { id: generateUUID(), name: 'Chronic (>2 weeks)', outcomes: [{ id: generateUUID(), name: 'Positive Prognosis', probability: 60 }] }
                ]
            },
            {
                id: generateUUID(),
                name: 'Treatment Adherence',
                states: [
                    { id: generateUUID(), name: 'Strict Adherence', outcomes: [{ id: generateUUID(), name: 'Positive Prognosis', probability: 95 }] },
                    { id: generateUUID(), name: 'Intermittent', outcomes: [{ id: generateUUID(), name: 'Positive Prognosis', probability: 55 }] }
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleLoadProgrammerTemplate = () => {
        setAppMode('programmer');
        setTargetOutcomeName('Ship Product');
        setIsProgrammerChatOpen(true);
        setVariables([
            {
                id: generateUUID(),
                name: 'Tech Stack Selection',
                states: [
                    { id: generateUUID(), name: 'Mature (React/Node)', outcomes: [{ id: generateUUID(), name: 'Ship Product', probability: 90 }] },
                    { id: generateUUID(), name: 'Bleeding Edge (New Framework)', outcomes: [{ id: generateUUID(), name: 'Ship Product', probability: 60 }] }
                ]
            },
            {
                id: generateUUID(),
                name: 'Testing Strategy',
                states: [
                    { id: generateUUID(), name: 'TDD & CI/CD', outcomes: [{ id: generateUUID(), name: 'Ship Product', probability: 95 }] },
                    { id: generateUUID(), name: 'Manual QA Only', outcomes: [{ id: generateUUID(), name: 'Ship Product', probability: 70 }] }
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleLoadMentalTemplate = () => {
        setAppMode('mental');
        setTargetOutcomeName('Inner Balance');
        // Mental mode is now a full page chat, so we don't need to toggle the popup
        setVariables([
            {
                id: generateUUID(),
                name: 'Sleep Quality',
                states: [
                    { id: generateUUID(), name: 'Restful (7-8hrs)', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 85 }] },
                    { id: generateUUID(), name: 'Fragmented / Insomnia', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 40 }] }
                ]
            },
            {
                id: generateUUID(),
                name: 'Social Connection',
                states: [
                    { id: generateUUID(), name: 'Active & Supportive', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 80 }] },
                    { id: generateUUID(), name: 'Isolated', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 35 }] }
                ]
            },
            {
                id: generateUUID(),
                name: 'Mindfulness Practice',
                states: [
                    { id: generateUUID(), name: 'Daily Meditation', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 75 }] },
                    { id: generateUUID(), name: 'Sporadic / None', outcomes: [{ id: generateUUID(), name: 'Inner Balance', probability: 50 }] }
                ]
            }
        ]);
        setAnalysisResult(null);
        setGeminiInsights('');
    };

    const handleClearAll = useCallback(() => {
        if (window.confirm("Are you sure you want to remove all variables? This cannot be undone.")) {
            setVariables([]);
            setAnalysisResult(null);
            setGeminiInsights('');
            setError('');
        }
    }, []);

    const handleReset = useCallback(() => {
        if (window.confirm("Start a new analysis with default template? This will overwrite your current work.")) {
            setAnalysisResult(null);
            setGeminiInsights('');
            setError('');
            setResetKey(prev => prev + 1); 
            setIsMedicalChatOpen(false);
            setIsFinancialChatOpen(false);
            setIsProgrammerChatOpen(false);
            setIsHealthChatOpen(false);
            setIsMentalChatOpen(false);
            
            let defaultTarget = 'Success';
            let defaultVarName = 'New Strategy Variable';
            
            if (appMode === 'financial') {
                defaultTarget = 'High ROI';
                defaultVarName = 'New Financial Factor';
            } else if (appMode === 'health') {
                defaultTarget = 'Peak Performance';
                defaultVarName = 'New Health Habit';
            } else if (appMode === 'medical') {
                defaultTarget = 'Positive Prognosis';
                defaultVarName = 'New Clinical Factor';
            } else if (appMode === 'programmer') {
                defaultTarget = 'Ship Product';
                defaultVarName = 'New Tech Variable';
            } else if (appMode === 'mental') {
                defaultTarget = 'Inner Balance';
                defaultVarName = 'New Life Factor';
            }
            
            setTargetOutcomeName(defaultTarget);

            setVariables([
                {
                    id: generateUUID(),
                    name: defaultVarName,
                    states: [
                        { id: generateUUID(), name: 'Option A', outcomes: [{ id: generateUUID(), name: defaultTarget, probability: 50 }] },
                        { id: generateUUID(), name: 'Option B', outcomes: [{ id: generateUUID(), name: defaultTarget, probability: 50 }] },
                    ]
                }
            ]);
            
            setActiveTab('manual');
            setIsCodeModalOpen(false);
            setIsTerminalOpen(false);
        }
    }, [appMode]);

    const handleAnalyze = useCallback(async () => {
        // Removed strict 'isOnline' check to allow retries even if navigator reports offline erroneously.
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setGeminiInsights('');

        if (!targetOutcomeName.trim()) {
            setError('Validation Error: Please specify a target outcome name (e.g., "Success", "High ROI") before analyzing.');
            setIsLoading(false);
            return;
        }

        if (variables.length === 0) {
            setError('Empty Model: Please add at least one variable to analyze.');
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
                    const outcomeProbability = outcome ? outcome.probability : 0;

                    generateCombinations(
                        index + 1,
                        [...currentCombination, { variableName: variable.name, stateName: state.name, baseProbability: outcomeProbability }],
                        currentProbability * (outcomeProbability / 100)
                    );
                }
            };

            generateCombinations(0, [], 1);
            
            if (combinations.length === 0) {
                throw new Error("Model Mismatch: Could not find any paths leading to '" + targetOutcomeName + "'. Ensure your variable outcomes match this target name exactly.");
            }

            const best = combinations.reduce((max, current) => current.probability > max.probability ? current : max, combinations[0]);

            const result: AnalysisResult = {
                bestCombination: best.combination,
                highestProbability: best.probability,
                outcomeName: targetOutcomeName
            };
            setAnalysisResult(result);
            
            // Gemini Insights
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
    }, [variables, targetOutcomeName, appMode]);
    
    const handleAddVariable = (newVariable: Variable) => {
        setVariables(prevVariables => [...prevVariables, newVariable]);
        setActiveTab('manual');
    };

    const handleBatchVariables = (newVariables: Variable[]) => {
        setVariables(prev => [...prev, ...newVariables]);
        setActiveTab('manual');
    };

    const modes = ['general', 'financial', 'health', 'medical', 'programmer', 'mental'] as const;

    const navigateMode = (direction: 'left' | 'right') => {
        const currentIndex = modes.indexOf(appMode);
        let newIndex;
        if (direction === 'right') {
            newIndex = (currentIndex + 1) % modes.length;
        } else {
            newIndex = (currentIndex - 1 + modes.length) % modes.length;
        }
        setAppMode(modes[newIndex]);
        
        // Scroll logic to keep button in view
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const buttons = container.querySelectorAll('button');
            if (buttons[newIndex]) {
                 buttons[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    };

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
            case 'medical': return {
                text: 'text-indigo-400',
                bg: 'bg-indigo-900',
                border: 'border-indigo-500',
                hover: 'hover:text-indigo-300',
                btn: 'bg-indigo-600 hover:bg-indigo-500',
                focus: 'focus:ring-indigo-500'
            };
            case 'programmer': return {
                text: 'text-lime-400',
                bg: 'bg-lime-900',
                border: 'border-lime-500',
                hover: 'hover:text-lime-300',
                btn: 'bg-lime-600 hover:bg-lime-500',
                focus: 'focus:ring-lime-500'
            };
            case 'mental': return {
                text: 'text-amber-400',
                bg: 'bg-amber-900',
                border: 'border-amber-500',
                hover: 'hover:text-amber-300',
                btn: 'bg-amber-600 hover:bg-amber-500',
                focus: 'focus:ring-amber-500'
            };
            default: return {
                text: 'text-cyan-400',
                bg: 'bg-gray-700', 
                border: 'border-cyan-500',
                hover: 'hover:text-cyan-300',
                btn: 'bg-cyan-600 hover:bg-cyan-500',
                focus: 'focus:ring-cyan-500'
            };
        }
    };

    const theme = getThemeColors();

    const TabButton: React.FC<{tabName: 'manual' | 'ai' | 'price_action'; label: string;}> = ({ tabName, label }) => (
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

    const ModeButton = ({ mode, label, icon, activeColor, onClick }: { mode: string, label: string, icon?: React.ReactNode, activeColor: string, onClick: () => void }) => {
        const isActive = appMode === mode;
        return (
            <button 
                onClick={onClick}
                className={`
                    relative snap-center shrink-0 rounded-full text-sm font-bold transition-all duration-500 flex items-center gap-2 border-4 border-gray-900 select-none
                    px-5 py-3 -ml-5 first:ml-0
                    ${isActive 
                        ? `${activeColor} text-white shadow-2xl shadow-black/50 scale-110 z-30 translate-x-2` 
                        : 'bg-gray-800 text-gray-500 scale-90 z-0 opacity-70 hover:opacity-100 hover:scale-95 hover:z-20'
                    }
                    md:ml-0 md:gap-2 md:px-4 md:py-2 md:border-0 md:scale-100 md:opacity-100 md:z-auto md:bg-transparent md:translate-x-0
                    ${isActive 
                        ? 'md:shadow-[0_0_15px_rgba(0,0,0,0.3)] md:translate-x-0' 
                        : 'md:bg-gray-800 md:text-gray-500 md:hover:bg-gray-700 md:hover:text-gray-300'
                    }
                `}
            >
                {icon}
                <span className={`${isActive ? 'block' : 'hidden sm:block'} transition-all whitespace-nowrap`}>{label}</span>
                
                {mode === 'health' && <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-tighter z-40 shadow">PRO</span>}
                {mode === 'medical' && <span className="absolute -top-1 -right-1 bg-indigo-400 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-tighter z-40 shadow">MED</span>}
            </button>
        );
    };

    if (showSplash) {
        return <DNAStartup onComplete={() => setShowSplash(false)} />;
    }

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
                     <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-lg border border-red-600/50">
                        <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                             <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-red-500 mb-4">Security Alert</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button onClick={() => window.location.reload()} className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold">Reload Application</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative transition-colors duration-500">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <Header onOpenTerms={handleOpenTerms} onOpenTerminal={() => setIsTerminalOpen(!isTerminalOpen)} />
            
            <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 py-2 shadow-2xl">
                <div className="container mx-auto relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900 to-transparent z-20 pointer-events-none md:hidden" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-20 pointer-events-none md:hidden" />

                    {/* Navigation Arrows */}
                    <button 
                        onClick={() => navigateMode('left')}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-30 bg-gray-800/90 p-1.5 rounded-full text-white shadow-lg border border-gray-700 md:hidden active:scale-95 transition-all opacity-70 hover:opacity-100"
                        aria-label="Previous Mode"
                    >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <button 
                        onClick={() => navigateMode('right')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-30 bg-gray-800/90 p-1.5 rounded-full text-white shadow-lg border border-gray-700 md:hidden active:scale-95 transition-all opacity-90 hover:opacity-100"
                        aria-label="Next Mode"
                    >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <div className="flex items-center justify-between overflow-hidden">
                        <div ref={scrollContainerRef} className="flex-grow flex overflow-x-auto snap-x snap-mandatory no-scrollbar items-center px-8 py-4 min-h-[80px] md:px-4 md:gap-4 md:justify-center md:py-1 md:min-h-0 scroll-smooth">
                            <ModeButton 
                                mode="general" 
                                label="General Strategy" 
                                activeColor="bg-cyan-600"
                                onClick={() => setAppMode('general')} 
                            />
                            <ModeButton 
                                mode="financial" 
                                label="Financial Adviser" 
                                activeColor="bg-emerald-600"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                onClick={() => setAppMode('financial')} 
                            />
                            <ModeButton 
                                mode="health" 
                                label="Health & Sport" 
                                activeColor="bg-rose-600"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                                onClick={() => setAppMode('health')} 
                            />
                            <ModeButton 
                                mode="medical" 
                                label="Medical Research" 
                                activeColor="bg-indigo-600"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                onClick={() => setAppMode('medical')} 
                            />
                            <ModeButton 
                                mode="programmer" 
                                label="Programmer Finds" 
                                activeColor="bg-lime-600"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                                onClick={() => setAppMode('programmer')} 
                            />
                             <ModeButton 
                                mode="mental" 
                                label="Mental Awareness" 
                                activeColor="bg-amber-600"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                onClick={() => setAppMode('mental')} 
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 pt-1 flex justify-center">
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
                    {appMode === 'medical' && (
                         <button onClick={handleLoadMedicalTemplate} className="text-xs text-indigo-400 hover:text-indigo-300 underline decoration-dotted">
                             Populate Clinical Template
                         </button>
                    )}
                    {appMode === 'programmer' && (
                         <button onClick={handleLoadProgrammerTemplate} className="text-xs text-lime-400 hover:text-lime-300 underline decoration-dotted">
                             Populate Tech Template
                         </button>
                    )}
                    {appMode === 'mental' && (
                         <span className="text-xs text-amber-400 animate-pulse">
                             Safe Sanctuary Mode Active
                         </span>
                    )}
                </div>
            </div>

            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
                {appMode === 'mental' ? (
                    <div className="flex-grow flex flex-col items-center justify-center h-full">
                        <div className="w-full h-[calc(100vh-200px)] max-h-[800px]">
                             <MentalChat isOpen={true} onClose={() => {}} isFullPage={true} />
                        </div>
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className={`bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col border-t-4 ${theme.border}`}>
                        <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>
                            1. {appMode === 'medical' ? 'Clinical Factors & Symptoms' : appMode === 'health' ? 'Bio-Metrics & Routines' : appMode === 'financial' ? 'Portfolio & Risk Factors' : appMode === 'programmer' ? 'Tech Stack & Decisions' : 'Define Variables & Outcomes'}
                        </h2>
                        <div className="mb-6">
                            <label htmlFor="targetOutcome" className="block text-sm font-medium text-gray-300 mb-2">
                                {appMode === 'medical' ? 'Clinical Goal (e.g., Accurate Diagnosis, Recovery)' : appMode === 'health' ? 'Performance Goal (e.g., Weight Loss, Hypertrophy)' : appMode === 'financial' ? 'Financial Goal (e.g., High ROI, Solvency)' : appMode === 'programmer' ? 'Engineering Goal (e.g., Ship Product, Scalability)' : 'Target Outcome Name'}
                            </label>
                            <input
                                id="targetOutcome"
                                type="text"
                                value={targetOutcomeName}
                                onChange={(e) => setTargetOutcomeName(e.target.value)}
                                placeholder={appMode === 'medical' ? "e.g., Disease Remission" : appMode === 'health' ? "e.g., Sub-3 Hour Marathon" : appMode === 'financial' ? "e.g., Maximize Returns" : appMode === 'programmer' ? "e.g., Ship on Time" : "e.g., Success, Sale, Conversion"}
                                className={`w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:ring-2 transition ${theme.focus}`}
                            />
                        </div>
                        
                        <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                            <TabButton tabName="manual" label="Manual Input" />
                            <TabButton tabName="ai" label="AI Assistant (Link)" />
                            {appMode === 'financial' && <TabButton tabName="price_action" label="Price Action" />}
                        </div>

                        <div className="flex-grow">
                            {activeTab === 'manual' ? (
                                <VariableInputList 
                                    variables={variables} 
                                    setVariables={setVariables} 
                                    onClearAll={handleClearAll}
                                />
                            ) : activeTab === 'ai' ? (
                                <LinkAnalyzer 
                                    onVariableGenerated={handleAddVariable} 
                                    onSecurityRisk={handleSecurityRisk} 
                                    isOnline={true}
                                    mode={appMode}
                                />
                            ) : (
                                <PriceActionAnalyzer
                                    onVariableGenerated={handleAddVariable}
                                    onSecurityRisk={handleSecurityRisk}
                                    isOnline={true}
                                />
                            )}
                        </div>
                    </div>
                    <div className={`bg-gray-800 p-6 rounded-lg shadow-2xl border-t-4 ${theme.border} relative`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-2xl font-bold ${theme.text}`}>
                                2. {appMode === 'medical' ? 'Clinical Analysis' : appMode === 'health' ? 'Performance Analysis' : appMode === 'financial' ? 'Advisory & Forecast' : appMode === 'programmer' ? 'Architecture Review' : 'Analysis & Impact'}
                            </h2>
                            {(appMode === 'medical' || appMode === 'financial' || appMode === 'programmer' || appMode === 'health') && (
                                <button 
                                    onClick={() => appMode === 'medical' ? setIsMedicalChatOpen(true) : appMode === 'financial' ? setIsFinancialChatOpen(true) : appMode === 'programmer' ? setIsProgrammerChatOpen(true) : setIsHealthChatOpen(true)}
                                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse ${
                                        appMode === 'medical' 
                                        ? 'bg-indigo-700 hover:bg-indigo-600 text-white' 
                                        : appMode === 'financial'
                                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                        : appMode === 'programmer'
                                        ? 'bg-lime-700 hover:bg-lime-600 text-white'
                                        : 'bg-rose-700 hover:bg-rose-600 text-white'
                                    }`}
                                >
                                    {appMode === 'programmer' ? (
                                        <>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            Dev Mate
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            {appMode === 'medical' ? 'Medical AI' : appMode === 'health' ? 'Sports Sci AI' : 'ICT Analyst'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        
                        <div className="h-full flex flex-col">
                            {error && (
                                <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3 animate-in slide-in-from-top-2 shadow-lg backdrop-blur-sm">
                                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-red-100 text-sm uppercase tracking-wide mb-1">Analysis Interrupted</h3>
                                        <p className="text-sm leading-relaxed opacity-90">{error}</p>
                                    </div>
                                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-100 transition-colors" title="Dismiss Error">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                            <ResultsDisplay 
                                result={analysisResult} 
                                insights={geminiInsights} 
                                isLoading={isLoading}
                                variables={variables}
                                mode={appMode}
                                onExportCpp={() => setIsCodeModalOpen(true)}
                            />
                        </div>
                    </div>
                </div>
                )}

                {appMode === 'financial' && (
                    <NotebookSection 
                        mode="financial"
                        title="Financial Strategy Core"
                        description="Access the dedicated deep-learning knowledge base. Contains processed financial whitepapers, historical backtest data, and granular ICT strategy documentation."
                        url="https://notebooklm.google.com/notebook/f5f77cf4-d41e-4937-9b67-2a718b601c2c"
                        addons={[
                            {
                                name: "Economic Calendar",
                                description: "Live data for major economic events.",
                                icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                                url: "https://www.forexfactory.com/calendar"
                            },
                            {
                                name: "Fed Rates Watch",
                                description: "Interest rate probabilities.",
                                icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
                                url: "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html"
                            }
                        ]}
                    />
                )}

                {appMode === 'programmer' && (
                    <NotebookSection 
                        mode="programmer"
                        title="Programmer Finds Knowledge Base"
                        description="Explore curated technical resources, coding patterns, and research papers sourced from the 'Programmer Finds' notebook. Supplement your architecture decisions with fun, deep-dive add-ons."
                        url="https://notebooklm.google.com/notebook/ad175927-4682-45f7-909b-778e6362b41f"
                        addons={[
                            {
                                name: "Dark Mode Patterns",
                                description: "UI/UX inspiration for dark-themed apps.",
                                icon: <svg className="w-5 h-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
                                url: "https://dribbble.com/search/dark-mode"
                            },
                            {
                                name: "Lofi Beats for Coding",
                                description: "Focus music to boost productivity.",
                                icon: <svg className="w-5 h-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
                                url: "https://www.youtube.com/watch?v=jfKfPfyJRdk"
                            },
                            {
                                name: "Algorithm Visualizer",
                                description: "Interactive visualizations of complex algos.",
                                icon: <svg className="w-5 h-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
                                url: "https://visualgo.net/en"
                            }
                        ]}
                    />
                )}

                {appMode === 'financial' && (
                    <div className="mt-8">
                        <TradaysCalendar />
                    </div>
                )}
            </main>
            
            <GeminiTerminal 
                key={`terminal-${resetKey}`}
                isOpen={isTerminalOpen} 
                onClose={() => setIsTerminalOpen(false)} 
                onExecute={handleBatchVariables}
                variables={variables}
            />

            <MedicalChat 
                key={`med-chat-${resetKey}`}
                isOpen={isMedicalChatOpen}
                onClose={() => setIsMedicalChatOpen(false)}
            />

            <FinancialChat 
                key={`fin-chat-${resetKey}`}
                isOpen={isFinancialChatOpen}
                onClose={() => setIsFinancialChatOpen(false)}
            />

            <ProgrammerChat
                key={`prog-chat-${resetKey}`}
                isOpen={isProgrammerChatOpen}
                onClose={() => setIsProgrammerChatOpen(false)}
            />

            <HealthChat
                key={`health-chat-${resetKey}`}
                isOpen={isHealthChatOpen}
                onClose={() => setIsHealthChatOpen(false)}
            />

            {/* MentalChat is managed in the main view for 'mental' mode, but kept here as a modal for cross-mode access if needed or removed if exclusive */}
            {/* We only render the modal version if we are NOT in mental mode, to prevent duplication */}
            {appMode !== 'mental' && (
                <MentalChat
                    key={`mental-chat-${resetKey}`}
                    isOpen={isMentalChatOpen}
                    onClose={() => setIsMentalChatOpen(false)}
                />
            )}

            <CodeExportModal 
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                variables={variables}
            />

            {appMode !== 'mental' && (
            <footer className="sticky bottom-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700 z-10">
                <div className="container mx-auto flex flex-col md:flex-row justify-center items-center gap-4">
                    <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="w-full md:w-auto px-8 py-3 rounded-lg font-bold text-gray-400 border-2 border-gray-700 hover:border-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                    >
                        Reset to Template
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className={`w-full md:w-1/2 lg:w-1/3 font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform transition-all duration-300 ease-in-out ${
                            isLoading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : `${theme.btn} text-white hover:scale-105`
                        }`}
                    >
                        {isLoading ? 'Analyzing...' : `Generate ${appMode === 'medical' ? 'Clinical Report' : appMode === 'health' ? 'Health Report' : appMode === 'financial' ? 'Financial Plan' : appMode === 'programmer' ? 'Engineering Plan' : 'Analysis'}`}
                    </button>
                </div>
            </footer>
            )}
        </div>
    );
};

export default App;
