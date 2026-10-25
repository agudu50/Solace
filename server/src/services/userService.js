import crypto from 'node:crypto';
import { query, usePostgres, readTable, writeTable } from '../db/db.js';

/**
 * Normalize Stellar wallet address
 */
export function normalizeWallet(address) {
  if (!address || typeof address !== 'string') return '';
  return address.trim().toUpperCase();
}

/**
 * Validate Stellar public key format (G followed by 55 alphanumeric characters)
 */
export function isValidStellarAddress(address) {
  return typeof address === 'string' && /^G[A-Z0-9]{55}$/.test(address.trim());
}

/**
 * Find user by wallet address
 */
export async function findUserByWallet(walletAddress) {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) return null;

  if (usePostgres) {
    const res = await query('SELECT * FROM users WHERE wallet_address = $1 LIMIT 1', [normalized]);
    return res.rows[0] || null;
  }

  const users = readTable('users');
  return users.find((u) => u.wallet_address === normalized) || null;
}

/**
 * Create a new user with default 'user' role
 */
export async function createUser(walletAddress, role = 'user') {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) {
    throw new Error('Invalid Stellar wallet address format');
  }

  // Safety: new registrations cannot be assigned admin automatically
  const safeRole = role === 'admin' || role === 'super_admin' ? role : 'user';
  const id = `usr_${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date().toISOString();

  if (usePostgres) {
    const res = await query(
      `INSERT INTO users (id, wallet_address, role, status, created_at, updated_at, last_login_at)
       VALUES ($1, $2, $3, 'active', $4, $4, $4)
       RETURNING *`,
      [id, normalized, safeRole, now]
    );

    await query(
      `INSERT INTO wallet_associations (id, user_id, wallet_address, network, is_primary, verified_at)
       VALUES ($1, $2, $3, 'testnet', true, $4)`,
      [`wa_${crypto.randomBytes(12).toString('hex')}`, id, normalized, now]
    );

    // Initialize 0 credit balance
    await query(
      `INSERT INTO credit_balances (wallet_address, credit_balance, total_purchased, total_consumed, updated_at)
       VALUES ($1, 0, 0, 0, $2)
       ON CONFLICT (wallet_address) DO NOTHING`,
      [normalized, now]
    );

    return res.rows[0];
  }

  // File DB
  const users = readTable('users');
  const existing = users.find((u) => u.wallet_address === normalized);
  if (existing) return existing;

  const newUser = {
    id,
    wallet_address: normalized,
    role: safeRole,
    status: 'active',
    created_at: now,
    updated_at: now,
    last_login_at: now,
  };
  users.push(newUser);
  writeTable('users', users);

  const walletAssoc = readTable('wallet_associations');
  walletAssoc.push({
    id: `wa_${crypto.randomBytes(12).toString('hex')}`,
    user_id: id,
    wallet_address: normalized,
    network: 'testnet',
    is_primary: true,
    verified_at: now,
  });
  writeTable('wallet_associations', walletAssoc);

  const balances = readTable('credit_balances');
  if (!balances.find((b) => b.wallet_address === normalized)) {
    balances.push({
      wallet_address: normalized,
      credit_balance: 0,
      total_purchased: 0,
      total_consumed: 0,
      updated_at: now,
    });
    writeTable('credit_balances', balances);
  }

  return newUser;
}

/**
 * Record successful login timestamp
 */
export async function recordLogin(walletAddress) {
  const normalized = normalizeWallet(walletAddress);
  const now = new Date().toISOString();

  if (usePostgres) {
    await query('UPDATE users SET last_login_at = $1, updated_at = $1 WHERE wallet_address = $2', [now, normalized]);
    return;
  }

  const users = readTable('users');
  const user = users.find((u) => u.wallet_address === normalized);
  if (user) {
    user.last_login_at = now;
    user.updated_at = now;
    writeTable('users', users);
  }
}

/**
 * Update user role (e.g., promote to 'admin' or demote to 'user')
 */
export async function updateUserRole(walletAddress, newRole) {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) throw new Error('Invalid wallet address');
  if (!['user', 'admin', 'super_admin'].includes(newRole)) throw new Error('Invalid role specified');

  const now = new Date().toISOString();

  if (usePostgres) {
    const res = await query(
      `UPDATE users SET role = $1, updated_at = $2 WHERE wallet_address = $3 RETURNING *`,
      [newRole, now, normalized]
    );
    return res.rows[0] || null;
  }

  const users = readTable('users');
  const user = users.find((u) => u.wallet_address === normalized);
  if (!user) return null;
  user.role = newRole;
  user.updated_at = now;
  writeTable('users', users);
  return user;
}

/**
 * Update user account status (e.g., 'active', 'suspended')
 */
export async function updateUserStatus(walletAddress, newStatus) {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) throw new Error('Invalid wallet address');
  if (!['active', 'suspended', 'revoked'].includes(newStatus)) throw new Error('Invalid status specified');

  const now = new Date().toISOString();

  if (usePostgres) {
    const res = await query(
      `UPDATE users SET status = $1, updated_at = $2 WHERE wallet_address = $3 RETURNING *`,
      [newStatus, now, normalized]
    );
    return res.rows[0] || null;
  }

  const users = readTable('users');
  const user = users.find((u) => u.wallet_address === normalized);
  if (!user) return null;
  user.status = newStatus;
  user.updated_at = now;
  writeTable('users', users);
  return user;
}

/**
 * Get all users with credit balances for admin console
 */
export async function getAllUsers() {
  if (usePostgres) {
    const res = await query(`
      SELECT u.id, u.wallet_address, u.role, u.status, u.created_at, u.updated_at, u.last_login_at,
             COALESCE(cb.credit_balance, 0) as credit_balance,
             COALESCE(cb.total_purchased, 0) as total_purchased,
             COALESCE(cb.total_consumed, 0) as total_consumed
      FROM users u
      LEFT JOIN credit_balances cb ON u.wallet_address = cb.wallet_address
      ORDER BY u.created_at DESC
    `);
    return res.rows;
  }

  const users = readTable('users');
  const balances = readTable('credit_balances');

  return users.map((u) => {
    const cb = balances.find((b) => b.wallet_address === u.wallet_address) || {};
    return {
      ...u,
      credit_balance: cb.credit_balance || 0,
      total_purchased: cb.total_purchased || 0,
      total_consumed: cb.total_consumed || 0,
    };
  });
}
