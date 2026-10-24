import {
  isConnected,
  requestAccess,
  getNetwork,
  getNetworkDetails,
  signTransaction,
  WatchWalletChanges,
} from '@stellar/freighter-api';

export { WatchWalletChanges };

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Deployed Solace Smart Contract ID on Stellar Testnet
export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

/**
 * Detect network automatically - strictly Testnet (Stellar Protocol 22)
 */
export async function detectWalletNetwork(): Promise<'testnet' | 'mainnet'> {
  return 'testnet';
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

  // 3. Save active network as testnet
  try {
    localStorage.setItem('solace-network', 'testnet');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-network-updated', { detail: { network: 'testnet' } }));
    }
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

// ============================================================================
// Credit-Based Subscription Packages & Management
// ============================================================================

export interface AuditPackage {
  id: number;
  name: string;
  priceXLM: number;
  priceStroops: string;
  credits: number;
  pricePerAuditXLM: number;
  badge: string;
  description: string;
  features: string[];
}

export const PREPAID_PACKAGES: AuditPackage[] = [
  {
    id: 1,
    name: 'Starter',
    priceXLM: 30,
    priceStroops: '300000000',
    credits: 3,
    pricePerAuditXLM: 10,
    badge: 'Popular for MVPs',
    description: 'Prepaid 3 smart contract security audits. Unused credits never expire and roll over indefinitely.',
    features: [
      '3 Complete AST Invariant Audits',
      'No Expiration Date (Use At Your Own Pace)',
      'On-Chain SHA-256 Ledger Provenance',
      'Solace AI Remediation Patches',
      'Full CI/CD & CLI Compatibility',
    ],
  },
  {
    id: 2,
    name: 'Growth',
    priceXLM: 60,
    priceStroops: '600000000',
    credits: 6,
    pricePerAuditXLM: 10,
    badge: 'Best Value',
    description: 'Prepaid 6 smart contract security audits for active protocol teams and recurring deployments.',
    features: [
      '6 Complete AST Invariant Audits',
      'No Expiration Date (Never Expire)',
      'Priority Flash AI Multi-Model Invariant Checks',
      'Storage TTL & Auth Invariant Verification',
      'Direct Stellar Expert Verifiable Badges',
    ],
  },
  {
    id: 3,
    name: 'Professional',
    priceXLM: 90,
    priceStroops: '900000000',
    credits: 9,
    pricePerAuditXLM: 10,
    badge: 'Protocol Standard',
    description: 'Prepaid 9 smart contract security audits for production DeFi vaults, DEXes, and DAO governance.',
    features: [
      '9 Complete AST Invariant Audits',
      'No Expiration Date (Roll Over Forever)',
      'Comprehensive Multi-Vector Exploit Traps',
      'Auditor Multi-Sig Ledger Proof Inscriptions',
      'Continuous Production State Invariance',
    ],
  },
];

export interface UserCreditBalance {
  userAddress: string;
  availableCredits: number;
  totalPurchased: number;
  totalConsumed: number;
  lastPurchaseTimestamp: string | null;
  isLowBalance: boolean;
}

export interface CreditPurchaseReceipt {
  success: boolean;
  status: string;
  transactionHash: string;
  packageId: number;
  packageName: string;
  priceXLM: number;
  creditsGranted: number;
  payer: string;
  recipient: string;
  explorerUrl: string;
  timestamp: string;
  creditBalance: UserCreditBalance;
}

export interface CreditHistory {
  balance: UserCreditBalance;
  purchases: Array<{
    id: string;
    packageId: number;
    packageName: string;
    creditsGranted: number;
    priceXLM: number;
    txHash: string;
    explorerUrl: string;
    timestamp: string;
    status: string;
  }>;
  consumptions: Array<{
    id: string;
    contractHash: string;
    timestamp: string;
    remainingCredits: number;
  }>;
}

/**
 * Fetch available audit packages from backend / contract definitions
 */
export async function fetchAuditPackages(): Promise<AuditPackage[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/credits/packages`);
    if (res.ok) {
      const data = await res.json();
      if (data.packages && Array.isArray(data.packages)) {
        return data.packages;
      }
    }
  } catch (_) {}
  return PREPAID_PACKAGES;
}

/**
 * Fetch authoritative user audit credit balance
 */
export async function fetchUserCreditBalance(userAddress: string): Promise<UserCreditBalance> {
  if (!userAddress) {
    return {
      userAddress: '',
      availableCredits: 0,
      totalPurchased: 0,
      totalConsumed: 0,
      lastPurchaseTimestamp: null,
      isLowBalance: true,
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/credits/balance/${encodeURIComponent(userAddress)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (_) {}

  // Fallback to local storage if server unreachable
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`solace_credits_${userAddress}`);
      if (local) return JSON.parse(local);
    }
  } catch (_) {}

  return {
    userAddress,
    availableCredits: 0,
    totalPurchased: 0,
    totalConsumed: 0,
    lastPurchaseTimestamp: null,
    isLowBalance: true,
  };
}

/**
 * Fetch user's purchase and audit consumption history
 */
export async function fetchUserCreditHistory(userAddress: string): Promise<CreditHistory> {
  if (!userAddress) {
    return {
      balance: {
        userAddress: '',
        availableCredits: 0,
        totalPurchased: 0,
        totalConsumed: 0,
        lastPurchaseTimestamp: null,
        isLowBalance: true,
      },
      purchases: [],
      consumptions: [],
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/credits/history/${encodeURIComponent(userAddress)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          balance: data.balance,
          purchases: data.purchases || [],
          consumptions: data.consumptions || [],
        };
      }
    }
  } catch (_) {}

  return {
    balance: await fetchUserCreditBalance(userAddress),
    purchases: [],
    consumptions: [],
  };
}

/**
 * Purchase a prepaid audit package (30 XLM for 3 audits, 60 XLM for 6 audits, or 90 XLM for 9 audits)
 * Triggers Freighter wallet extension popup for user authorization and broadcasts on-chain.
 */
export async function purchaseCreditPackage(
  userAddress: string,
  packageId: number,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<CreditPurchaseReceipt> {
  if (!userAddress) {
    throw new Error('User wallet address is required to purchase an audit package.');
  }

  // 1. Build unsigned transaction on backend
  const buildRes = await fetch(`${API_BASE_URL}/api/credits/build-purchase-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress,
      packageId,
      network,
    }),
  });

  const buildData = await buildRes.json();
  if (!buildRes.ok || !buildData.success || !buildData.xdr) {
    throw new Error(buildData.error || 'Failed to prepare package purchase transaction.');
  }

  // 2. Prompt Freighter browser extension to sign the package payment
  let signResult: any;
  try {
    signResult = await signTransaction(buildData.xdr, {
      networkPassphrase: buildData.networkPassphrase,
      address: userAddress,
    });
  } catch (signErr: any) {
    const msg = signErr?.message || '';
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline') || msg.toLowerCase().includes('cancel')) {
      throw new Error('Package purchase declined by user in Freighter wallet.');
    }
    throw new Error(msg || 'Transaction signing rejected in Freighter wallet.');
  }

  if (signResult?.error) {
    const rawErr = signResult.error;
    const msg = typeof rawErr === 'string' ? rawErr : rawErr?.message || 'Transaction rejected in Freighter wallet.';
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('decline') || msg.toLowerCase().includes('cancel')) {
      throw new Error('Package purchase declined by user in Freighter wallet.');
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

  // 3. Broadcast to Stellar network via Horizon
  const submitRes = await fetch(`${API_BASE_URL}/api/credits/submit-purchase-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedXdr,
      userAddress,
      packageId,
      network,
    }),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok || !submitData.success) {
    throw new Error(submitData.error || 'Failed to submit package purchase to Stellar ledger.');
  }

  // Cache in localStorage and notify listeners
  try {
    if (typeof window !== 'undefined' && submitData.creditBalance) {
      localStorage.setItem(`solace_credits_${userAddress}`, JSON.stringify(submitData.creditBalance));
      window.dispatchEvent(
        new CustomEvent('solace-credits-updated', {
          detail: { userAddress, balance: submitData.creditBalance, latestPurchase: submitData },
        })
      );
    }
  } catch (_) {}

  return submitData;
}

/**
 * Consumes 1 credit from the user's available balance for a smart contract audit
 */
export async function consumeAuditCredit(userAddress: string, contractHash: string) {
  if (!userAddress || !contractHash) {
    throw new Error('userAddress and contractHash are required.');
  }

  const res = await fetch(`${API_BASE_URL}/api/credits/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, contractHash }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to consume audit credit.');
  }

  // Notify listeners
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('solace-credits-updated', {
          detail: { userAddress, remainingCredits: data.remainingCredits },
        })
      );
    }
  } catch (_) {}

  return data;
}


