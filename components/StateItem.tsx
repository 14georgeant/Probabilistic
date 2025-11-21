
import React, { useState } from 'react';
import { VariableState, Outcome } from '../types';

// Icons
const DragHandleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
    </svg>
);
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const WarningIcon = () => (
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);
const ScaleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>
);

interface StateItemProps {
    variableId: string;
    state: VariableState;
    index: number;
    onUpdate: (stateId: string, data: Partial<VariableState>) => void;
    onRemove: (stateId: string) => void;
    onAddOutcome: (stateId: string) => void;
    onRemoveOutcome: (stateId: string, outcomeId: string) => void;
    onUpdateOutcome: (stateId: string, outcomeId: string, data: Partial<Outcome>) => void;
    
    // DnD Props
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnter?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
}

export const StateItem: React.FC<StateItemProps> = ({
    variableId,
    state,
    index,
    onUpdate,
    onRemove,
    onAddOutcome,
    onRemoveOutcome,
    onUpdateOutcome,
    draggable,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onDragOver
}) => {
    const isStateNameEmpty = !state.name.trim();
    const totalProbability = state.outcomes.reduce((sum, o) => sum + o.probability, 0);
    const isTotalValid = totalProbability === 100;
    const [isHandleHovered, setIsHandleHovered] = useState(false);

    const handleDistributeEvenly = () => {
        if (state.outcomes.length === 0) return;
        const count = state.outcomes.length;
        const baseProb = Math.floor(100 / count);
        let remainder = 100 % count;
        
        const newOutcomes = state.outcomes.map((outcome, idx) => ({
            ...outcome,
            probability: baseProb + (idx < remainder ? 1 : 0)
        }));
        
        onUpdate(state.id, { outcomes: newOutcomes });
    };

    return (
        <div 
            draggable={draggable && isHandleHovered}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            className={`bg-gray-700/30 rounded-lg border overflow-hidden transition-all duration-200 ${
                isStateNameEmpty ? 'border-red-500/30' : 'border-gray-600/50 hover:border-gray-500/50'
            } ${draggable && isHandleHovered ? 'cursor-grab active:cursor-grabbing ring-1 ring-cyan-500/30 shadow-xl' : ''}`}
        >
            {/* State Header */}
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 border-b border-gray-600/50">
                <div 
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-600 rounded cursor-grab active:cursor-grabbing transition-colors"
                    onMouseEnter={() => setIsHandleHovered(true)}
                    onMouseLeave={() => setIsHandleHovered(false)}
                    title="Drag to reorder"
                >
                    <DragHandleIcon className="w-4 h-4" />
                </div>
                
                <span className="text-[10px] font-mono font-bold text-cyan-500/70 bg-cyan-900/20 px-2 py-1 rounded select-none uppercase tracking-wider">State {String.fromCharCode(65 + index)}</span>
                
                <div className="flex-grow relative">
                    <input 
                        value={state.name} 
                        onChange={(e) => onUpdate(state.id, { name: e.target.value })}
                        className={`w-full bg-transparent font-medium text-gray-200 focus:outline-none border-b-2 transition-all placeholder-gray-500 ${
                            isStateNameEmpty
                            ? 'border-red-500/50 focus:border-red-500 placeholder-red-400/30'
                            : 'border-transparent focus:border-cyan-500/50'
                        }`}
                        placeholder="State Name (e.g., High Growth)"
                    />
                        {isStateNameEmpty && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                            <WarningIcon />
                        </div>
                    )}
                </div>
                
                <button onClick={() => onRemove(state.id)} className="text-xs text-gray-500 hover:text-red-400 hover:bg-gray-700 px-2 py-1 rounded transition-colors">
                    Remove
                </button>
            </div>
            
            {/* Outcomes Area */}
            <div className="bg-black/20 rounded-b-lg p-2 space-y-2">
                
                {/* Outcome Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2 mb-1 select-none">
                    <div className="col-span-6 sm:col-span-7">Outcome Scenario</div>
                    <div className="col-span-4 sm:col-span-4 text-right flex justify-end items-center gap-1">
                        Probability
                        <button 
                            onClick={handleDistributeEvenly}
                            className="text-gray-500 hover:text-cyan-400 transition-colors p-0.5 rounded hover:bg-cyan-500/10"
                            title="Distribute 100% evenly across all outcomes"
                        >
                            <ScaleIcon />
                        </button>
                    </div>
                    <div className="col-span-2 sm:col-span-1"></div>
                </div>

                {/* Outcomes List */}
                {state.outcomes.map((outcome) => {
                    const isOutcomeNameEmpty = !outcome.name.trim();
                    return (
                        <div key={outcome.id} className="grid grid-cols-12 gap-2 items-center bg-gray-700/30 hover:bg-gray-700/50 rounded-md p-2 transition-colors group/outcome relative overflow-hidden">
                             
                             {/* Progress Background */}
                             <div 
                                className="absolute inset-y-0 left-0 bg-cyan-500/5 transition-all duration-500 pointer-events-none z-0" 
                                style={{ width: `${outcome.probability}%` }}
                             />

                             {/* Name Input */}
                             <div className="col-span-6 sm:col-span-7 relative z-10 flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOutcomeNameEmpty ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                <input 
                                    value={outcome.name}
                                    onChange={(e) => onUpdateOutcome(state.id, outcome.id, { name: e.target.value })}
                                    className={`w-full bg-transparent text-sm focus:outline-none py-1 ${isOutcomeNameEmpty ? 'placeholder-red-400/50 text-red-300' : 'placeholder-gray-600 text-gray-200'}`}
                                    placeholder="Outcome Name (e.g. Success)"
                                />
                             </div>

                             {/* Probability Input */}
                             <div className="col-span-4 sm:col-span-4 relative z-10 flex items-center justify-end gap-3">
                                <input 
                                    type="range" min="0" max="100"
                                    value={outcome.probability}
                                    onChange={(e) => onUpdateOutcome(state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 hidden sm:block opacity-60 hover:opacity-100 transition-opacity"
                                />
                                <div className="relative w-10 text-right">
                                    <input 
                                        type="number" min="0" max="100"
                                        value={outcome.probability}
                                        onChange={(e) => onUpdateOutcome(state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                        className={`w-full bg-transparent text-right font-mono text-sm focus:outline-none ${isTotalValid ? 'text-cyan-400 focus:text-cyan-300' : 'text-yellow-400 focus:text-yellow-300'}`}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-600 pointer-events-none">%</span>
                             </div>

                             {/* Delete Action */}
                             <div className="col-span-2 sm:col-span-1 relative z-10 text-center">
                                <button 
                                    onClick={() => onRemoveOutcome(state.id, outcome.id)} 
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover/outcome:opacity-100 transition-opacity p-1.5 rounded hover:bg-gray-700/50"
                                    title="Remove Outcome"
                                >
                                    <XIcon />
                                </button>
                             </div>
                        </div>
                    );
                })}

                <div className="flex justify-between items-center gap-4 pt-2">
                    <button 
                        onClick={() => onAddOutcome(state.id)} 
                        className="flex-grow py-2 text-xs font-bold text-gray-500 hover:text-cyan-400 border border-dashed border-gray-700 hover:border-cyan-500/30 rounded hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 group"
                    >
                        <PlusIcon className="w-3 h-3 group-hover:scale-110 transition-transform" /> 
                        Add Outcome Scenario
                    </button>

                    {state.outcomes.length > 0 && (
                        <div className={`text-[10px] font-mono font-bold px-2 py-1 rounded border flex items-center gap-2 ${
                            isTotalValid 
                            ? 'text-gray-500 border-transparent' 
                            : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5 animate-pulse'
                        }`} title={isTotalValid ? "Probabilities sum to 100%" : "Probabilities should sum to 100%"}>
                             {!isTotalValid && <WarningIcon />}
                             Total: {totalProbability}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
