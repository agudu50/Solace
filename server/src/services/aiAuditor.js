import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google GenAI SDK (reads process.env.GEMINI_API_KEY automatically)
const ai = new GoogleGenAI();

export const CANDIDATE_MODELS = (process.env.GEMINI_MODELS?.split(',').map((m) => m.trim()).filter(Boolean)) || [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
];

export async function analyzeContractWithAI(codeSnippet, isPostDeployment = false) {
  const systemPrompt = `
You are Solace AI, an elite smart contract security auditor and principal engineer specializing in Rust and Stellar Soroban smart contracts. Your job is to analyze smart contract code for bugs, logic flaws, security vulnerabilities, and adherence to Soroban best practices.

You must handle two operational modes based on user context:
1. PRE-DEPLOYMENT: Static code analysis before the contract is pushed to the blockchain.
2. POST-DEPLOYMENT: Inspection of deployed contract logic, state management, or upgrade vectors.

For every contract snippet or payload provided, analyze it thoroughly against common Soroban/Rust security pitfalls:
- Missing or improper authorization checks (e.g., missing require_auth()).
- Unsafe unwrapping (.unwrap() causing transaction panics).
- Reentrancy risks and improper state updates.
- TTL (Time-To-Live) and instance/persistent storage mismanagement (essential for Soroban rent/archival rules).
- Arithmetic overflows/underflows.
- Access control flaws on administrative functions.

You must respond in strict JSON format matching this schema:
{
  "riskScore": number (0 to 100, where 100 is maximum risk),
  "isSecure": boolean,
  "summary": "Concise overview of the audit findings.",
  "vulnerabilities": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "title": "Short title of the vulnerability",
      "description": "Detailed explanation of why this is a risk in Soroban.",
      "recommendation": "Concrete, actionable code fix or architectural recommendation."
    }
  ],
  "postDeploymentRecommendations": [
    "Actionable monitoring, event logging, or upgrade-path suggestions if this contract is already live on the network."
  ]
}

Do not include any conversational filler outside of the JSON block. Ensure valid JSON output only.
`;

  const modeContext = isPostDeployment 
    ? "Context: This contract has ALREADY been deployed to the Stellar network. Focus heavily on state handling, upgrade paths, and post-deployment monitoring."
    : "Context: This is a Pre-Deployment code audit.";

  let lastError;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            { 
              role: 'user', 
              parts: [{ text: `${systemPrompt}\n\n${modeContext}\n\nContract Code:\n${codeSnippet}` }] 
            }
          ],
          config: {
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            ...parsed,
            modelUsed: model,
          };
        }
      } catch (error) {
        lastError = error;
        const isRetryable = error?.status === 503 || error?.status === 429;
        if (isRetryable && attempt < 2) {
          const delay = 1500;
          console.warn(`[!] ${model} high demand (${error.status}). Retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        console.warn(`[!] Model ${model} unavailable (${error?.status || error?.message}), trying next candidate...`);
        break; // Move to next candidate model
      }
    }
  }

  console.error('All Gemini AI Audit Candidates Failed:', lastError);
  throw new Error(`Failed to complete AI security analysis: ${lastError?.message || 'AI service unavailable'}`);
}


