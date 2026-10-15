import { isConnected, requestAccess } from '@stellar/freighter-api';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Deployed Solace Smart Contract ID on Stellar Testnet
export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

/**
 * Connect to Freighter browser extension wallet with timeout guards
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection is only supported in browser environments.');
  }

  // 1. Check if window.freighter exists or isConnected() responds within 2 seconds
  let hasFreighter = Boolean((window as any).freighter);
  
  if (!hasFreighter) {
    try {
      const connPromise = isConnected();
      const timeoutPromise = new Promise<{ isConnected: boolean }>((resolve) =>
        setTimeout(() => resolve({ isConnected: false }), 2000)
      );
      const connResult = await Promise.race([connPromise, timeoutPromise]);
      hasFreighter = connResult?.isConnected === true;
    } catch {
      hasFreighter = false;
    }
  }

  if (!hasFreighter) {
    throw new Error('FREIGHTER_NOT_INSTALLED');
  }

  // 2. Request access with a 10s timeout in case popup is ignored
  const accessPromise = requestAccess();
  const timeoutPromise = new Promise<{ address?: string; error?: any }>((resolve) =>
    setTimeout(() => resolve({ error: { message: 'Wallet connection request timed out.' } }), 10000)
  );

  const response = await Promise.race([accessPromise, timeoutPromise]);

  if ((response as any)?.error) {
    throw new Error((response as any).error.message || 'Freighter access request rejected.');
  }

  const publicKey =
    typeof response === 'string'
      ? response
      : (response as any)?.address || (response as any)?.publicKey;

  if (!publicKey) {
    throw new Error('No public key returned by Freighter wallet.');
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
