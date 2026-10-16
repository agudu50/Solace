import { isConnected, requestAccess, getNetwork, getNetworkDetails, signTransaction } from '@stellar/freighter-api';

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Deployed Solace Smart Contract ID on Stellar Testnet
export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

/**
 * Detect network automatically from connected Freighter wallet or production environment
 */
export async function detectWalletNetwork(): Promise<'testnet' | 'mainnet'> {
  if (typeof window === 'undefined') return 'testnet';

  const isProdEnv = process.env.NODE_ENV === 'production';

  try {
    const detailsPromise = getNetworkDetails();
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000));
    const details: any = await Promise.race([detailsPromise, timeoutPromise]);

    if (details) {
      const net = String(details.network || details.networkPassphrase || '').toUpperCase();
      if (net.includes('PUBLIC') || net.includes('MAINNET')) {
        return 'mainnet';
      }
      if (net.includes('TEST')) {
        return 'testnet';
      }
    }

    const netPromise = getNetwork();
    const netName: any = await Promise.race([netPromise, timeoutPromise]);
    if (netName) {
      const str = String(typeof netName === 'string' ? netName : netName?.network || '').toUpperCase();
      if (str.includes('PUBLIC') || str.includes('MAINNET')) {
        return 'mainnet';
      }
      if (str.includes('TEST')) {
        return 'testnet';
      }
    }
  } catch (_) {}

  return isProdEnv ? 'mainnet' : 'testnet';
}

/**
 * Check if the Freighter browser extension is available
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (Boolean((window as any).freighter)) return true;
  try {
    const connPromise = isConnected();
    const timeoutPromise = new Promise<{ isConnected: boolean }>((resolve) =>
      setTimeout(() => resolve({ isConnected: false }), 1200)
    );
    const connResult = await Promise.race([connPromise, timeoutPromise]);
    return connResult?.isConnected === true;
  } catch {
    return false;
  }
}

/**
 * Connect to Freighter browser extension wallet with timeout guards
 * and automatically detect the active wallet network (Testnet vs Mainnet)
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
    const errPayload = (response as any).error;
    const errorMsg =
      typeof errPayload === 'string'
        ? errPayload
        : errPayload?.message || 'Freighter access request rejected.';
    throw new Error(errorMsg);
  }

  const publicKey =
    typeof response === 'string'
      ? response
      : (response as any)?.address || (response as any)?.publicKey;

  if (!publicKey) {
    throw new Error('No public key returned by Freighter wallet.');
  }

  // Validate format of Stellar public key (56-character string starting with G)
  if (typeof publicKey !== 'string' || !/^G[A-Z0-9]{55}$/.test(publicKey)) {
    throw new Error('Invalid Stellar auditor address returned by wallet extension.');
  }

  // 3. Automatically determine network from the wallet
  try {
    const detectedNet = await detectWalletNetwork();
    localStorage.setItem('solace-network', detectedNet);
    window.dispatchEvent(new CustomEvent('solace-network-updated', { detail: { network: detectedNet } }));
  } catch (_) {}

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

export interface AuditFeeReceipt {
  success: boolean;
  status: string;
  transactionHash: string;
  feeXLM: number;
  feeStroops: string;
  currency: string;
  payer: string;
  recipient: string;
  contractHash: string;
  timestamp: string;
  explorerUrl: string;
}

/**
 * Prompts user's Freighter browser wallet to authorize and sign the 1.0 XLM audit fee transaction.
 * Broadcasts the signed transaction to the Stellar Testnet ledger and returns verified on-chain confirmation.
 */
export async function signAndPayAuditFee(
  userAddress: string,
  contractHash: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<AuditFeeReceipt> {
  if (!userAddress) {
    throw new Error('User wallet address is required to process audit fee payment.');
  }

  // 1. Build fee payment transaction on backend
  const buildRes = await fetch(`${API_BASE_URL}/api/contract/build-fee-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress,
      contractHash,
      network,
    }),
  });

  const buildData = await buildRes.json();
  if (!buildRes.ok || !buildData.success || !buildData.xdr) {
    throw new Error(buildData.error || 'Failed to prepare audit fee payment transaction on Stellar.');
  }

  // 2. Trigger Freighter wallet extension popup to request user confirmation
  let signResult: any;
  try {
    signResult = await signTransaction(buildData.xdr, {
      networkPassphrase: buildData.networkPassphrase,
      address: userAddress,
    });
  } catch (signErr: any) {
    const msg = signErr?.message || '';
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline') || msg.toLowerCase().includes('cancel')) {
      throw new Error('Audit fee payment declined by user in Freighter wallet.');
    }
    throw new Error(msg || 'Transaction signing rejected in Freighter wallet.');
  }

  if (signResult?.error) {
    const rawErr = signResult.error;
    const msg = typeof rawErr === 'string' ? rawErr : rawErr?.message || 'Transaction rejected in Freighter wallet.';
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline') || msg.toLowerCase().includes('cancel')) {
      throw new Error('Audit fee payment declined by user in Freighter wallet.');
    }
    throw new Error(msg);
  }

  const signedXdr: string =
    typeof signResult === 'string'
      ? signResult
      : signResult?.signedTxXdr || signResult?.signedTransaction;

  if (!signedXdr) {
    throw new Error('No signed transaction XDR returned by Freighter wallet.');
  }

  // 3. Broadcast the user-signed transaction to Stellar network via Horizon
  const submitRes = await fetch(`${API_BASE_URL}/api/contract/submit-fee-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedXdr,
      userAddress,
      contractHash,
      network,
    }),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok || !submitData.success) {
    throw new Error(submitData.error || 'Failed to submit and broadcast signed fee transaction to Stellar network.');
  }

  return submitData;
}

