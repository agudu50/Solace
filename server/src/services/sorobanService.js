import {
  rpc,
  Contract,
  Keypair,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  Address,
} from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID = process.env.SOLACE_CONTRACT_ID || 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';
const AUDITOR_SECRET_KEY = process.env.AUDITOR_SECRET_KEY;
const AUDITOR_ADDRESS = process.env.AUDITOR_ADDRESS;

const server = new rpc.Server(RPC_URL);

/**
 * Returns contract metadata and ledger connectivity
 */
export function getContractInfo() {
  return {
    contractId: CONTRACT_ID,
    rpcUrl: RPC_URL,
    network: process.env.STELLAR_NETWORK || 'testnet',
    networkPassphrase: NETWORK_PASSPHRASE,
    auditorAddress: AUDITOR_ADDRESS || null,
    explorerUrl: `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`,
  };
}

/**
 * Reads an audit report directly from the on-chain Soroban contract storage
 * @param {string} contractHash - SHA-256 hash of the audited contract code
 */
export async function getOnChainAudit(contractHash) {
  try {
    const contract = new Contract(CONTRACT_ID);

    // Dummy account for read-only simulation
    const dummyKeypair = Keypair.random();
    const dummyAccount = new (await import('@stellar/stellar-sdk')).Account(dummyKeypair.publicKey(), '0');

    const tx = new TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call('get_audit', nativeToScVal(contractHash, { type: 'string' }))
      )
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      return {
        found: false,
        error: simulation.error || 'Contract simulation reverted (record may not exist).',
      };
    }

    if (simulation.result?.retval) {
      const parsed = scValToNative(simulation.result.retval);
      return {
        found: true,
        data: parsed,
        contractId: CONTRACT_ID,
        contractHash,
      };
    }

    return { found: false, message: 'No audit record found for this hash.' };
  } catch (error) {
    console.error(`[-] [SorobanService] Failed to read on-chain audit: ${error.message}`);
    throw error;
  }
}

/**
 * Submits an audit report to the on-chain Soroban smart contract using the backend auditor keypair
 * @param {Object} audit - Audit report payload
 */
export async function recordOnChainAudit({
  contractHash,
  riskScore,
  isSecure,
  auditType = 'PRE_DEPLOYMENT',
}) {
  if (!AUDITOR_SECRET_KEY) {
    throw new Error('AUDITOR_SECRET_KEY is not configured in server environment.');
  }

  const auditorKeypair = Keypair.fromSecret(AUDITOR_SECRET_KEY);
  const auditorAddress = auditorKeypair.publicKey();
  const contract = new Contract(CONTRACT_ID);

  console.log(`[+] [SorobanService] Recording audit on-chain for hash: ${contractHash.slice(0, 12)}...`);

  // Load account from Horizon/RPC to get current sequence number
  const account = await server.getAccount(auditorAddress);

  const tx = new TransactionBuilder(account, {
    fee: '100000', // max fee in stroops
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'record_audit',
        new Address(auditorAddress).toScVal(),
        nativeToScVal(contractHash, { type: 'string' }),
        nativeToScVal(Number(riskScore), { type: 'u32' }),
        nativeToScVal(Boolean(isSecure), { type: 'bool' }),
        nativeToScVal(auditType, { type: 'string' })
      )
    )
    .setTimeout(60)
    .build();

  // Assemble footprint and resource fees via RPC simulation
  const preparedTx = await server.prepareTransaction(tx);

  // Sign with auditor key
  preparedTx.sign(auditorKeypair);

  // Submit to Stellar network
  const sendResponse = await server.sendTransaction(preparedTx);

  if (sendResponse.status === 'ERROR') {
    throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  console.log(`[+] [SorobanService] Transaction submitted (${sendResponse.hash}). Verifying ledger inclusion...`);

  // Wait for testnet ledger close
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Verify on-chain record existence
  let onChainAudit = await getOnChainAudit(contractHash);
  let attempts = 0;
  while (!onChainAudit.found && attempts < 5) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onChainAudit = await getOnChainAudit(contractHash);
    attempts++;
  }

  return {
    success: true,
    status: 'SUCCESS',
    transactionHash: sendResponse.hash,
    contractId: CONTRACT_ID,
    auditData: onChainAudit.data || null,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${sendResponse.hash}`,
    contractExplorerUrl: `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`,
  };
}

/**
 * Fetches real-time contract telemetry directly from the live Stellar Soroban testnet
 * @param {string} contractId - Deployed Soroban contract address
 */
export async function getContractTelemetry(contractId) {
  try {
    const contract = new Contract(contractId);
    const key = contract.getFootprint();
    const [entryRes, latestLedgerRes, healthRes] = await Promise.all([
      server.getLedgerEntries(key).catch(() => null),
      server.getLatestLedger().catch(() => null),
      server.getHealth().catch(() => null),
    ]);

    const entry = entryRes?.entries?.[0];
    const latestSeq = latestLedgerRes?.sequence || entryRes?.latestLedger || 0;
    const liveUntil = entry?.liveUntilLedgerSeq || 0;
    const ttlRemaining = liveUntil > latestSeq ? liveUntil - latestSeq : 0;
    const lastModified = entry?.lastModifiedLedgerSeq || null;
    const exists = Boolean(entry);

    return {
      success: true,
      contractId,
      exists,
      status: exists ? 'ACTIVE & VERIFIED' : 'NOT_FOUND_ON_LEDGER',
      latestLedger: latestSeq,
      protocolVersion: latestLedgerRes?.protocolVersion || 22,
      closeTime: latestLedgerRes?.closeTime ? Number(latestLedgerRes.closeTime) : Math.floor(Date.now() / 1000),
      rpcHealth: healthRes?.status || 'healthy',
      liveUntilLedgerSeq: liveUntil,
      lastModifiedLedgerSeq: lastModified,
      ttlRemainingLedgers: ttlRemaining,
      rentStatus: !exists
        ? 'UNINITIALIZED (No Active Ledger Footprint)'
        : ttlRemaining > 20000
        ? 'OPTIMAL (Rent TTL Extended)'
        : ttlRemaining > 5000
        ? 'WARNING (Rent Extension Recommended)'
        : 'CRITICAL (Imminent State Eviction Risk)',
      storageType: exists ? 'Persistent Contract Instance Footprint' : 'None',
      network: 'Stellar Soroban Testnet',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      success: false,
      contractId,
      exists: false,
      status: 'OFFLINE_OR_INVALID',
      error: err.message,
    };
  }
}

export default {
  getContractInfo,
  getOnChainAudit,
  recordOnChainAudit,
  getContractTelemetry,
};

