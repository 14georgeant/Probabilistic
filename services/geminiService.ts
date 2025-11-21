
import { GoogleGenAI, Type, Chat } from "@google/genai";
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

// Helper to format errors into user-friendly messages
const formatGenAIError = (error: unknown): string => {
    if (error instanceof Error) {
        const msg = error.message;
        
        // Security Risk Pass-through
        if (msg.startsWith('SECURITY_RISK_DETECTED')) {
            return msg;
        }

        // API Key / Auth
        if (msg.includes('API key') || msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')) {
             return "Authentication Error: The API Key is missing, invalid, or not configured correctly. Please check your environment settings.";
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
        
        return `System Error: ${msg}`;
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
    mode: 'general' | 'financial' | 'health' | 'medical' | 'programmer' = 'general'
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
    mode: 'general' | 'financial' | 'health' | 'medical' | 'programmer' = 'general'
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
        throw new Error(formatGenAIError(error));
    }
};

// Updated function for analyzing Price Action description AND image
export const analyzePriceAction = async (description: string, imageBase64?: string, mimeType: string = 'image/jpeg'): Promise<Variable> => {
    const prompt = `
    You are a Professional Technical Analyst for Financial Markets (Forex, Crypto, Stocks).
    Your task is to analyze the provided context (Price Action Description and/or Chart Image).
    
    ${imageBase64 ? 'An image of the chart has been provided as an external reference.' : ''}
    ${description ? `USER DESCRIPTION: "${description}"` : ''}
    
    **INSTRUCTIONS:**
    1. Identify the core pattern (e.g., "Head and Shoulders", "Bullish Divergence", "Breakout retest").
    2. Define 2-3 possible future states (e.g., "Bullish Continuation", "Bearish Reversal", "False Breakout").
    3. Assign probabilities to each state based on standard technical analysis theory for that pattern.
    4. Ensure the variable name is descriptive (e.g., "H4 Market Structure", "RSI Divergence Impact").

    **OUTPUT FORMAT:**
    You must return ONLY a valid JSON object adhering to this schema:
    ${JSON.stringify(variableSchema, null, 2)}
    `;

    try {
        const ai = getAiClient();
        
        // Prepare contents with multimodal input support
        const contents: any[] = [];
        
        if (imageBase64) {
            contents.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            });
        }
        
        contents.push({ text: prompt });

        const response = await ai.models.generateContent({
            model, // using gemini-2.5-flash which supports vision
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: variableSchema
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI.");
        
        const parsed = JSON.parse(text);
        
        const textToCheck = `${parsed.name} ${parsed.states.map((s: any) => s.name).join(' ')}`;
        if (await checkForMaliciousIntent(textToCheck)) {
            throw new Error("SECURITY_RISK_DETECTED: Malicious content in price action analysis.");
        }

        return {
            id: crypto.randomUUID(),
            name: parsed.name,
            states: parsed.states.map((s: any) => ({
                id: crypto.randomUUID(),
                name: s.name,
                outcomes: s.outcomes.map((o: any) => ({
                    id: crypto.randomUUID(),
                    name: o.name || 'Success',
                    probability: o.probability
                }))
            }))
        };

    } catch (error) {
        console.error("Price action analysis error:", error);
        throw new Error(formatGenAIError(error));
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
        throw new Error(formatGenAIError(error));
    }
};

export const generateCppAdaptivityCode = async (variables: Variable[]): Promise<string> => {
    const varSchema = variables.map(v => ({
        name: v.name,
        states: v.states.map(s => ({ name: s.name, prob: s.outcomes[0]?.probability || 0 }))
    }));

    const prompt = `
    You are an expert embedded systems engineer.
    Create a production-ready C++17 class 'AdaptiveOptimizer' for the following variables and states:
    ${JSON.stringify(varSchema, null, 2)}
    
    REQUIREMENTS:
    1. The class should encapsulate the state probabilities efficiently.
    2. Include a method 'updateProbability(std::string variableName, std::string stateName, int newProbability)' to adapt to real-time data adjustments.
    3. Include a method 'calculateOptimalPath()' that performs a basic probabilistic traversal to find the best path based on current weights.
    4. Use standard STL containers (std::vector, std::map, std::string).
    5. Include concise Doxygen-style comments explaining the adaptivity logic.
    
    OUTPUT FORMAT:
    Return ONLY the raw C++ source code. Do not include markdown formatting (no \`\`\`cpp or \`\`\`).
    `;

    try {
        const ai = getAiClient();
        // Upgrading to 3-pro-preview for complex coding tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });
        
        let text = response.text ?? "// Error generating C++ code.";
        text = text.replace(/```cpp/g, '').replace(/```/g, '').trim();
        return text;

    } catch (e) {
        return "// Error generating C++ code: " + formatGenAIError(e);
    }
};

// Create a dedicated Chat Session for Medical use using the reasoning model
export const createMedicalChat = (): Chat => {
    const ai = getAiClient();
    // Using gemini-3-pro-preview for complex medical reasoning tasks
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: `You are a helpful, highly knowledgeable Medical Research Assistant.
            
            YOUR GOAL:
            Provide accurate, science-backed medical information to the user to help them understand symptoms, treatments, or health concepts.
            
            STRICT RULES:
            1. **Google Search**: You MUST use the Google Search tool to find information from approved medical journals (PubMed, JAMA, Lancet, NEJM, Nature Medicine, etc.) or reputable health organizations (CDC, WHO, Mayo Clinic).
            2. **Citations**: You MUST cite your sources. If Google Search provides a link, include it.
            3. **Tone**: Professional, clinical, yet accessible and user-friendly.
            4. **Disclaimer**: You MUST always include a disclaimer that you are an AI and this is not medical advice.
            5. **Formatting**: Use Markdown for readability.
            
            If asked about specific medical advice for an individual, generalize the answer and strongly advise consulting a doctor.
            `,
            tools: [{ googleSearch: {} }]
        }
    });
};

// Create a dedicated Chat Session for Financial Advice (ICT) using the reasoning model
export const createFinancialChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: `You are an expert Financial Market Analyst and Trading Mentor specializing in ICT (Inner Circle Trader) Price Action principles.

            YOUR EXPERTISE:
            - Market Structure (MSH, MSS, BOS)
            - Liquidity Pools (Buy-side/Sell-side Liquidity)
            - Order Blocks (OB) & Breaker Blocks
            - Fair Value Gaps (FVG) / Imbalances
            - Optimal Trade Entry (OTE)
            - Power of 3 (Accumulation, Manipulation, Distribution)

            YOUR GOAL:
            Provide detailed market analysis, educational explanations of price action, and strategic insights based on current market data found via search.

            STRICT RULES:
            1. **Google Search**: You MUST use the Google Search tool to validate current market sentiment, news, or price levels.
            2. **Sources**: Prioritize information from **FXStreet, TradingView, Investing.com, Bloomberg, and Reuters**.
            3. **Tone**: Professional, analytical, disciplined, risk-aware.
            4. **Disclaimer**: You MUST always include a disclaimer that you are an AI and this is NOT financial advice.
            5. **Formatting**: Use Markdown. Use bullet points for key levels (Support/Resistance/Liquidity).

            If asked about specific trade setups, explain them in terms of probabilities and ICT concepts (e.g., "Price is approaching a bearish Order Block on the H4...").`,
            tools: [{ googleSearch: {} }]
        }
    });
};

// Create a dedicated Chat Session for Programmer (Dev) use
export const createProgrammerChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: `You are a Senior Software Engineer, Open Source Contributor, and "The Programmer's Mate".

            YOUR EXPERTISE:
            - Full Stack Development (React, Node.js, Python, Go, Rust, C++)
            - System Design & Scalable Architecture
            - Debugging Complex Issues (Memory Leaks, Race Conditions)
            - DevOps, CI/CD, and Cloud Infrastructure (AWS, GCP)
            - Algorithms & Data Structures

            YOUR GOAL:
            Assist the user with finding libraries, debugging, architectural decisions, and understanding complex code patterns using the latest info from the web.

            STRICT RULES:
            1. **Google Search**: Use it to find the latest documentation, GitHub repositories, StackOverflow discussions, or tech blogs.
            2. **Sources**: Prioritize GitHub, MDN Web Docs, StackOverflow, Official Documentation, and reputable engineering blogs.
            3. **Tone**: Helpful, concise, pragmatic, and code-centric. Talk like a senior engineer to a peer.
            4. **Fun Add-on**: Occasionally suggest a "Pro Tip", a useful VS Code extension, or a relevant developer joke/meme reference if context fits.
            5. **Disclaimer**: I am an AI. Always review code before deploying to production.
            6. **Formatting**: Use Code Blocks for all code snippets.

            If asked for libraries, compare options (e.g., "Zod vs Yup").
            `,
            tools: [{ googleSearch: {} }]
        }
    });
};
