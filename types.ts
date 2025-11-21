
export interface Outcome {
  id: string;
  name: string;
  probability: number; // Stored as 0-100
}

export interface VariableState {
  id: string;
  name: string;
  outcomes: Outcome[];
}

export interface Variable {
  id: string;
  name: string;
  states: VariableState[];
}

export interface AnalysisResult {
  bestCombination: {
    variableName: string;
    stateName: string;
    baseProbability: number; // The raw probability (0-100) of this specific state choice
  }[];
  highestProbability: number; // Stored as 0-1
  outcomeName: string;
}
