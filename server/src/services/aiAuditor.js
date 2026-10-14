import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google GenAI SDK (reads process.env.GEMINI_API_KEY automatically)
const ai = new GoogleGenAI();

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

  try {
    // Calling Gemini 3.8 Flash for deep software engineering and security analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini 3.8 Flash Audit Error:', error);
    throw new Error('Failed to complete AI security analysis using Gemini 3.8 Flash.');
  }
}
