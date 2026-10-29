import {
  isConnected,
  requestAccess,
  setAllowed,
  getAddress,
  getNetwork,
  getNetworkDetails,
  signTransaction,
  signMessage,
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
      setTimeout(() => resolve({ isConnected: false }), 1500)
    );
    const connResult = await Promise.race([connPromise, timeoutPromise]);
    return connResult?.isConnected === true;
  } catch {
    return false;
  }
}

/**
 * Connect to Freighter browser extension wallet.
 * Triggers requestAccess() immediately on the user's click gesture so that Chrome/Edge/Brave
 * preserves user activation and does not block Freighter's extension confirmation popup.
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection is only supported in browser environments.');
  }

  // 1. Immediately initiate access request without any intermediate async delay.
  // This preserves the browser's transient user-gesture activation context.
  let publicKey = '';

  try {
    const accessPromise = (async () => {
      // Primary: requestAccess() prompts the user to unlock Freighter and authorize
      const res: any = await requestAccess();
      if (res && !res.error) {
        const key = typeof res === 'string' ? res : res.address || res.publicKey;
        if (key && /^G[A-Z0-9]{55}$/.test(key)) {
          return key;
        }
      }

      if (res?.error) {
        const errObj = res.error;
        const msg = typeof errObj === 'string' ? errObj : errObj.message || 'Freighter access request was rejected.';
        throw new Error(msg);
      }

      throw new Error('Wallet authorization was cancelled. Please unlock Freighter and approve access.');
    })();

    // 60-second timeout guard so user has ample time to enter their password
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Freighter wallet connection request timed out. Please check if your Freighter extension is unlocked.'
            )
          ),
        60000
      )
    );

    publicKey = await Promise.race([accessPromise, timeoutPromise]);
  } catch (err: any) {
    const rawMsg = (err?.message || String(err)).toLowerCase();
    if (
      rawMsg.includes('reject') ||
      rawMsg.includes('cancel') ||
      rawMsg.includes('decline') ||
      rawMsg.includes('denied') ||
      rawMsg.includes('closed') ||
      rawMsg.includes('user declined')
    ) {
      throw new Error('Wallet authorization was cancelled in Freighter. Please unlock and approve to authenticate.');
    }

    // Check if Freighter extension is truly not installed
    const isInstalled = await checkFreighterInstalled();
    if (!isInstalled) {
      throw new Error('FREIGHTER_NOT_INSTALLED');
    }
    throw err;
  }

  if (!publicKey || !/^G[A-Z0-9]{55}$/.test(publicKey)) {
    throw new Error('No valid Stellar auditor address returned by Freighter wallet.');
  }

  // Save active network as testnet
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

// =========================================================================
// WALLET-ONLY CRYPTOGRAPHIC AUTHENTICATION PROTOCOL
// =========================================================================

export interface AuthChallengeResponse {
  success: boolean;
  challengeId: string;
  address: string;
  nonce: string;
  domain: string;
  action: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  authProvider?: 'email' | 'wallet' | 'hybrid';
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'revoked';
  createdAt: string;
  lastLoginAt?: string;
  availableCredits: number;
  totalPurchased?: number;
  totalConsumed?: number;
  permissions?: {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    canAudit: boolean;
  };
}

export interface AuthVerifyResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  expiresAt: string;
  error?: string;
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Registration failed.');
  }
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('solace_auth_token', data.token);
    localStorage.setItem('solace_user_role', data.user.role);
  }
  return data;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Login failed.');
  }
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('solace_auth_token', data.token);
    localStorage.setItem('solace_user_role', data.user.role);
  }
  return data;
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Password reset request failed.');
  }
  return data;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Password reset failed.');
  }
  return data;
}

export async function linkWalletToAccount(address: string): Promise<{ success: boolean; walletAddress: string; authProvider: string }> {
  const challenge = await requestAuthChallenge(address, 'solace-link-wallet' as any);
  const signature = await signAuthChallengeWithWallet(challenge.message, address, challenge.challengeId);

  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('solace_auth_token') || '';
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/link-wallet`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      walletAddress: address,
      challengeId: challenge.challengeId,
      signature,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Wallet linking failed.');
  }
  return data;
}

/**
 * 1. Request an unpredictable cryptographic authentication challenge from backend
 */
export async function requestAuthChallenge(
  address: string,
  action: 'solace-auth-login' | 'solace-admin-login' = 'solace-auth-login'
): Promise<AuthChallengeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, action }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to request authentication challenge.');
  }

  return data;
}

/**
 * 2. Sign the authentication challenge using the user's connected wallet
 */
export async function signAuthChallengeWithWallet(
  message: string,
  address: string,
  challengeId?: string
): Promise<string> {
  const DEMO_SIGNER = 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI';

  // Demo Keypair / Fallback evaluator support via backend signer
  if (address === DEMO_SIGNER && challengeId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/evaluator-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, address }),
      });
      const data = await res.json();
      if (data.success && data.signature) {
        return data.signature;
      }
    } catch (_) {}
  }

  // Freighter Extension signature prompt
  try {
    const signResult = await signMessage(message, {
      address,
      networkPassphrase: 'Test SDF Network ; September 2015',
    });

    if ((signResult as any)?.error) {
      const err = (signResult as any).error;
      const msg = typeof err === 'string' ? err : err?.message || 'Signature request cancelled in Freighter.';
      throw new Error(msg);
    }

    const rawSig = signResult.signedMessage;
    if (!rawSig) {
      throw new Error('No signature returned by wallet.');
    }

    if (typeof rawSig === 'string') {
      return rawSig;
    }
    if (Buffer.isBuffer(rawSig)) {
      return rawSig.toString('hex');
    }
    if (Array.isArray(rawSig)) {
      return Buffer.from(rawSig).toString('hex');
    }
    if (typeof rawSig === 'object' && (rawSig as any).data) {
      return Buffer.from((rawSig as any).data).toString('hex');
    }

    return String(rawSig);
  } catch (err: any) {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('cancel') || msg.includes('reject') || msg.includes('decline')) {
      throw new Error('Wallet signature request was cancelled. Please sign the challenge to authenticate.');
    }
    throw err;
  }
}

/**
 * Complete Wallet Authentication Flow:
 * Requests challenge -> Prompts wallet signature -> Verifies on backend -> Establishes session
 */
export async function authenticateWalletSession(
  address: string,
  action: 'solace-auth-login' | 'solace-admin-login' = 'solace-auth-login'
): Promise<AuthVerifyResponse> {
  // 1. Request challenge
  const challenge = await requestAuthChallenge(address, action);

  // 2. Sign challenge with wallet (or evaluator backend signer)
  const signature = await signAuthChallengeWithWallet(challenge.message, address, challenge.challengeId);

  // 3. Verify signature on backend
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Receive and persist HTTP-only session cookie
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      address,
      signature,
      action,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Authentication signature verification failed.');
  }

  // Cache token in memory / storage
  try {
    if (typeof window !== 'undefined' && data.token) {
      localStorage.setItem('solace_auth_token', data.token);
      localStorage.setItem('solace_user_role', data.user.role);
    }
  } catch (_) {}

  return data;
}

/**
 * Fetch current authenticated user session details from backend
 */
export async function fetchCurrentUserSession(): Promise<AuthUser | null> {
  try {
    let token = '';
    let hasCookie = false;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('solace_auth_token') || '';
      hasCookie = document.cookie.includes('solace_session=');
      // If neither token nor session cookie exists, visitor is unauthenticated
      if (!token && !hasCookie) {
        return null;
      }
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.user) {
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Logout and invalidate authenticated session on backend
 */
export async function logoutUserSession(): Promise<void> {
  try {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('solace_auth_token') || '';
      localStorage.removeItem('solace_auth_token');
      localStorage.removeItem('solace_user_role');
      localStorage.removeItem('solace_connected_wallet');
      localStorage.setItem('solace_wallet_disconnected', 'true');
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
  } catch (_) {}
}

// =========================================================================
// ADMINISTRATOR DASHBOARD API CLIENT
// =========================================================================

function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('solace_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Fetch platform analytics and metrics (Admin Only)
 */
export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch administrator statistics.');
  }
  return data.stats;
}

/**
 * Fetch all registered users (Admin Only)
 */
export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch registered users.');
  }
  return data.users;
}

/**
 * Update user status (Admin Only)
 */
export async function updateUserStatusAdmin(address: string, status: 'active' | 'suspended' | 'revoked', reason?: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${address}/status`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update user status.');
  }
  return data;
}

/**
 * Update user role (Super Admin / Admin Only)
 */
export async function updateUserRoleAdmin(address: string, role: 'user' | 'admin' | 'super_admin', reason?: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${address}/role`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ role, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update user role.');
  }
  return data;
}

/**
 * Fetch platform audits (Admin Only)
 */
export async function fetchAdminAudits() {
  const res = await fetch(`${API_BASE_URL}/api/admin/audits`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch audits.');
  }
  return data.audits;
}

/**
 * Fetch credit transactions & purchases (Admin Only)
 */
export async function fetchAdminPurchases() {
  const res = await fetch(`${API_BASE_URL}/api/admin/purchases`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch purchases.');
  }
  return data.purchases;
}

/**
 * Adjust credits for any wallet (Admin Only)
 */
export async function adjustCreditsAdmin(walletAddress: string, amount: number, reason: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/credits/adjust`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ walletAddress, amount, reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to adjust credits.');
  }
  return data;
}

/**
 * Fetch administrative audit logs (Admin Only)
 */
export async function fetchAdminLogs() {
  const res = await fetch(`${API_BASE_URL}/api/admin/logs`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch audit logs.');
  }
  return data.logs;
}



