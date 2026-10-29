import crypto from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';
import { query, usePostgres, readTable, writeTable } from '../db/db.js';
import { isValidStellarAddress, normalizeWallet } from './userService.js';

// Challenges expire in 5 minutes (300 seconds)
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Format the signable authentication challenge text
 */
function buildChallengeMessage({ domain, address, action, nonce, issuedAt, expiresAt }) {
  return [
    'Solace Security Auditor Authentication',
    '',
    `Domain: ${domain}`,
    `Auditor Wallet: ${address}`,
    `Action: ${action}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`,
    '',
    'Notice: Sign this message with your Stellar keypair to securely authenticate your auditor session. This cryptographic signature operates completely off-chain and will never cost any network fees.',
  ].join('\n');
}

/**
 * Generate a fresh single-use authentication challenge
 */
export async function createChallenge(walletAddress, action = 'solace-auth-login', domain = 'localhost:3000') {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) {
    throw new Error('Invalid Stellar wallet address format');
  }

  const challengeId = `ch_${crypto.randomBytes(16).toString('hex')}`;
  const nonce = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + CHALLENGE_EXPIRY_MS);
  const issuedAt = now.toISOString();
  const expiresAt = expires.toISOString();

  const message = buildChallengeMessage({
    domain,
    address: normalized,
    action,
    nonce,
    issuedAt,
    expiresAt,
  });

  if (usePostgres) {
    await query(
      `INSERT INTO auth_challenges (id, wallet_address, nonce, domain, action, message, issued_at, expires_at, used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $7)`,
      [challengeId, normalized, nonce, domain, action, message, issuedAt, expiresAt]
    );
  } else {
    const challenges = readTable('auth_challenges');
    challenges.push({
      id: challengeId,
      wallet_address: normalized,
      nonce,
      domain,
      action,
      message,
      issued_at: issuedAt,
      expires_at: expiresAt,
      used: false,
      created_at: issuedAt,
    });
    writeTable('auth_challenges', challenges);
  }

  return {
    challengeId,
    address: normalized,
    nonce,
    domain,
    action,
    message,
    issuedAt,
    expiresAt,
  };
}

/**
 * Helper to parse various signature encodings (hex, base64, Buffer, byte array)
 */
export function parseSignatureBuffer(rawSig) {
  if (Buffer.isBuffer(rawSig)) return rawSig;

  if (typeof rawSig === 'string') {
    const trimmed = rawSig.trim();
    // 64-byte Ed25519 signature in hex format has length 128
    if (/^[0-9a-fA-F]{128}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    // Attempt standard base64 and url-safe base64 decode
    try {
      const normalizedBase64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      const b = Buffer.from(normalizedBase64, 'base64');
      if (b.length === 64) return b;
    } catch (_) {}
    return Buffer.from(trimmed, 'utf8');
  }

  if (Array.isArray(rawSig)) {
    return Buffer.from(rawSig);
  }

  if (rawSig && typeof rawSig === 'object' && rawSig.data) {
    return Buffer.from(rawSig.data);
  }

  throw new Error('Unsupported signature encoding format');
}

/**
 * Verify cryptographic signature against challenge and mark as consumed
 */
export async function verifyAndConsumeChallenge({
  challengeId,
  address,
  signature,
  expectedAction = null,
  expectedDomain = null,
}) {
  const normalized = normalizeWallet(address);
  if (!isValidStellarAddress(normalized)) {
    throw new Error('Invalid Stellar wallet address format');
  }

  if (!challengeId || typeof challengeId !== 'string') {
    throw new Error('Missing challenge identifier');
  }

  if (!signature) {
    throw new Error('Missing cryptographic signature');
  }

  // 1. Fetch challenge from store
  let challenge = null;

  if (usePostgres) {
    const res = await query('SELECT * FROM auth_challenges WHERE id = $1 LIMIT 1', [challengeId]);
    challenge = res.rows[0];
  } else {
    const challenges = readTable('auth_challenges');
    challenge = challenges.find((c) => c.id === challengeId);
  }

  if (!challenge) {
    throw new Error('Authentication challenge not found or expired');
  }

  // 2. Security Check: Prevent Nonce Replay Attacks
  if (challenge.used) {
    throw new Error('Authentication challenge has already been used (replay attempt rejected)');
  }

  // 3. Security Check: Expiration
  const now = new Date();
  const expiresAt = new Date(challenge.expires_at);
  if (now > expiresAt) {
    throw new Error('Authentication challenge has expired. Please request a fresh challenge.');
  }

  // 4. Security Check: Wallet Address Match
  if (challenge.wallet_address !== normalized) {
    throw new Error('Wallet address does not match authentication challenge recipient');
  }

  // 5. Security Check: Action Binding
  if (expectedAction && challenge.action !== expectedAction) {
    throw new Error(`Authentication action mismatch: expected ${expectedAction}, got ${challenge.action}`);
  }

  // 6. Security Check: Domain Binding
  if (expectedDomain && challenge.domain !== expectedDomain) {
    // Tolerant check for local dev port variations
    if (!challenge.domain.startsWith('localhost') || !expectedDomain.startsWith('localhost')) {
      throw new Error(`Cross-domain authentication rejected: domain mismatch (${challenge.domain} vs ${expectedDomain})`);
    }
  }

  // 7. Cryptographic Ed25519 Signature Verification
  // Supports canonical SEP-0053 (Freighter standard), raw prefixed, direct sha256, and direct raw message
  let isValidSig = false;
  try {
    const keypair = Keypair.fromPublicKey(normalized);
    const messageBuffer = Buffer.from(challenge.message, 'utf8');
    const signatureBuffer = parseSignatureBuffer(signature);

    // Candidate 1: SEP-0053 Canonical (SHA-256 over "Stellar Signed Message:\n" + message)
    // This is the official standard used by the Freighter browser extension
    const sep53Payload = Buffer.concat([
      Buffer.from('Stellar Signed Message:\n', 'utf8'),
      messageBuffer,
    ]);
    const sep53Hash = crypto.createHash('sha256').update(sep53Payload).digest();
    if (keypair.verify(sep53Hash, signatureBuffer)) {
      isValidSig = true;
    }

    // Candidate 2: SEP-0053 unhashed payload
    if (!isValidSig && keypair.verify(sep53Payload, signatureBuffer)) {
      isValidSig = true;
    }

    // Candidate 3: Direct SHA-256 message hash
    const rawHash = crypto.createHash('sha256').update(messageBuffer).digest();
    if (!isValidSig && keypair.verify(rawHash, signatureBuffer)) {
      isValidSig = true;
    }

    // Candidate 4: Direct raw message (used by server evaluator signer and raw Keypair.sign)
    if (!isValidSig && keypair.verify(messageBuffer, signatureBuffer)) {
      isValidSig = true;
    }
  } catch (err) {
    console.error('[Auth] Cryptographic verification failed:', err.message);
    throw new Error(`Cryptographic signature verification failed: ${err.message}`);
  }

  if (!isValidSig) {
    throw new Error('Invalid cryptographic signature: signature does not correspond to wallet public key');
  }

  // 8. Invalidate challenge immediately (single-use constraint)
  if (usePostgres) {
    await query('UPDATE auth_challenges SET used = true WHERE id = $1', [challengeId]);
  } else {
    const challenges = readTable('auth_challenges');
    const ch = challenges.find((c) => c.id === challengeId);
    if (ch) {
      ch.used = true;
      writeTable('auth_challenges', challenges);
    }
  }

  return {
    verified: true,
    walletAddress: normalized,
    action: challenge.action,
    domain: challenge.domain,
  };
}
