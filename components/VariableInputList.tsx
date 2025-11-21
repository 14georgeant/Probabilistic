import React from 'react';
import { Variable, VariableState, Outcome } from '../types';

interface VariableInputListProps {
    variables: Variable[];
    setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
}

const VariableInputList: React.FC<VariableInputListProps> = ({ variables, setVariables }) => {

    // --- CRUD Operations ---

    const addVariable = () => {
        const newVariable: Variable = {
            id: crypto.randomUUID(),
            name: `Variable ${variables.length + 1}`,
            states: [
                { id: crypto.randomUUID(), name: 'State A', outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 50 }] }
            ]
        };
        setVariables([...variables, newVariable]);
    };

    const removeVariable = (id: string) => {
        if (confirm('Are you sure you want to delete this variable?')) {
            setVariables(variables.filter(v => v.id !== id));
        }
    };

    const updateVariable = (id: string, updatedVariable: Partial<Variable>) => {
        setVariables(variables.map(v => v.id === id ? { ...v, ...updatedVariable } : v));
    };

    const addState = (variableId: string) => {
        setVariables(variables.map(v => {
            if (v.id === variableId) {
                const newState: VariableState = {
                    id: crypto.randomUUID(),
                    name: `State ${String.fromCharCode(65 + v.states.length)}`,
                    outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 50 }]
                };
                return { ...v, states: [...v.states, newState] };
            }
            return v;
        }));
    };

    const removeState = (variableId: string, stateId: string) => {
        setVariables(variables.map(v =>
            v.id === variableId
                ? { ...v, states: v.states.filter(s => s.id !== stateId) }
                : v
        ));
    };

    const updateState = (variableId: string, stateId: string, updatedState: Partial<VariableState>) => {
        setVariables(variables.map(v =>
            v.id === variableId
                ? { ...v, states: v.states.map(s => s.id === stateId ? { ...s, ...updatedState } : s) }
                : v
        ));
    };

    const addOutcome = (variableId: string, stateId: string) => {
        setVariables(variables.map(v => {
            if (v.id === variableId) {
                return {
                    ...v,
                    states: v.states.map(s => {
                        if (s.id === stateId) {
                            return {
                                ...s,
                                outcomes: [
                                    ...s.outcomes,
                                    {
                                        id: crypto.randomUUID(),
                                        name: 'Success',
                                        probability: 50
                                    }
                                ]
                            };
                        }
                        return s;
                    })
                };
            }
            return v;
        }));
    };

    const removeOutcome = (variableId: string, stateId: string, outcomeId: string) => {
        setVariables(variables.map(v =>
            v.id === variableId
                ? {
                    ...v,
                    states: v.states.map(s =>
                        s.id === stateId
                            ? { ...s, outcomes: s.outcomes.filter(o => o.id !== outcomeId) }
                            : s
                    )
                }
                : v
        ));
    };

    const updateOutcome = (variableId: string, stateId: string, outcomeId: string, updatedOutcome: Partial<Outcome>) => {
        setVariables(variables.map(v =>
            v.id === variableId
                ? {
                    ...v, states: v.states.map(s =>
                        s.id === stateId
                            ? { ...s, outcomes: s.outcomes.map(o => o.id === outcomeId ? { ...o, ...updatedOutcome } : o) }
                            : s
                    )
                }
                : v
        ));
    };

    // --- Reordering Logic ---

    const moveVariable = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === variables.length - 1)) return;
        
        setVariables(prev => {
            const newVars = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newVars[index], newVars[targetIndex]] = [newVars[targetIndex], newVars[index]];
            return newVars;
        });
    };

    const moveState = (variableId: string, stateIndex: number, direction: 'up' | 'down') => {
        setVariables(prev => prev.map(v => {
            if (v.id !== variableId) return v;
            if ((direction === 'up' && stateIndex === 0) || (direction === 'down' && stateIndex === v.states.length - 1)) return v;

            const newStates = [...v.states];
            const targetIndex = direction === 'up' ? stateIndex - 1 : stateIndex + 1;
            [newStates[stateIndex], newStates[targetIndex]] = [newStates[targetIndex], newStates[stateIndex]];
            
            return { ...v, states: newStates };
        }));
    };

    // --- Icons ---

    const ChevronUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
    );
    const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
    );
    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
    );
    const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
    );
    const XIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    );
    const WarningIcon = () => (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    );

    return (
        <div className="space-y-8">
            {variables.map((variable, vIndex) => {
                const isVarNameEmpty = !variable.name.trim();
                
                return (
                <div key={variable.id} className={`bg-gray-800 rounded-xl border shadow-lg overflow-hidden group/var transition-all hover:border-gray-600 ${isVarNameEmpty ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-gray-700'}`}>
                    
                    {/* Variable Header */}
                    <div className="bg-gray-900/80 p-4 border-b border-gray-700 flex items-center gap-4">
                        {/* Reorder Controls */}
                        <div className="flex flex-col gap-1">
                           <button 
                                onClick={() => moveVariable(vIndex, 'up')} 
                                disabled={vIndex === 0} 
                                className="text-gray-600 hover:text-cyan-400 disabled:opacity-20 transition-colors p-0.5 rounded hover:bg-gray-800"
                                title="Move Variable Up"
                            >
                                <ChevronUpIcon className="w-4 h-4" />
                           </button>
                           <button 
                                onClick={() => moveVariable(vIndex, 'down')} 
                                disabled={vIndex === variables.length - 1} 
                                className="text-gray-600 hover:text-cyan-400 disabled:opacity-20 transition-colors p-0.5 rounded hover:bg-gray-800"
                                title="Move Variable Down"
                            >
                                <ChevronDownIcon className="w-4 h-4" />
                           </button>
                        </div>

                        {/* Name Input */}
                        <div className="flex-grow relative">
                            <div className="flex justify-between items-end mb-1">
                                <label className={`text-[10px] uppercase tracking-wider font-bold block transition-colors ${isVarNameEmpty ? 'text-red-400' : 'text-gray-500'}`}>
                                    Variable Name
                                </label>
                                {isVarNameEmpty && <span className="text-[10px] text-red-400 font-bold animate-pulse">Required</span>}
                            </div>
                            <input
                                type="text"
                                value={variable.name}
                                onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                                className={`bg-transparent text-xl font-bold text-white w-full focus:outline-none border-b-2 transition-all placeholder-gray-600 pb-1 ${
                                    isVarNameEmpty 
                                    ? 'border-red-500/80 focus:border-red-500 placeholder-red-400/30' 
                                    : 'border-transparent focus:border-cyan-500/50'
                                }`}
                                placeholder="e.g. Market Condition"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center pl-4 border-l border-gray-700 ml-2">
                            <button 
                                onClick={() => removeVariable(variable.id)} 
                                className="text-gray-500 hover:text-red-400 p-2 hover:bg-gray-800 rounded-lg transition-colors" 
                                title="Delete Variable"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>

                    {/* Variable Content (States) */}
                    <div className="p-4 bg-gray-800/50 space-y-4">
                         {variable.states.map((state, sIndex) => {
                             const isStateNameEmpty = !state.name.trim();
                             return (
                             <div key={state.id} className={`bg-gray-700/30 rounded-lg border overflow-hidden transition-all hover:border-gray-500/50 ${isStateNameEmpty ? 'border-red-500/30' : 'border-gray-600/50'}`}>
                                 
                                 {/* State Header */}
                                 <div className="flex items-center gap-3 p-3 bg-gray-700/50 border-b border-gray-600/50">
                                     <div className="flex items-center gap-0.5 bg-gray-800 rounded p-0.5 border border-gray-700">
                                         <button onClick={() => moveState(variable.id, sIndex, 'up')} disabled={sIndex === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-20"><ChevronUpIcon className="w-3 h-3"/></button>
                                         <button onClick={() => moveState(variable.id, sIndex, 'down')} disabled={sIndex === variable.states.length - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-20"><ChevronDownIcon className="w-3 h-3"/></button>
                                     </div>
                                     
                                     <span className="text-[10px] font-mono font-bold text-cyan-500/70 bg-cyan-900/20 px-2 py-1 rounded select-none uppercase tracking-wider">State {String.fromCharCode(65 + sIndex)}</span>
                                     
                                     <div className="flex-grow relative">
                                         <input 
                                             value={state.name} 
                                             onChange={(e) => updateState(variable.id, state.id, { name: e.target.value })}
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
                                     
                                     <button onClick={() => removeState(variable.id, state.id)} className="text-xs text-gray-500 hover:text-red-400 hover:bg-gray-700 px-2 py-1 rounded transition-colors">
                                         Remove
                                     </button>
                                 </div>
                                 
                                 {/* Outcomes Area */}
                                 <div className="p-3 bg-black/20 rounded-b-lg">
                                     {/* Outcomes Header - improved */}
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
                                                             onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { name: e.target.value })}
                                                             className={`w-full bg-transparent text-sm focus:outline-none ${isOutcomeNameEmpty ? 'placeholder-red-400/50 text-red-300' : 'placeholder-gray-600 text-gray-200'}`}
                                                             placeholder="Outcome Name (e.g. Success)"
                                                         />
                                                     </div>

                                                     {/* Probability Controls */}
                                                     <div className="col-span-5 flex items-center justify-end gap-3">
                                                         <input 
                                                             type="range" min="0" max="100"
                                                             value={outcome.probability}
                                                             onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                             className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hidden sm:block"
                                                         />
                                                         <div className="relative w-10">
                                                             <input 
                                                                 type="number" min="0" max="100"
                                                                 value={outcome.probability}
                                                                 onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                                 className="w-full bg-transparent text-right font-mono text-sm text-cyan-400 focus:outline-none"
                                                             />
                                                             <span className="absolute top-0 right-[-8px] text-[10px] text-gray-600 pointer-events-none">%</span>
                                                         </div>
                                                         
                                                         <button 
                                                            onClick={() => removeOutcome(variable.id, state.id, outcome.id)} 
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
                                        onClick={() => addOutcome(variable.id, state.id)} 
                                        className="mt-3 w-full py-1.5 text-xs font-bold text-gray-500 hover:text-cyan-400 border border-dashed border-gray-700 hover:border-cyan-500/30 rounded hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-1"
                                    >
                                         <PlusIcon className="w-3 h-3" /> Add Outcome Scenario
                                     </button>
                                 </div>
                             </div>
                             );
                         })}
                         
                         <button 
                            onClick={() => addState(variable.id)} 
                            className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-700/30 transition-all flex justify-center items-center gap-2"
                        >
                             <PlusIcon /> Add Another State
                         </button>
                    </div>
                </div>
                );
            })}
            
            {/* Add Variable Button */}
            <button 
                onClick={addVariable} 
                className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 font-bold hover:text-white hover:border-cyan-500/50 hover:bg-gray-800 transition-all flex justify-center items-center gap-3 group"
            >
                <div className="bg-gray-800 group-hover:bg-cyan-600 text-white rounded-full p-3 transition-colors shadow-lg border border-gray-600 group-hover:border-cyan-400">
                   <PlusIcon className="w-6 h-6" />
                </div>
                <span className="text-lg tracking-wide">Create New Strategic Variable</span>
            </button>
        </div>
    );
}

export default VariableInputList;
