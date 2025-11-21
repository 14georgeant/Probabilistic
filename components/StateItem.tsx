import React from 'react';
import { VariableState, Outcome } from '../types';

// Icons
const ChevronUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
);
const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
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

interface StateItemProps {
    variableId: string;
    state: VariableState;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (stateId: string, data: Partial<VariableState>) => void;
    onRemove: (stateId: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onAddOutcome: (stateId: string) => void;
    onRemoveOutcome: (stateId: string, outcomeId: string) => void;
    onUpdateOutcome: (stateId: string, outcomeId: string, data: Partial<Outcome>) => void;
}

export const StateItem: React.FC<StateItemProps> = ({
    variableId,
    state,
    index,
    isFirst,
    isLast,
    onUpdate,
    onRemove,
    onMove,
    onAddOutcome,
    onRemoveOutcome,
    onUpdateOutcome
}) => {
    const isStateNameEmpty = !state.name.trim();

    return (
        <div className={`bg-gray-700/30 rounded-lg border overflow-hidden transition-all hover:border-gray-500/50 ${isStateNameEmpty ? 'border-red-500/30' : 'border-gray-600/50'}`}>
            {/* State Header */}
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 border-b border-gray-600/50">
                <div className="flex items-center gap-0.5 bg-gray-800 rounded p-0.5 border border-gray-700">
                    <button onClick={() => onMove(index, 'up')} disabled={isFirst} className="p-1 text-gray-400 hover:text-white disabled:opacity-20"><ChevronUpIcon className="w-3 h-3"/></button>
                    <button onClick={() => onMove(index, 'down')} disabled={isLast} className="p-1 text-gray-400 hover:text-white disabled:opacity-20"><ChevronDownIcon className="w-3 h-3"/></button>
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
            <div className="p-3 bg-black/20 rounded-b-lg">
                {/* Outcomes Header */}
                <div className="grid grid-cols-12 gap-4 px-2 mb-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    <div className="col-span-7">Outcome Scenario</div>
                    <div className="col-span-5 text-right pr-8">Probability</div>
                </div>

                <div className="space-y-2">
                    {state.outcomes.map((outcome) => {
                        const isOutcomeNameEmpty = !outcome.name.trim();
                        return (
                        <div key={outcome.id} className="group/outcome relative flex items-center bg-gray-800/40 rounded border border-transparent hover:border-gray-600 transition-all overflow-hidden">
                            {/* Progress Bar BG */}
                            <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 transition-all duration-500 pointer-events-none" 
                                style={{ width: `${outcome.probability}%` }}
                            />
                            
                            <div className="relative z-10 grid grid-cols-12 gap-4 w-full p-2 items-center">
                                {/* Name Input */}
                                <div className="col-span-7 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOutcomeNameEmpty ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                    <input 
                                        value={outcome.name}
                                        onChange={(e) => onUpdateOutcome(state.id, outcome.id, { name: e.target.value })}
                                        className={`w-full bg-transparent text-sm focus:outline-none ${isOutcomeNameEmpty ? 'placeholder-red-400/50 text-red-300' : 'placeholder-gray-600 text-gray-200'}`}
                                        placeholder="Outcome Name (e.g. Success)"
                                    />
                                </div>

                                {/* Probability Controls */}
                                <div className="col-span-5 flex items-center justify-end gap-3">
                                    <input 
                                        type="range" min="0" max="100"
                                        value={outcome.probability}
                                        onChange={(e) => onUpdateOutcome(state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                        className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hidden sm:block"
                                    />
                                    <div className="relative w-10">
                                        <input 
                                            type="number" min="0" max="100"
                                            value={outcome.probability}
                                            onChange={(e) => onUpdateOutcome(state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                            className="w-full bg-transparent text-right font-mono text-sm text-cyan-400 focus:outline-none"
                                        />
                                        <span className="absolute top-0 right-[-8px] text-[10px] text-gray-600 pointer-events-none">%</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => onRemoveOutcome(state.id, outcome.id)} 
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover/outcome:opacity-100 transition-opacity p-1"
                                    >
                                        <XIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
                
                <button 
                    onClick={() => onAddOutcome(state.id)} 
                    className="mt-3 w-full py-1.5 text-xs font-bold text-gray-500 hover:text-cyan-400 border border-dashed border-gray-700 hover:border-cyan-500/30 rounded hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-1"
                >
                    <PlusIcon className="w-3 h-3" /> Add Outcome Scenario
                </button>
            </div>
        </div>
    );
};