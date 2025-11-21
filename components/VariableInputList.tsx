
import React, { useState } from 'react';
import { Variable, VariableState, Outcome } from '../types';
import { StateItem } from './StateItem';
import { generateUUID } from '../utils';

interface VariableInputListProps {
    variables: Variable[];
    setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
    onClearAll: () => void;
}

// Icons
const DragHandleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
    </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);

const VariableInputList: React.FC<VariableInputListProps> = ({ variables, setVariables, onClearAll }) => {
    
    // --- Drag & Drop State ---
    const [draggedVarIndex, setDraggedVarIndex] = useState<number | null>(null);
    const [draggedState, setDraggedState] = useState<{ vIndex: number; sIndex: number } | null>(null);
    const [isVarHandleHovered, setIsVarHandleHovered] = useState<number | null>(null);

    // --- CRUD Operations ---
    const addVariable = () => {
        const newVariable: Variable = {
            id: generateUUID(),
            name: `Variable ${variables.length + 1}`,
            states: [
                { id: generateUUID(), name: 'State A', outcomes: [{ id: generateUUID(), name: 'Success', probability: 50 }] }
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
                    id: generateUUID(),
                    name: `State ${String.fromCharCode(65 + v.states.length)}`,
                    outcomes: [{ id: generateUUID(), name: 'Success', probability: 50 }]
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
                                        id: generateUUID(),
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

    // --- Drag Handlers (Variable) ---

    const handleVarDragStart = (e: React.DragEvent, index: number) => {
        // Only allow drag if handle was hovered (handled via draggable attribute, but good as safeguard)
        setDraggedVarIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleVarDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedVarIndex === null || draggedVarIndex === index) return;

        const newVars = [...variables];
        const draggedItem = newVars[draggedVarIndex];
        newVars.splice(draggedVarIndex, 1);
        newVars.splice(index, 0, draggedItem);

        setVariables(newVars);
        setDraggedVarIndex(index);
    };

    const handleVarDragEnd = () => {
        setDraggedVarIndex(null);
    };

    const handleVarDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    // --- Drag Handlers (State) ---

    const handleStateDragStart = (e: React.DragEvent, vIndex: number, sIndex: number) => {
        e.stopPropagation();
        setDraggedState({ vIndex, sIndex });
        e.dataTransfer.effectAllowed = "move";
    };

    const handleStateDragEnter = (e: React.DragEvent, vIndex: number, sIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedState || draggedState.vIndex !== vIndex || draggedState.sIndex === sIndex) return;

        const newVars = [...variables];
        const variable = newVars[vIndex];
        const newStates = [...variable.states];
        
        const draggedItem = newStates[draggedState.sIndex];
        newStates.splice(draggedState.sIndex, 1);
        newStates.splice(sIndex, 0, draggedItem);
        
        newVars[vIndex] = { ...variable, states: newStates };
        setVariables(newVars);
        setDraggedState({ vIndex, sIndex });
    };

    const handleStateDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedState(null);
    };

    return (
        <div className="space-y-8">
            {/* Toolbar Header */}
            {variables.length > 0 && (
                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {variables.length} Variable{variables.length !== 1 ? 's' : ''} Defined
                    </span>
                    <button 
                        onClick={onClearAll}
                        className="text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1 rounded transition-colors flex items-center gap-1"
                    >
                        <TrashIcon className="w-4 h-4" /> Clear Workspace
                    </button>
                </div>
            )}

            {/* Empty State */}
            {variables.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30 flex flex-col items-center animate-fade-in">
                     <div className="p-4 bg-gray-800 rounded-full mb-4 shadow-lg">
                        <PlusIcon className="w-8 h-8 text-cyan-400" />
                     </div>
                     <h3 className="text-lg font-bold text-gray-200 mb-2">Start Your Analysis</h3>
                     <p className="text-sm text-gray-400 mb-6 max-w-xs">
                        Define your first variable manually or use the AI assistant to generate one from a link.
                     </p>
                     <button 
                        onClick={addVariable} 
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" /> Create First Variable
                    </button>
                </div>
            )}

            {/* Variable List */}
            {variables.map((variable, vIndex) => {
                const isVarNameEmpty = !variable.name.trim();
                const isDraggable = isVarHandleHovered === vIndex;
                const isBeingDragged = draggedVarIndex === vIndex;

                return (
                <div 
                    key={variable.id} 
                    draggable={isDraggable}
                    onDragStart={(e) => handleVarDragStart(e, vIndex)}
                    onDragEnter={(e) => handleVarDragEnter(e, vIndex)}
                    onDragEnd={handleVarDragEnd}
                    onDragOver={handleVarDragOver}
                    className={`bg-gray-800 rounded-xl border shadow-lg overflow-hidden group/var transition-all duration-200 ${
                        isVarNameEmpty ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-gray-700 hover:border-gray-600'
                    } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
                        isBeingDragged 
                        ? 'opacity-40 scale-[0.98] border-cyan-500/50 ring-2 ring-cyan-500/20' 
                        : 'opacity-100 scale-100'
                    }`}
                >
                    
                    {/* Variable Header */}
                    <div className="bg-gray-900/80 p-4 border-b border-gray-700 flex items-center gap-4">
                        {/* Drag Handle */}
                        <div 
                            className="flex flex-col gap-1 text-gray-600 hover:text-cyan-400 p-2 hover:bg-gray-800 rounded cursor-grab active:cursor-grabbing transition-colors"
                            onMouseEnter={() => setIsVarHandleHovered(vIndex)}
                            onMouseLeave={() => setIsVarHandleHovered(null)}
                            title="Drag to reorder variable"
                        >
                           <DragHandleIcon />
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
                         {variable.states.map((state, sIndex) => (
                             <StateItem
                                key={state.id}
                                variableId={variable.id}
                                state={state}
                                index={sIndex}
                                onUpdate={(_id, data) => updateState(variable.id, _id, data)}
                                onRemove={(_id) => removeState(variable.id, _id)}
                                onAddOutcome={(sId) => addOutcome(variable.id, sId)}
                                onRemoveOutcome={(sId, oId) => removeOutcome(variable.id, sId, oId)}
                                onUpdateOutcome={(sId, oId, data) => updateOutcome(variable.id, sId, oId, data)}
                                
                                // Drag Props
                                draggable={true}
                                onDragStart={(e) => handleStateDragStart(e, vIndex, sIndex)}
                                onDragEnter={(e) => handleStateDragEnter(e, vIndex, sIndex)}
                                onDragEnd={handleStateDragEnd}
                                onDragOver={handleVarDragOver} // allow dropping by preventing default
                             />
                         ))}
                         
                         <button 
                            onClick={() => addState(variable.id)} 
                            className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-700/30 transition-all flex justify-center items-center gap-2 group"
                        >
                             <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add State
                         </button>
                    </div>
                </div>
                );
            })}
            
            {/* Add Variable Button (Only show if variables exist, otherwise empty state handles it) */}
            {variables.length > 0 && (
                <button 
                    onClick={addVariable} 
                    className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 font-bold hover:text-white hover:border-cyan-500/50 hover:bg-gray-800 transition-all flex justify-center items-center gap-2 group"
                >
                    <div className="bg-gray-800 group-hover:bg-cyan-600 text-white rounded-full p-1 transition-colors shadow border border-gray-600 group-hover:border-cyan-400">
                    <PlusIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm tracking-wide">Add Variable</span>
                </button>
            )}
        </div>
    );
}

export default VariableInputList;