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
        <div>
            <div className="space-y-6">
                {variables.map((variable) => (
                    <div key={variable.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 transition-all hover:border-gray-500">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-grow mr-4">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1 block">Variable Name</label>
                                <input
                                    type="text"
                                    value={variable.name}
                                    onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                                    className="bg-gray-800/50 text-lg font-semibold text-cyan-300 w-full focus:outline-none focus:border-b-2 focus:border-cyan-500 transition-all px-2 py-1 rounded"
                                    placeholder="e.g., Marketing Channel"
                                />
                            </div>
                            <button 
                                onClick={() => removeVariable(variable.id)} 
                                className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-gray-700"
                                title="Remove Variable"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-gray-600">
                            {variable.states.map(state => (
                                <div key={state.id} className="bg-gray-800/30 p-3 rounded-md border border-gray-700/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-grow flex items-center gap-2">
                                             <span className="text-gray-400 text-xs font-mono">STATE:</span>
                                             <input
                                                type="text"
                                                value={state.name}
                                                onChange={(e) => updateState(variable.id, state.id, { name: e.target.value })}
                                                className="bg-gray-700 text-gray-200 p-1.5 rounded-md text-sm w-2/3 focus:ring-1 focus:ring-cyan-500 border-none outline-none"
                                                placeholder="State Name"
                                            />
                                        </div>
                                        <button onClick={() => removeState(variable.id, state.id)} className="text-gray-500 hover:text-red-400 text-xs px-2 py-1">Remove State</button>
                                    </div>
                                   
                                    <div className="space-y-2">
                                        {state.outcomes.map(outcome => (
                                            <div key={outcome.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pl-2 pr-2 py-2 bg-gray-900/30 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                                                <div className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                                                    <span className="text-[10px] text-gray-500 uppercase w-16">Outcome</span>
                                                     <input
                                                        type="text"
                                                        value={outcome.name}
                                                        onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { name: e.target.value })}
                                                        className="bg-gray-800 text-gray-300 p-1 rounded-md text-xs w-full sm:w-32 border border-gray-700 focus:border-cyan-500 outline-none"
                                                        placeholder="Outcome Name"
                                                    />
                                                </div>
                                                
                                                <div className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={outcome.probability}
                                                        onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={outcome.probability}
                                                        onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                        className="bg-gray-800 text-right text-cyan-400 font-mono text-xs w-12 p-1 rounded border border-gray-700 focus:border-cyan-500 outline-none"
                                                    />
                                                    <span className="text-xs text-gray-500">%</span>
                                                </div>

                                                <button 
                                                    onClick={() => removeOutcome(variable.id, state.id, outcome.id)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                                    title="Remove Outcome"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => addOutcome(variable.id, state.id)} 
                                            className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 mt-1 ml-2 px-2 py-1 rounded hover:bg-gray-700/50 w-fit transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Add Outcome
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => addState(variable.id)} 
                                className="w-full border-2 border-dashed border-gray-600 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-gray-800/50 rounded-md py-2 text-sm font-medium transition-all flex justify-center items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add State
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={addVariable}
                className="mt-8 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform hover:scale-[1.01] flex justify-center items-center gap-2"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add New Variable
            </button>
        </div>
    );
};

export default VariableInputList;