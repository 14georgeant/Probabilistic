
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
                    <div key={variable.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-center mb-3">
                            <input
                                type="text"
                                value={variable.name}
                                onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                                className="bg-transparent text-lg font-semibold text-cyan-300 w-full focus:outline-none"
                            />
                            <button onClick={() => removeVariable(variable.id)} className="text-red-400 hover:text-red-300">&times;</button>
                        </div>

                        <div className="space-y-4 pl-4 border-l-2 border-gray-600">
                            {variable.states.map(state => (
                                <div key={state.id}>
                                    <div className="flex items-center gap-2 mb-2">
                                         <input
                                            type="text"
                                            value={state.name}
                                            onChange={(e) => updateState(variable.id, state.id, { name: e.target.value })}
                                            className="bg-gray-700 p-1 rounded-md text-sm w-1/3"
                                        />
                                        <button onClick={() => removeState(variable.id, state.id)} className="text-gray-400 hover:text-white text-xs">&times;</button>
                                    </div>
                                   
                                    {state.outcomes.map(outcome => (
                                        <div key={outcome.id} className="flex items-center gap-2 pl-4">
                                            <span className="text-sm text-gray-400 w-1/4">Outcome:</span>
                                             <input
                                                type="text"
                                                value={outcome.name}
                                                disabled
                                                className="bg-gray-800 p-1 rounded-md text-sm w-1/3 cursor-not-allowed"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={outcome.probability}
                                                onChange={(e) => updateOutcome(variable.id, state.id, outcome.id, { probability: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                            <span className="text-sm font-mono w-12 text-right">{outcome.probability}%</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <button onClick={() => addState(variable.id)} className="text-cyan-400 hover:text-cyan-300 text-sm mt-2">+ Add State</button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={addVariable}
                className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
                + Add Variable
            </button>
        </div>
    );
};

export default VariableInputList;

