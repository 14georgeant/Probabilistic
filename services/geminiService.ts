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


export const generateAnalysisSummary = async (
    variables: Variable[], 
    result: AnalysisResult, 
    mode: 'general' | 'financial' | 'health' = 'general'
): Promise<string> => {

  const variablesDescription = variables.map(v => 
    `- **${v.name}**:\n` +
    v.states.map(s => 
      `  - State: "${s.name}" -> Outcomes: ${s.outcomes.map(o => `"${o.name}" (${o.probability}%)`).join(', ')}`
    ).join('\n')
  ).join('\n');

  const resultDescription = 
    `The optimal combination to achieve "${result.outcomeName}" is:\n` +
    result.bestCombination.map(c => `- For **${c.variableName}**, choose **${c.stateName}**`).join('\n') +
    `\nFinal probability: **${(result.highestProbability * 100).toFixed(2)}%**.`;

  let systemPrompt = "";

  if (mode === 'financial') {
      systemPrompt = `You are a Senior CFA-Certified Financial Adviser and Wealth Manager. Your goal is to analyze the user's probabilistic financial model and provide fiduciary-level strategic advice.
      
      **Role:** Financial Adviser / Wealth Manager.
      **Tone:** Professional, Objective, Risk-Aware, Insightful.
      
      **Structure your advice as follows:**
      #### 1. Financial Outlook (Executive Summary)
      Summarize the viability of achieving the target financial goal (ROI/Solvency) based on the model.
      
      #### 2. Critical Success Factors
      Identify the asset allocation or financial decision that provides the highest return on investment (ROI) or stability. Explain why this factor is critical for the portfolio.
      
      #### 3. Risk Analysis (Weakest Link)
      Identify the decision or market condition in the optimal path that presents the highest risk (lowest probability). Explain the financial exposure here.
      
      #### 4. Advisory Recommendations
      - **Portfolio Rebalancing:** Suggest a concrete change to the "Weakest Link" to mitigate risk (e.g., "Hedge against market volatility", "Diversify asset class").
      - **Strategic Addition:** Suggest one new financial variable to track (e.g., "Interest Rates", "Inflation Index") to make the model more robust.
      `;
  } else if (mode === 'health') {
      systemPrompt = `You are an Elite Sports Scientist and Performance Coach. Your goal is to analyze the user's lifestyle/training model and provide advice to maximize physical performance or health outcomes.
      
      **Role:** Sports Nutritionist & Strength Coach.
      **Tone:** Energetic, Science-Backed, Motivational, Direct.
      
      **Structure your advice as follows:**
      #### 1. Physiological Projection
      Summarize the likelihood of achieving the physical goal based on current inputs. Use terms like "Hypertrophy", "Metabolic Efficiency", or "VO2 Max" where relevant.
      
      #### 2. The 'Alpha' Factor
      Identify the habit or training variable that is contributing most to success. Explain the physiological benefit.
      
      #### 3. Performance Bottlenecks
      Identify the habit (the weakest link) that is dragging down the probability of success. Is it sleep? Diet consistency? Recovery?
      
      #### 4. Protocol Adjustments
      - **Action Plan:** Give a specific instruction to fix the bottleneck (e.g., "Increase protein intake to 2g/kg", "Implement deload week").
      - **Metric to Track:** Suggest a new variable to measure (e.g., "Resting Heart Rate", "Caloric Deficit").
      `;
  } else {
      systemPrompt = `You are a senior product analyst and technical advisor. Your goal is to provide unbiased, constructive, and actionable advice to help a user improve their strategy.

      **Structure your advice as follows:**
      #### 1. Executive Summary
      Start with a one-sentence summary of the key takeaway.
      
      #### 2. Key Drivers of Success
      Identify the single most influential decision that drives the final probability higher.
      
      #### 3. Opportunity for Improvement
      Pinpoint the "weakest link" (lowest probability state) in the recommended path.
      
      #### 4. Actionable Recommendations
      - **For the weakest link:** Propose 1-2 concrete fixes (technical, content, or process).
      - **Model Enhancement:** Propose one new variable to add.
      `;
  }

  const fullPrompt = `
${systemPrompt}

**USER'S MODEL:**
${variablesDescription}

**OPTIMAL PATH:**
${resultDescription}
`;
  
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model,
        contents: fullPrompt
    });
    
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
                                name: { type: Type.STRING, description: "The name of the outcome (e.g., Success, High ROI)." },
                                probability: { type: Type.INTEGER, description: 'The estimated probability (0-100) of this outcome occurring.' }
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

export const analyzeLinkForVariables = async (
    url: string, 
    mode: 'general' | 'financial' | 'health' = 'general'
): Promise<{ variable: Variable; sources: { title: string; uri: string }[] }> => {
    
    let instructions = "";
    if (mode === 'financial') {
        instructions = `
        This is for a **Financial Planning Model**.
        Analyze the URL for financial indicators, investment opportunities, or economic news.
        - If it's a **Company/Stock**: Variable name should be related to "Fundamental Strength" or "Market Sentiment". States: "Buy Signal", "Hold", "Sell".
        - If it's a **Crypto/Asset**: Variable name: "Volatility" or "Adoption Rate". States: "High Growth", "Correction", "Stagnation".
        - If it's **News**: Variable name: "Economic Impact". States: "Positive Shock", "Negative Shock", "Neutral".
        - Estimate probabilities based on the sentiment of the content.
        `;
    } else if (mode === 'health') {
        instructions = `
        This is for a **Health & Sports Performance Model**.
        Analyze the URL for nutritional value, workout intensity, or health advice.
        - If it's a **Recipe/Food**: Variable name: "Dietary Impact" or "Macro Profile". States: "High Protein/Anabolic", "High Calorie/Bulking", "Clean/Maintenance".
        - If it's a **Workout Video**: Variable name: "Training Stimulus". States: "Hypertrophy (Muscle Gain)", "Endurance", "Active Recovery".
        - If it's **Supplement/Gear**: Variable name: "Performance Aid". States: "Effective", "Placebo/Low Impact".
        `;
    } else {
        instructions = `
        This is for a **General Strategic Model**.
        - If it is a **Product/Business** page: Analyze business model/pricing.
        - If it is a **YouTube Video**: Analyze "Virality Potential" or "Content Quality".
        - If it is a **Instagram/TikTok**: Analyze "Aesthetic Appeal", "Trend Relevance", or "Visual Hook".
        - If it is a **Social Post (X/LinkedIn)**: Analyze "Engagement Potential" or "Copy Strength".
        `;
    }

    const prompt = `You are an expert analyst. A user has provided a URL. Your task is to analyze the content to propose a new, relevant variable for their probabilistic model.

URL provided by user: ${url}

**CONTEXT & INSTRUCTIONS:**
${instructions}

**OUTPUT FORMAT:**
You must return ONLY a valid JSON object adhering to this schema:
${JSON.stringify(variableSchema, null, 2)}
`;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        const text = response.text ?? '';
        if (!text) throw new Error("No response received from AI service.");

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
    const variableListSchema = {
        type: Type.ARRAY,
        items: variableSchema
    };

    const prompt = `
    You are a High-Performance Data Processor CLI.
    Analyze input data and extract strategic variables.
    
    **INPUT DATA:**
    ${inputData}
    
    **INSTRUCTIONS:**
    1. Identify variables/factors.
    2. Identify states/categories.
    3. Estimate probability (0-100).
    4. Return JSON array.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
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
    Create a C++17 class 'AdaptiveOptimizer' for these variables:
    ${JSON.stringify(varSchema, null, 2)}
    
    OUTPUT FORMAT:
    Return ONLY the valid C++ source code. No markdown.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        
        let text = response.text ?? "// Error generating C++ code.";
        text = text.replace(/```cpp/g, '').replace(/```/g, '').trim();
        return text;

    } catch (e) {
        return "// Error generating C++ code: " + (e instanceof Error ? e.message : "Unknown error");
    }
};