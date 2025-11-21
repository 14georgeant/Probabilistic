import { GoogleGenAI, Type } from "@google/genai";
import { Variable, AnalysisResult, Outcome, VariableState } from '../types';

// Explicitly declare process for TypeScript since we are in a browser context
// where Vite replaces process.env.API_KEY at build time.
declare const process: {
    env: {
        API_KEY: string | undefined;
    }
};

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set. Please configure it in your deployment settings.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const model = "gemini-2.5-flash";

const checkForMaliciousIntent = async (text: string): Promise<boolean> => {
    const prompt = `You are a security analysis AI. Your sole purpose is to determine if the following text contains any malicious intent.
Malicious intent includes but is not limited to: promoting illegal acts, hate speech, generating harmful or unethical content, phishing, scamming, instructions for self-harm, malware creation, or any other form of security risk.

Analyze the text below. Respond with only the single word "true" if malicious intent is found, and "false" otherwise. Do not provide any explanation or other text.

TEXT TO ANALYZE:
---
${text}
---
`;
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0
            }
        });
        
        // Safely access text, defaulting to empty string if undefined
        const responseText = response.text ?? '';
        
        if (!responseText) {
            return false;
        }
        
        const result = responseText.trim().toLowerCase();
        return result === 'true';
    } catch (error) {
        console.error("Error during security check:", error);
        // Fail-safe: If the security check itself fails, we can't guarantee safety.
        // We will treat this as a potential risk.
        return true;
    }
};


export const generateAnalysisSummary = async (variables: Variable[], result: AnalysisResult): Promise<string> => {

  const variablesDescription = variables.map(v => 
    `- **${v.name}**:\n` +
    v.states.map(s => 
      `  - State: "${s.name}" -> Outcomes: ${s.outcomes.map(o => `"${o.name}" (${o.probability}%)`).join(', ')}`
    ).join('\n')
  ).join('\n');

  const resultDescription = 
    `The optimal combination of choices to achieve the outcome "${result.outcomeName}" is:\n` +
    result.bestCombination.map(c => `- For **${c.variableName}**, choose **${c.stateName}**`).join('\n') +
    `\nThis yields a final probability of success of **${(result.highestProbability * 100).toFixed(2)}%**.`;

  const prompt = `You are a senior product analyst and technical advisor. Your goal is to provide unbiased, constructive, and actionable advice to help a user improve their strategy and increase their probability of success. You are presented with a probabilistic model created by the user. Your task is to analyze the model and the calculated optimal path, then provide a clear, actionable, and insightful summary with workable fixes.

**CONTEXT:**
The user has defined a set of independent variables, each with different states. Each state has a certain probability of leading to a desired outcome. The system has calculated the combination of states that yields the highest overall probability of success.

**USER's MODEL DEFINITION:**
${variablesDescription}

**CALCULATED OPTIMAL PATH:**
${resultDescription}

---

**YOUR STRATEGIC ANALYSIS & RECOMMENDATIONS:**

Please provide your analysis in clear, well-structured markdown. Use headings, bold text, and bullet points to maximize readability. Structure your response with the following four sections:

#### 1. Executive Summary
Start with a one-sentence summary of the key takeaway. Then, briefly explain what the result means for the user in practical terms.

#### 2. Key Drivers of Success
- Identify the single most influential decision (the variable/state choice) that drives the final probability higher.
- Explain *why* it's so impactful compared to other choices.
- Highlight any states that are particularly poor choices and should likely be deprioritized.

#### 3. Opportunity for Improvement
- Pinpoint the "weakest link" in the optimal path. Which state in the recommended combination has the lowest probability and therefore presents the biggest opportunity for improvement?
- Briefly explain the potential risks associated with this weakest link.
- Frame this not as a failure, but as the primary focus area for optimization.

#### 4. Actionable Recommendations & Upgrades
- **For the weakest link identified above:** Propose 1-2 concrete, workable fixes to improve its success probability. These should be practical suggestions, not extreme measures. Examples:
    - *Technical Fix:* "A/B test the button copy on the sign-up page."
    - *Platform Upgrade:* "Consider integrating a faster payment processor to reduce cart abandonment."
    - *Content Tweak:* "Rewrite the email subject line to create more urgency."
    - *Broader Strategy:* Suggest one other strategic action the user could take based on the overall model to incrementally lift the success rate.
- **Model Enhancement:** Propose one new, relevant variable the user could add to their model to gain a more complete picture. Explain why this variable is important for a more robust strategy.
  `;
  
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });
    
    // Safely access text
    const analysisText = response.text ?? '';
    
    if (!analysisText) {
        return "Unable to generate analysis summary at this time.";
    }

    const isMalicious = await checkForMaliciousIntent(analysisText);
    if (isMalicious) {
        throw new Error('SECURITY_RISK_DETECTED: Malicious intent found in AI-generated analysis.');
    }

    return analysisText;
  } catch (error) {
    console.error("Error generating analysis summary:", error);
    if (error instanceof Error && error.message.startsWith('SECURITY_RISK_DETECTED')) {
        throw error;
    }
    return "Error generating AI insights. Please check the console for more details.";
  }
};


const variableSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'The name of the strategic variable. Should be concise and descriptive.' },
        states: {
            type: Type.ARRAY,
            description: 'An array of 2-3 distinct states or strategies for this variable.',
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'The name of the state. Should be concise.' },
                    outcomes: {
                        type: Type.ARRAY,
                        description: "An array containing a single outcome object for this state.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "The name of the outcome. This should always be 'Success'." },
                                probability: { type: Type.INTEGER, description: 'The estimated probability (0-100) of this outcome occurring for this state.' }
                            },
                            required: ['name', 'probability']
                        }
                    }
                },
                required: ['name', 'outcomes']
            }
        }
    },
    required: ['name', 'states']
};

export const analyzeLinkForVariables = async (url: string): Promise<{ variable: Variable; sources: { title: string; uri: string }[] }> => {
    // When using Google Search tool, we cannot use responseSchema.
    // We must explicitly instruct the model to return JSON in the prompt.
    const prompt = `You are a strategic analyst. A user has provided a URL. Your task is to analyze the content and purpose of the website at this URL and propose a new, relevant variable for their probabilistic model.

URL provided by user: ${url}

**INSTRUCTIONS:**
1. Use **Google Search** to find information about the website at the provided URL. Understand its business model, products, or primary goal.
2. Based on your research, identify a single, core strategic variable relevant to this entity.
3. Define 2-3 distinct states (strategies/options) for this variable.
4. For each state, estimate the probability (0-100) of achieving a 'Success' outcome based on general market knowledge for this type of business.

**OUTPUT FORMAT:**
You must return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json) or any explanatory text. The JSON must strictly adhere to this structure:
${JSON.stringify(variableSchema, null, 2)}
`;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                // Enable Google Search Grounding
                tools: [{ googleSearch: {} }],
                // Note: responseMimeType and responseSchema are NOT allowed when using tools/search.
            }
        });
        
        // Safely access text
        const text = response.text ?? '';
        
        if (!text) {
            throw new Error("No response received from AI service.");
        }

        // Robust JSON extraction in case the model includes markdown code blocks despite instructions
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        
        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from model response:", text);
            throw new Error("AI response was not in valid JSON format.");
        }

        const textToCheck = `${parsed.name} ${parsed.states.map((s: any) => s.name).join(' ')}`;
        const isMalicious = await checkForMaliciousIntent(textToCheck);
        if (isMalicious) {
            throw new Error('SECURITY_RISK_DETECTED: Malicious intent found in AI-generated variable.');
        }

        // Re-hydrate the object with IDs to match our internal types
        const variableWithIds: Variable = {
            id: crypto.randomUUID(),
            name: parsed.name,
            states: parsed.states.map((state: Omit<VariableState, 'id'>) => ({
                id: crypto.randomUUID(),
                name: state.name,
                outcomes: state.outcomes.map((outcome: Omit<Outcome, 'id'>) => ({
                    id: crypto.randomUUID(),
                    name: outcome.name,
                    probability: outcome.probability,
                }))
            }))
        };

        // Extract Grounding Metadata (Sources)
        const sources: { title: string; uri: string }[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach(chunk => {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || 'Source',
                        uri: chunk.web.uri || '#'
                    });
                }
            });
        }

        return { variable: variableWithIds, sources };

    } catch (error) {
        console.error("Error analyzing link:", error);
        if (error instanceof Error && error.message.startsWith('SECURITY_RISK_DETECTED')) {
            throw error;
        }
        throw new Error("Failed to generate a variable from the link. Please ensure the URL is valid and accessible via search.");
    }
};

// New function for Batch CLI processing
export const processBatchData = async (inputData: string): Promise<Variable[]> => {
    // Schema definition for array of variables
    const variableListSchema = {
        type: Type.ARRAY,
        items: variableSchema
    };

    const prompt = `
    You are a High-Performance Data Processor CLI.
    
    Your task is to analyze the user's raw input data (which may be CSV, JSON, log text, or natural language description) and extract strategic variables for a Probabilistic Outcome Analyzer.
    
    **INPUT DATA:**
    ${inputData}
    
    **INSTRUCTIONS:**
    1. Identify distinct variables or factors in the data that influence an outcome.
    2. For each variable, identify the different states or categories it can take.
    3. Estimate a success probability (0-100) for each state based on the data context or general knowledge if data is sparse.
    4. Return a list of Variable objects strictly adhering to the JSON schema.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model, // gemini-2.5-flash handles large context
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: variableListSchema
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI.");
        
        const parsed = JSON.parse(text);
        
        // Security Check
        const textToCheck = parsed.map((v: any) => `${v.name} ${v.states.map((s: any) => s.name).join(' ')}`).join(' ');
        if (await checkForMaliciousIntent(textToCheck)) {
            throw new Error("SECURITY_RISK_DETECTED: Malicious content in batch data.");
        }

        // Hydrate with UUIDs
        return parsed.map((v: any) => ({
            id: crypto.randomUUID(),
            name: v.name,
            states: v.states.map((s: any) => ({
                id: crypto.randomUUID(),
                name: s.name,
                outcomes: s.outcomes.map((o: any) => ({
                    id: crypto.randomUUID(),
                    name: o.name || 'Success',
                    probability: o.probability
                }))
            }))
        }));

    } catch (error) {
        console.error("Batch processing error:", error);
        if (error instanceof Error && error.message.startsWith('SECURITY_RISK_DETECTED')) throw error;
        throw new Error("Failed to process batch data.");
    }
};

export const generateCppAdaptivityCode = async (variables: Variable[]): Promise<string> => {
    const varSchema = variables.map(v => ({
        name: v.name,
        states: v.states.map(s => ({ name: s.name, prob: s.outcomes[0]?.probability || 0 }))
    }));

    const prompt = `
    You are an expert embedded systems engineer.
    Create a high-performance C++17 class named 'AdaptiveOptimizer' that models the following probabilistic decision variables:
    ${JSON.stringify(varSchema, null, 2)}

    REQUIREMENTS:
    1.  **Data Structure**: Use std::vector and struct to efficiently store variables and their states.
    2.  **Adaptivity**: Implement a method \`void updateProbability(std::string variableName, std::string stateName, double newProbability)\` to allow the system to adapt to runtime sensor data or market changes.
    3.  **Optimization**: Implement \`double calculateOptimalStrategy()\` which finds the combination of states with the highest joint probability and prints it.
    4.  **Demo**: Include a \`main()\` function that:
        - Instantiates the model.
        - Prints the initial optimal path.
        - Simulates a runtime change (e.g., "Sensor X detected efficiency drop").
        - Calls \`updateProbability\`.
        - Prints the NEW, adapted optimal path to demonstrate adaptivity.
    
    OUTPUT FORMAT:
    Return ONLY the valid C++ source code. Do not include markdown blocks (like \`\`\`cpp) or explanations.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        
        let text = response.text ?? "// Error generating C++ code.";
        // Clean up any potential markdown formatting the model might add despite instructions
        text = text.replace(/```cpp/g, '').replace(/```/g, '').trim();
        return text;

    } catch (e) {
        return "// Error generating C++ code: " + (e instanceof Error ? e.message : "Unknown error");
    }
};