import React from 'react';
import { Variable, VariableState, Outcome } from '../types';

interface VariableInputListProps {
    variables: Variable[];
    setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
}

const VariableInputList: React.FC<VariableInputListProps> = ({ variables, setVariables }) => {

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
        setVariables(variables.filter(v => v.id !== id));
    };

    const updateVariable = (id: string, updatedVariable: Partial<Variable>) => {
        setVariables(variables.map(v => v.id === id ? { ...v, ...updatedVariable } : v));
    };

    const addState = (variableId: string) => {
        const newVariables = variables.map(v => {
            if (v.id === variableId) {
                const newState: VariableState = {
                    id: crypto.randomUUID(),
                    name: `State ${String.fromCharCode(65 + v.states.length)}`,
                    outcomes: [{ id: crypto.randomUUID(), name: 'Success', probability: 50 }]
                };
                return { ...v, states: [...v.states, newState] };
            }
            return v;
        });
        setVariables(newVariables);
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
                                        name: 'Outcome',
                                        probability: 0
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


    return (
        <div className="space-y-8">
            {variables.map((variable, vIndex) => (
                <div key={variable.id} className="bg-gray-800/50 rounded-xl border border-gray-700 shadow-sm overflow-hidden transition-all hover:border-gray-600 hover:shadow-md">
                    
                    {/* Variable Header */}
                    <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center gap-4">
                        <div className="flex-grow">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 block">Variable {vIndex + 1}</label>
                            <input
                               type="text"
                               value={variable.name}
                               onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                               className="bg-transparent text-lg font-bold text-cyan-400 w-full focus:outline-none placeholder-gray-600"
                               placeholder="e.g. Market Strategy"
                            />
                        </div>
                        <button 
                           onClick={() => removeVariable(variable.id)}
                           className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-gray-800 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* States List */}
                    <div className="p-4 space-y-6 bg-gray-800/30">
                        {variable.states.map((state, sIndex) => (
                            <div key={state.id} className="relative pl-4 border-l-2 border-gray-600">
                                {/* State Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-gray-700 text-xs font-mono text-gray-300 px-2 py-1 rounded">State {String.fromCharCode(65 + sIndex)}</div>
                                    <input
                                        type="text"
                                        value={state.name}
                                        onChange={(e) => updateState(variable.id, state.id, { name: e.target.value })}
                                        className="bg-transparent text-gray-200 font-medium focus:outline-none border-b border-transparent focus:border-cyan-500 transition-all flex-grow"
                                        placeholder="State Name"
                                    />
                                    <button 
                                       onClick={() => removeState(variable.id, state.id)}
                                       className="text-xs text-gray-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        Remove
                                    </button>
                                </div>

                                {/* Outcomes List (Compact) */}
                                <div className="bg-gray-900/30 rounded-lg p-3 space-y-2">
                                    <div className="flex text-[10px] uppercase text-gray-500 font-bold px-2">
                                        <div className="flex-grow">Potential Outcome</div>
                                        <div className="w-32 text-right mr-8">Probability</div>
                                    </div>
                                    
                                    {state.outcomes.map(outcome => (
                                        <div key={outcome.id} className="flex items-center gap-3 group">
                                            <div className="flex-grow">
                                                <input
                                                    type="text"
                                                    value={outcome.name}
                                                    onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { name: e.target.value })}
                                                    className="w-full bg-gray-800/50 text-gray-300 text-sm px-2 py-1.5 rounded border border-transparent focus:border-cyan-500/50 focus:bg-gray-800 outline-none transition-all"
                                                    placeholder="Outcome (e.g. Success)"
                                                />
                                            </div>
                                            
                                            <div className="flex items-center gap-2 w-32">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={outcome.probability}
                                                    onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                                <div className="relative w-12">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={outcome.probability}
                                                        onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                        className="w-full bg-transparent text-right text-cyan-400 font-mono text-sm outline-none"
                                                    />
                                                    <span className="absolute top-0 right-[-8px] text-gray-600 text-xs">%</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeOutcome(variable.id, state.id, outcome.id)}
                                                className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Outcome"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={() => addOutcome(variable.id, state.id)}
                                        className="text-xs text-cyan-500/80 hover:text-cyan-400 flex items-center gap-1 mt-2 px-2 py-1 rounded hover:bg-cyan-900/20 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add Outcome
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => addState(variable.id)}
                            className="ml-4 text-xs font-medium text-gray-400 hover:text-white border border-dashed border-gray-600 hover:border-gray-400 rounded px-3 py-2 flex items-center gap-2 transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Another State
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addVariable}
                className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 font-bold hover:text-white hover:border-cyan-500/50 hover:bg-gray-800 transition-all flex justify-center items-center gap-2 group"
            >
                <div className="bg-gray-800 group-hover:bg-cyan-600 text-white rounded-full p-1 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                Create New Variable
            </button>
        </div>
    );
};

export default VariableInputList;