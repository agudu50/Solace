import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Initialize the Google GenAI SDK with explicit API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Prioritize ultra-fast, low-latency models with high availability
export const CANDIDATE_MODELS = (process.env.GEMINI_MODELS?.split(',').map((m) => m.trim()).filter(Boolean)) || [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

// In-memory cache to make repeated audits instantaneous (0ms)
const auditCache = new Map();

export async function analyzeContractWithAI(codeSnippet, isPostDeployment = false) {
  // Check cache first for exact matches
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${isPostDeployment}:${codeSnippet.trim()}`)
    .digest('hex');

  if (auditCache.has(cacheKey)) {
    console.log(`[*] [AI Cache Hit] Returning instant cached report for hash: ${cacheKey.slice(0, 16)}...`);
    return auditCache.get(cacheKey);
  }

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

  // Iterate through available models with immediate fail-over
  for (const model of CANDIDATE_MODELS) {
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
        const result = {
          ...parsed,
          modelUsed: model,
        };

        // Store in cache (limit to 100 entries)
        if (auditCache.size > 100) {
          const firstKey = auditCache.keys().next().value;
          auditCache.delete(firstKey);
        }
        auditCache.set(cacheKey, result);

        return result;
      }
    } catch (error) {
      lastError = error;
      console.warn(`[!] Model ${model} unavailable (${error?.status || error?.message || 'Error'}). Failing over instantly to next candidate...`);
      // Do not sleep; immediately try next candidate model
      continue;
    }
  }

  console.error('All Gemini AI Audit Candidates Failed:', lastError);
  throw new Error(`Failed to complete AI security analysis: ${lastError?.message || 'AI service unavailable'}`);
}


