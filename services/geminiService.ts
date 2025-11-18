import { GoogleGenAI, Type } from "@google/genai";
import { Variable, AnalysisResult, Outcome, VariableState } from '../types';

// We use a partial declaration here to ensure TS is happy even if types/node isn't fully picked up in the editor context,
// though the tsconfig update handles the build.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
- **Broader Strategy:** Suggest one other strategic action the user could take based on the overall model to incrementally lift the success rate.
- **Model Enhancement:** Propose one new, relevant variable the user could add to their model to gain a more complete picture. Explain why this variable is important for a more robust strategy.
  `;
  
  try {
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

export const analyzeLinkForVariables = async (url: string): Promise<Variable> => {
    const prompt = `You are a strategic analyst. A user has provided a URL. Your task is to analyze the content and purpose of the website at this URL and propose a new, relevant variable for their probabilistic model.

URL provided by user: ${url}

Based on the likely content of this URL, identify a single, core strategic variable. For this variable, define 2-3 distinct states (or strategies). For each state, estimate the probability of achieving a 'Success' outcome. 'Success' in this context means achieving the primary goal of the entity behind the website (e.g., making a sale, getting sign-ups, increasing engagement).

**IMPORTANT:** Do not attempt to access the URL directly. Your analysis must be based solely on the URL's structure, domain, and common knowledge about websites of its type. This is a privacy-preserving analysis to protect user data.

Return your response as a single, clean JSON object that adheres to the provided schema. Do not include any other text, markdown formatting, or explanations.
`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: variableSchema,
            }
        });
        
        // Safely access text
        const text = response.text ?? '';
        
        if (!text) {
            throw new Error("No response received from AI service.");
        }

        const parsed = JSON.parse(text);

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
        return variableWithIds;

    } catch (error) {
        console.error("Error analyzing link:", error);
        if (error instanceof Error && error.message.startsWith('SECURITY_RISK_DETECTED')) {
            throw error;
        }
        throw new Error("Failed to generate a variable from the link. The AI may not have been able to interpret the URL. Please try a different one.");
    }
};