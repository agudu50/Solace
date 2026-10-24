import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'credits.json');

// Standardized 3-tier prepaid audit package definitions
export const AUDIT_PACKAGES = {
  1: {
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
  2: {
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
  3: {
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
};

/**
 * In-memory state synchronized with persistent disk storage
 */
let store = {
  users: {}, // address -> { availableCredits, totalPurchased, totalConsumed, lastPurchaseTimestamp, purchases: [], consumptions: [] }
  processedTxHashes: {}, // txHash -> { userAddress, packageId, timestamp }
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn(`[!] [CreditStore] Could not create data directory: ${err.message}`);
  }
}

function loadStore() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        store = {
          users: parsed.users || {},
          processedTxHashes: parsed.processedTxHashes || {},
        };
      }
    }
  } catch (err) {
    console.warn(`[!] [CreditStore] Failed to load credits.json: ${err.message}`);
  }
}

function saveStore() {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[!] [CreditStore] Failed to save credits.json: ${err.message}`);
  }
}

// Initial load on service startup
loadStore();

export function getPackages() {
  return Object.values(AUDIT_PACKAGES);
}

export function getPackageById(packageId) {
  const id = Number(packageId);
  return AUDIT_PACKAGES[id] || null;
}

export function getUserRecord(userAddress) {
  if (!userAddress) return null;
  const normalized = userAddress.trim();
  if (!store.users[normalized]) {
    store.users[normalized] = {
      userAddress: normalized,
      availableCredits: 0,
      totalPurchased: 0,
      totalConsumed: 0,
      lastPurchaseTimestamp: null,
      purchases: [],
      consumptions: [],
    };
  }
  return store.users[normalized];
}

export function getUserBalance(userAddress) {
  const record = getUserRecord(userAddress);
  if (!record) {
    return {
      userAddress: '',
      availableCredits: 0,
      totalPurchased: 0,
      totalConsumed: 0,
      lastPurchaseTimestamp: null,
      isLowBalance: true,
    };
  }

  return {
    userAddress: record.userAddress,
    availableCredits: record.availableCredits,
    totalPurchased: record.totalPurchased,
    totalConsumed: record.totalConsumed,
    lastPurchaseTimestamp: record.lastPurchaseTimestamp,
    isLowBalance: record.availableCredits <= 1,
  };
}

export function recordPackagePurchase({ userAddress, packageId, txHash, explorerUrl, amountXLM }) {
  if (!userAddress || !packageId || !txHash) {
    throw new Error('userAddress, packageId, and txHash are required to grant credits.');
  }

  const normalized = userAddress.trim();
  const pkg = getPackageById(packageId);
  if (!pkg) {
    throw new Error(`Invalid package ID: ${packageId}. Must be 1 (Starter), 2 (Growth), or 3 (Professional).`);
  }

  // Idempotency check: prevent duplicate grants from replayed transactions
  if (store.processedTxHashes[txHash]) {
    console.log(`[*] [CreditStore] Transaction ${txHash.slice(0, 16)}... already processed. Returning existing balance.`);
    return getUserBalance(normalized);
  }

  const record = getUserRecord(normalized);
  const creditsToAdd = pkg.credits;

  // Add credits onto existing balance (accumulative, non-expiring)
  record.availableCredits += creditsToAdd;
  record.totalPurchased += creditsToAdd;
  record.lastPurchaseTimestamp = new Date().toISOString();

  const purchaseItem = {
    id: `purch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    packageId: pkg.id,
    packageName: pkg.name,
    creditsGranted: creditsToAdd,
    priceXLM: amountXLM || pkg.priceXLM,
    txHash,
    explorerUrl: explorerUrl || `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    timestamp: new Date().toISOString(),
    status: 'CONFIRMED',
  };

  record.purchases.unshift(purchaseItem);
  store.processedTxHashes[txHash] = {
    userAddress: normalized,
    packageId: pkg.id,
    timestamp: new Date().toISOString(),
  };

  saveStore();

  console.log(
    `[✓] [CreditStore] Granted ${creditsToAdd} credits to ${normalized.slice(0, 8)}... via ${pkg.name} package. Available: ${record.availableCredits}`
  );

  return {
    ...getUserBalance(normalized),
    latestPurchase: purchaseItem,
  };
}

export function consumeCreditForContract({ userAddress, contractHash }) {
  if (!userAddress) {
    throw new Error('userAddress is required to consume audit credit.');
  }

  const normalized = userAddress.trim();
  const record = getUserRecord(normalized);

  // Idempotency: if credit was already consumed for this specific contract hash by this user, do not double-debit
  const existingAudit = record.consumptions.find((c) => c.contractHash === contractHash);
  if (existingAudit) {
    console.log(
      `[*] [CreditStore] Contract ${contractHash.slice(0, 12)}... already credited for ${normalized.slice(0, 8)}... (Zero-fee re-audit)`
    );
    return {
      success: true,
      deducted: false,
      alreadyConsumed: true,
      remainingCredits: record.availableCredits,
      consumptionRecord: existingAudit,
    };
  }

  if (record.availableCredits <= 0) {
    throw new Error(
      'Insufficient audit credits. Please purchase an audit bundle package (Starter: 30 XLM, Growth: 60 XLM, or Professional: 90 XLM).'
    );
  }

  // Deduct exactly 1 credit
  record.availableCredits -= 1;
  record.totalConsumed += 1;

  const consumptionItem = {
    id: `audit_credit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contractHash,
    timestamp: new Date().toISOString(),
    remainingCredits: record.availableCredits,
  };

  record.consumptions.unshift(consumptionItem);
  saveStore();

  console.log(
    `[✓] [CreditStore] Consumed 1 credit for contract ${contractHash.slice(0, 12)}... by ${normalized.slice(0, 8)}... Remaining: ${record.availableCredits}`
  );

  return {
    success: true,
    deducted: true,
    alreadyConsumed: false,
    remainingCredits: record.availableCredits,
    consumptionRecord: consumptionItem,
  };
}

export function getUserHistory(userAddress) {
  const record = getUserRecord(userAddress);
  if (!record) {
    return {
      purchases: [],
      consumptions: [],
    };
  }
  return {
    purchases: record.purchases,
    consumptions: record.consumptions,
  };
}

export default {
  AUDIT_PACKAGES,
  getPackages,
  getPackageById,
  getUserBalance,
  recordPackagePurchase,
  consumeCreditForContract,
  getUserHistory,
};
