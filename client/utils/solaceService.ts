import { isConnected, requestAccess } from '@stellar/freighter-api';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Deployed Solace Smart Contract ID on Stellar Testnet
export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

/**
 * Connect to Freighter browser extension wallet
 */
export async function connectWallet(): Promise<string> {
  const installed = await isConnected();
  if (!installed) {
    throw new Error('Freighter wallet is not installed. Please install it from freighter.app');
  }

  const response = await requestAccess();
  const publicKey = typeof response === 'string' ? response : (response as any)?.address;
  if (!publicKey) {
    throw new Error('User rejected wallet connection request.');
  }
  return publicKey;
}

/**
 * Anchor audit report to the Soroban smart contract via the backend service
 */
export async function recordAuditOnChain(
  auditorPublicKey: string,
  contractHash: string,
  riskScore: number,
  isSecure: boolean,
  auditType: string = 'PRE_DEPLOYMENT'
) {
  const response = await fetch(`${API_BASE_URL}/api/contract/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractHash,
      riskScore,
      isSecure,
      auditType,
      auditor: auditorPublicKey,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to record audit onto the Soroban smart contract.');
  }

  return data;
}

/**
 * Query an audit record directly from the Soroban smart contract via backend
 */
export async function getAuditFromChain(contractHash: string) {
  const response = await fetch(`${API_BASE_URL}/api/contract/audit/${encodeURIComponent(contractHash)}`);
  const data = await response.json();
  return data;
}
