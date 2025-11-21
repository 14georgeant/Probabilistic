
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Variable, AnalysisResult, Outcome, VariableState } from '../types';
import { generateUUID } from '../utils';

// Explicitly declare process for TypeScript
declare const process: {
    env: {
        API_KEY: string | undefined;
        [key: string]: string | undefined;
    }
};

const getAiClient = () => {
    // Access the key directly. Vite replaces 'process.env' with the object defined in config.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.error("Gemini Service Error: API_KEY is missing from process.env. Current env:", process.env);
        throw new Error("API_KEY environment variable is not set. Please configure it in your deployment settings or .env file.");
    } else {
        // Debug log (safe - only showing length)
        console.log(`Gemini Client Initialized. Key length: ${apiKey.length}`);
    }
    return new GoogleGenAI({ apiKey });
};

const model = "gemini-2.5-flash";

// Helper to format errors into user-friendly messages
export const formatGenAIError = (error: unknown): string => {
    if (error instanceof Error) {
        const msg = error.message;
        
        // Security Risk Pass-through
        if (msg.startsWith('SECURITY_RISK_DETECTED')) {
            return msg;
        }

        // CRITICAL: API Key Leaked or Permission Denied
        // Matches the nested JSON error message structure provided by the API
        if (msg.includes('leaked') || (msg.includes('403') && (msg.includes('API key') || msg.includes('PERMISSION_DENIED')))) {
             return "CRITICAL SECURITY ALERT: Your API Key has been reported as leaked and blocked by Google. Requests are blocked. Please go to Google AI Studio, revoke this key, and generate a new one immediately.";
        }

        // API Key / Auth (General)
        if (msg.includes('API key') || msg.includes('API_KEY') || msg.includes('401')) {
             return "Authentication Error: The API Key is missing or invalid. Please check your environment settings.";
        }
        
        // Rate Limiting
        if (msg.includes('429') || msg.includes('Resource has been exhausted')) {
            return "Traffic Limit Exceeded: You are sending requests too quickly. Please wait a moment and try again.";
        }
        
        // Server Errors
        if (msg.includes('500') || msg.includes('503') || msg.includes('Internal') || msg.includes('Overloaded')) {
             return "Google AI Service Error: The model is temporarily overloaded or unavailable. Please try again shortly.";
        }
        
        // Safety Filters
        if (msg.includes('SAFETY') || msg.includes('blocked') || msg.includes('Harmful') || msg.includes('candidate')) {
             return "Content Filter: The AI flagged your input as potentially unsafe or harmful. Please adjust your wording and try again.";
        }
        
        // Network
        if (msg.includes('fetch failed') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
            return "Connection Error: Unable to reach the AI service. Please check your internet connection.";
        }
        
        // JSON Parsing (AI returned bad format)
        if (msg.includes('JSON') || msg.includes('Unexpected token') || msg.includes('parse')) {
             return "Data Processing Error: The AI returned an invalid format. Please try the request again.";
        }
        
        return `System Error: ${msg.slice(0, 100)}...`;
    }
    return "An unexpected system error occurred. Please try again.";
};

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
    mode: 'general' | 'financial' | 'health' | 'medical' | 'programmer' | 'mental' = 'general'
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
  } else if (mode === 'medical') {
      systemPrompt = `You are a Senior Clinical Research Fellow. Your goal is to analyze the user's model of symptoms or clinical factors and provide a probabilistic assessment based on medical logic.
      
      **DISCLAIMER:** You must start with: "This analysis is for informational and educational purposes only and does not constitute medical advice or diagnosis. Always consult a healthcare professional."
      
      **Role:** Clinical Researcher.
      **Tone:** Academic, Clinical, Empathetic, Rigorous.
      
      **Structure your advice as follows:**
      #### 1. Clinical Assessment
      Evaluate the probability of the outcome based on the presented symptoms/factors. Use clinical terminology (e.g., "Prognosis", "Etiology", "Risk Factors").
      
      #### 2. Primary Indication
      Identify the factor that correlates most strongly with the positive outcome.
      
      #### 3. Contraindications / Risks
      Identify the factor reducing the probability of success. (e.g., "Non-adherence", "Comorbidity").
      
      #### 4. Recommended Clinical Investigation
      Suggest further variables to investigate or tests to consider (e.g., "Monitor Blood Pressure", "Check family history").
      `;
  } else if (mode === 'programmer') {
      systemPrompt = `You are a Principal Software Engineer and Tech Lead. Your goal is to analyze the user's technical strategy, code architecture, or project roadmap model and provide pragmatic, scalable advice.

      **Role:** Staff Engineer / Tech Lead.
      **Tone:** Technical, Constructive, Pragmatic, "Hacker" spirit.

      **Structure your advice as follows:**
      #### 1. Architecture Review
      Summarize the viability of the technical goal (e.g., "Scalability", "Ship Date") based on the model.

      #### 2. The '10x' Factor
      Identify the technology or practice that offers the highest leverage for success (e.g., "Caching Strategy", "CI/CD Pipeline").

      #### 3. Technical Debt Risk
      Identify the "weakest link" in the stack or process. Explain the potential downstream effects (bugs, latency, developer burnout).

      #### 4. Engineering Recommendations
      - **Optimization:** Suggest a specific refactor, tool, or pattern to fix the bottleneck.
      - **New Metric:** Suggest a variable to track (e.g., "Cyclomatic Complexity", "Test Coverage", "Mean Time to Recovery").
      `;
  } else if (mode === 'mental') {
      systemPrompt = `You are a Compassionate Wellness Coach. Your goal is to analyze the user's life factors and provide supportive, validating, and constructive advice to help them achieve mental balance.
      
      **Role:** Wellness Coach / Supportive Friend.
      **Tone:** Warm, Empathetic, Gentle, Non-Judgmental.
      
      **Structure your advice as follows:**
      #### 1. Emotional Outlook
      Gently reflect on the likelihood of achieving the desired state of mind based on the factors provided. Validate their effort.
      
      #### 2. Pillars of Strength
      Identify the positive habit or environmental factor that is most supporting their well-being.
      
      #### 3. Areas for Gentle Care
      Identify the factor that might be causing stress or lowering resilience. Frame this softly as an area that needs attention, not a failure.
      
      #### 4. Wellness Suggestions
      - **Self-Care Step:** Suggest a small, manageable action (e.g., "5 minutes of breathing", "Writing in a journal").
      - **Awareness:** Suggest a feeling or trigger to observe (e.g., "Notice when you feel tired").
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
        throw new Error("The AI service returned an empty response.");
    }

    const isMalicious = await checkForMaliciousIntent(analysisText);
    if (isMalicious) {
        throw new Error('SECURITY_RISK_DETECTED: Malicious intent found in AI-generated analysis.');
    }

    return analysisText;
  } catch (error) {
    console.error("Error generating analysis summary:", error);
    throw new Error(formatGenAIError(error));
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
    mode: 'general' | 'financial' | 'health' | 'medical' | 'programmer' | 'mental' = 'general'
): Promise<{ variable: Variable; sources: { title: string; uri: string }[] }> => {
    
    let instructions = "";
    if (mode === 'financial') {
        instructions = `
        This is for a **Financial Planning Model**.
        Analyze the URL for financial indicators, investment opportunities, or economic news.
        - If it's a **Company/Stock**: Variable name should be related to "Fundamental Strength" or "Market Sentiment". States: "Buy Signal", "Hold", "Sell".
        - If it's a **Crypto/Asset**: Variable name: "Volatility" or "Adoption Rate". States: "High Growth", "Correction", "Stagnation".
        - If it's a **News**: Variable name: "Economic Impact". States: "Positive Shock", "Negative Shock", "Neutral".
        - If it's **General Financial Info**: Analyze the core financial concept. Variable name: "Key Financial Driver".
        - **CATCH-ALL**: If the link is valid but doesn't fit above categories, analyze it as a general financial factor or risk variable.
        - Estimate probabilities based on the sentiment of the content.
        `;
    } else if (mode === 'health') {
        instructions = `
        This is for a **Health & Sports Performance Model**.
        Analyze the URL for nutritional value, workout intensity, or health advice.
        - If it's a **Recipe/Food**: Variable name: "Dietary Impact" or "Macro Profile". States: "High Protein/Anabolic", "High Calorie/Bulking", "Clean/Maintenance".
        - If it's a **Workout Video**: Variable name: "Training Stimulus". States: "Hypertrophy (Muscle Gain)", "Endurance", "Active Recovery".
        - If it's **Supplement/Gear**: Variable name: "Performance Aid". States: "Effective", "Placebo/Low Impact".
        - If it's **General Health/Fitness Content**: Analyze the key factor influencing performance or health. Variable name examples: "Sleep Quality", "Stress Management", "Recovery".
        - **CATCH-ALL**: If the link is valid but doesn't fit above, analyze its potential impact on health/performance.
        `;
    } else if (mode === 'medical') {
        instructions = `
        This is for a **Medical Research Model**.
        Analyze the URL (e.g., PubMed, Medical Journal) for clinical study results or symptom analysis.
        - If it's a **Clinical Study**: Variable name: "Treatment Efficacy" or "Drug Response". States: "Effective (High Conf)", "Inconclusive", "Adverse Effects".
        - If it's **Symptom Info**: Variable name: "Disease Probability". States: "High Likelihood", "Low Likelihood".
        - If it's **General Medical Info**: Extract the most relevant prognostic factor or risk variable.
        - **CATCH-ALL**: If the link is valid medical info, analyze the most relevant clinical factor.
        - PRIORITIZE ACCURACY based on the text.
        `;
    } else if (mode === 'programmer') {
        instructions = `
        This is for a **Software Engineering & Dev Strategy Model**.
        Analyze the URL (GitHub, StackOverflow, Tech Blog, Documentation).
        - If it's a **Library/Framework**: Variable name: "Tech Adoption". States: "Stable/LTS", "Bleeding Edge", "Legacy".
        - If it's a **Bug/Issue**: Variable name: "Bug Impact". States: "Critical Blocker", "Edge Case", "Resolved".
        - If it's a **Tutorial/Guide**: Variable name: "Skill Acquisition". States: "Mastered", "In Progress", "Gap".
        - **CATCH-ALL**: Analyze the technical concept and propose a relevant variable (e.g., "Performance Overhead", "Dev Experience").
        `;
    } else if (mode === 'mental') {
        instructions = `
        This is for a **Mental Wellness & Resilience Model**.
        Analyze the URL (Psychology Article, Meditation Guide, Wellness Blog).
        - If it's a **Coping Strategy**: Variable name: "Strategy Efficacy". States: "Highly Effective", "Moderate Relief", "No Change".
        - If it's about **Stressors**: Variable name: "Stress Impact". States: "Manageable", "Overwhelming".
        - If it's **Advice**: Variable name: "Habit Implementation". States: "Consistent Practice", "Occasional", "None".
        - **CATCH-ALL**: Analyze the psychological concept and propose a variable related to mental well-being.
        `;
    } else {
        instructions = `
        This is for a **General Strategic Model**.
        - If it is a **Product/Business** page: Analyze business model/pricing.
        - If it is a **YouTube Video**: Analyze "Virality Potential" or "Content Quality".
        - If it is a **Instagram/TikTok**: Analyze "Aesthetic Appeal", "Trend Relevance", or "Visual Hook".
        - If it is a **Social Post (X/LinkedIn)**: Analyze "Engagement Potential" or "Copy Strength".
        - If it is **Any Other Content**: Analyze the main topic and propose a relevant strategic variable with states representing success/failure scenarios.
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
            throw new Error("The AI response was not in a valid JSON format.");
        }

        const textToCheck = `${parsed.name} ${parsed.states.map((s: any) => s.name).join(' ')}`;
        const isMalicious = await checkForMaliciousIntent(textToCheck);
        if (isMalicious) {
            throw new Error('SECURITY_RISK_DETECTED: Malicious intent found in AI-generated variable.');
        }

        const variableWithIds: Variable = {
            id: generateUUID(),
            name: parsed.name,
            states: parsed.states.map((state: Omit<VariableState, 'id'>) => ({
                id: generateUUID(),
                name: state.name,
                outcomes: state.outcomes.map((outcome: Omit<Outcome, 'id'>) => ({
                    id: generateUUID(),
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
        throw new Error(formatGenAIError(error));
    }
};

// Chat Creators
export const createMedicalChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: "You are a Medical Research Assistant. Your goal is to help users understand clinical data, symptoms, and medical literature. You must always state that you are an AI and not a doctor. Provide information based on medical consensus. Use the googleSearch tool to find relevant medical journals or studies if needed.",
            tools: [{ googleSearch: {} }],
        }
    });
};

export const createFinancialChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: "You are an ICT (Inner Circle Trader) Financial Analyst. Focus on Price Action, Order Blocks, Fair Value Gaps, and Market Structure. Provide educational analysis on forex, crypto, and indices. Disclaimer: Not financial advice.",
            tools: [{ googleSearch: {} }],
        }
    });
};

export const createProgrammerChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: "You are a Senior Software Engineer and Tech Lead. Assist with architecture decisions, debugging, and library recommendations. Prefer modern, stable, and scalable solutions.",
            tools: [{ googleSearch: {} }],
        }
    });
};

export const createHealthChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: "You are an Elite Sports Scientist and Performance Coach. Provide evidence-based advice on training, nutrition, and recovery. Reference sports science journals where possible.",
            tools: [{ googleSearch: {} }],
        }
    });
};

export const createMentalChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: `You are Serenity, a highly empathetic, soft-spoken, and compassionate mental wellness adviser.
            
            **Your Persona:**
            - **Tone:** Warm, gentle, validating, non-judgmental, and deeply human.
            - **Style:** Use active listening. Reflect the user's feelings back to them. Use soft phrases like "I hear you," "That sounds incredibly heavy," "It's okay to feel this way."
            - **Goal:** To provide a safe digital sanctuary where the user feels heard and understood. Offer gentle guidance or mindfulness techniques only when appropriate, never force advice.
            
            **Critical Safety Rules:**
            - If the user expresses intent of self-harm or suicide, you MUST respond with immediate care and provide emergency resources (e.g., "I'm so concerned about you. Please reach out to a crisis line...").
            - Do not diagnose medical conditions.
            
            **Interaction Style:**
            - Keep responses concise but full of warmth.
            - Ask gentle open-ended questions to help them explore their feelings.
            `,
            tools: [{ googleSearch: {} }],
        }
    });
};

// Data Processing
export const processBatchData = async (inputData: string): Promise<Variable[]> => {
    const prompt = `
    Analyze the following raw data (CSV, JSON, or Text) and extract strategic variables for a probabilistic model.
    
    Data:
    ${inputData.substring(0, 10000)}

    Output a JSON array of variables adhering to this schema:
    [
        {
            "name": "Variable Name",
            "states": [
                { "name": "State A", "outcomes": [{ "name": "Success", "probability": 50 }] }
            ]
        }
    ]
    `;
    
    const listSchema = {
        type: Type.ARRAY,
        items: variableSchema
    };

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: listSchema
            }
        });

        const text = response.text ?? '[]';
        const parsed = JSON.parse(text);
        
        return parsed.map((v: any) => ({
            id: generateUUID(),
            name: v.name,
            states: v.states.map((s: any) => ({
                id: generateUUID(),
                name: s.name,
                outcomes: s.outcomes.map((o: any) => ({
                    id: generateUUID(),
                    name: o.name,
                    probability: o.probability
                }))
            }))
        }));
    } catch (e) {
        console.error("Batch processing failed", e);
        throw new Error(formatGenAIError(e));
    }
};

// Code Generation
export const generateCppAdaptivityCode = async (variables: Variable[]): Promise<string> => {
    const modelDesc = JSON.stringify(variables, null, 2);
    const prompt = `
    You are an expert C++ Systems Engineer.
    Generate a high-performance, thread-safe C++17 class named 'AdaptiveOptimizer' that models the following probabilistic state machine.
    
    The code should:
    1. Define structs/classes for these Variables and States.
    2. Implement a 'calculateOptimalPath()' method using dynamic programming or a similar efficient algorithm.
    3. Include comments explaining the logic.
    4. Be ready for embedded systems (minimal dependencies).

    Model Definition:
    ${modelDesc}
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: prompt
        });
        return response.text ?? "// Error generating code";
    } catch (e) {
         throw new Error(formatGenAIError(e));
    }
};

// Multimodal Analysis
export const analyzePriceAction = async (description: string, imageBase64?: string, mimeType?: string): Promise<Variable> => {
    const parts: any[] = [];
    
    if (imageBase64 && mimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        });
    }
    
    parts.push({
        text: `Analyze this financial context (image and/or description). 
        Description: ${description}
        
        Identify the most critical factor driving price action (e.g., "Market Structure", "Indicator Status", "Candle Pattern").
        Create a single Variable representing this factor with 2-3 States (e.g., "Bullish", "Bearish", "Neutral") and estimated probabilities based on the visual/text evidence.
        
        Return ONLY JSON adhering to the Variable schema.`
    });

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: variableSchema
            }
        });

        const text = response.text ?? '{}';
        const parsed = JSON.parse(text);

        return {
            id: generateUUID(),
            name: parsed.name,
            states: parsed.states.map((state: any) => ({
                id: generateUUID(),
                name: state.name,
                outcomes: state.outcomes.map((outcome: any) => ({
                    id: generateUUID(),
                    name: outcome.name,
                    probability: outcome.probability,
                }))
            }))
        };
    } catch (e) {
        throw new Error(formatGenAIError(e));
    }
};
