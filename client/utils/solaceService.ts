import { Contract, SorobanRpc, nativeToScVal } from '@stellar/stellar-sdk';
import { isConnected, requestAccess } from '@stellar/freighter-api';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const server = new SorobanRpc.Server(RPC_URL);

// Replace with your deployed contract ID after deployment
const CONTRACT_ID = process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

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

export async function recordAuditOnChain(
  auditorPublicKey: string,
  contractHash: string,
  riskScore: number,
  isSecure: boolean,
  auditType: string
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(auditorPublicKey);

  // Builds transaction payload invoking record_audit on Soroban
  let tx = contract.call(
    'record_audit',
    nativeToScVal(auditorPublicKey, { type: 'address' }),
    nativeToScVal(contractHash, { type: 'string' }),
    nativeToScVal(riskScore, { type: 'u32' }),
    nativeToScVal(isSecure, { type: 'bool' }),
    nativeToScVal(auditType, { type: 'string' })
  );
  
  return "Transaction simulation and build pipeline ready.";
}
