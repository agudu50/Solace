import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { query, usePostgres, readTable, writeTable } from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'solace_stellar_soroban_security_jwt_secret_key_2026_audit';
const SESSION_EXPIRATION_HOURS = 24;

/**
 * Generate a cryptographically signed session token and persist session metadata
 */
export async function createSession(user, metadata = {}) {
  const sessionId = `ses_${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_HOURS * 60 * 60 * 1000);

  const payload = {
    sessionId,
    userId: user.id,
    address: user.wallet_address,
    role: user.role,
    status: user.status,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${SESSION_EXPIRATION_HOURS}h`,
    algorithm: 'HS256',
  });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  if (usePostgres) {
    await query(
      `INSERT INTO sessions (id, user_id, wallet_address, role, token_hash, expires_at, revoked, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9)`,
      [
        sessionId,
        user.id,
        user.wallet_address,
        user.role,
        tokenHash,
        expiresAt.toISOString(),
        metadata.ip || null,
        metadata.userAgent || null,
        now.toISOString(),
      ]
    );
  } else {
    const sessions = readTable('sessions');
    sessions.push({
      id: sessionId,
      user_id: user.id,
      wallet_address: user.wallet_address,
      role: user.role,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      revoked: false,
      ip_address: metadata.ip || null,
      user_agent: metadata.userAgent || null,
      created_at: now.toISOString(),
    });
    writeTable('sessions', sessions);
  }

  return {
    token,
    sessionId,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Verify and decode a session token, checking revocation and user validity
 */
export async function verifySession(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (usePostgres) {
      const res = await query(
        `SELECT s.*, u.status as user_status, u.role as current_role
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token_hash = $1 AND s.revoked = false AND s.expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );
      if (!res.rows[0]) return null;
      const sessionRow = res.rows[0];
      if (sessionRow.user_status !== 'active') return null;

      return {
        sessionId: sessionRow.id,
        userId: sessionRow.user_id,
        address: sessionRow.wallet_address,
        role: sessionRow.current_role,
        status: sessionRow.user_status,
      };
    }

    const sessions = readTable('sessions');
    const session = sessions.find((s) => s.token_hash === tokenHash && !s.revoked);
    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) return null;

    const users = readTable('users');
    const user = users.find((u) => u.id === session.user_id);
    if (!user || user.status !== 'active') return null;

    return {
      sessionId: session.id,
      userId: user.id,
      address: user.wallet_address,
      role: user.role,
      status: user.status,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Revoke session on logout
 */
export async function revokeSession(token) {
  if (!token) return;
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (usePostgres) {
      await query('UPDATE sessions SET revoked = true WHERE token_hash = $1', [tokenHash]);
    } else {
      const sessions = readTable('sessions');
      const session = sessions.find((s) => s.token_hash === tokenHash);
      if (session) {
        session.revoked = true;
        writeTable('sessions', sessions);
      }
    }
  } catch (_) {}
}
