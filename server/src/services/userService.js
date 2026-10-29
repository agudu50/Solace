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
 * Secure password hashing using Node.js built-in PBKDF2 (SHA-512)
 */
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, salt, hash) {
  const calculated = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

/**
 * Validate email address format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

/**
 * Find user by email address
 */
export async function findUserByEmail(email) {
  if (!isValidEmail(email)) return null;
  const normalized = email.trim().toLowerCase();

  if (usePostgres) {
    const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [normalized]);
    return res.rows[0] || null;
  }

  const users = readTable('users');
  return users.find((u) => u.email && u.email.toLowerCase() === normalized) || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id) {
  if (!id) return null;

  if (usePostgres) {
    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] || null;
  }

  const users = readTable('users');
  return users.find((u) => u.id === id) || null;
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
 * Register a new user with Email and Password
 */
export async function createEmailUser({ name, email, password }) {
  if (!name || name.trim().length === 0) {
    throw new Error('Full name is required.');
  }

  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('This email address is already registered. Please log in instead.');
  }

  const id = `usr_${crypto.randomBytes(16).toString('hex')}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  if (usePostgres) {
    const res = await query(
      `INSERT INTO users (id, name, email, password_hash, password_salt, auth_provider, role, status, created_at, updated_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, 'email', 'user', 'active', $6, $6, $6)
       RETURNING *`,
      [id, name.trim(), normalizedEmail, passwordHash, salt, now]
    );

    await query(
      `INSERT INTO credit_balances (wallet_address, user_id, credit_balance, total_purchased, total_consumed, updated_at)
       VALUES ($1, $2, 0, 0, 0, $3)
       ON CONFLICT (wallet_address) DO NOTHING`,
      [id, id, now]
    );

    return res.rows[0];
  }

  // File DB
  const users = readTable('users');
  const newUser = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    password_salt: salt,
    auth_provider: 'email',
    wallet_address: null,
    role: 'user',
    status: 'active',
    created_at: now,
    updated_at: now,
    last_login_at: now,
  };
  users.push(newUser);
  writeTable('users', users);

  const balances = readTable('credit_balances');
  balances.push({
    wallet_address: id,
    user_id: id,
    credit_balance: 0,
    total_purchased: 0,
    total_consumed: 0,
    updated_at: now,
  });
  writeTable('credit_balances', balances);

  return newUser;
}

/**
 * Authenticate user with Email and Password
 */
export async function loginEmailUser(email, password) {
  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user || !user.password_hash || !user.password_salt) {
    throw new Error('Invalid email or password.');
  }

  if (user.status === 'suspended' || user.status === 'revoked') {
    throw new Error('This account has been suspended. Please contact platform support.');
  }

  const isValid = verifyPassword(password, user.password_salt, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  // Update last login
  const now = new Date().toISOString();
  if (usePostgres) {
    await query('UPDATE users SET last_login_at = $1, updated_at = $1 WHERE id = $2', [now, user.id]);
  } else {
    const users = readTable('users');
    const existing = users.find((u) => u.id === user.id);
    if (existing) {
      existing.last_login_at = now;
      existing.updated_at = now;
      writeTable('users', users);
    }
  }

  return user;
}

/**
 * Request password recovery token
 */
export async function requestPasswordReset(email) {
  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    // Return success to prevent email enumeration
    return { success: true, message: 'If that email is registered, a reset link will be sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiration

  if (usePostgres) {
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2, updated_at = NOW() WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );
  } else {
    const users = readTable('users');
    const existing = users.find((u) => u.id === user.id);
    if (existing) {
      existing.reset_token = resetToken;
      existing.reset_token_expires_at = expiresAt;
      existing.updated_at = new Date().toISOString();
      writeTable('users', users);
    }
  }

  return {
    success: true,
    resetToken, // Returned for dev/test verification
    expiresAt,
    message: 'Password reset token generated successfully.',
  };
}

/**
 * Reset password using valid reset token
 */
export async function resetPasswordWithToken(resetToken, newPassword) {
  if (!resetToken || typeof resetToken !== 'string') {
    throw new Error('Reset token is required.');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const now = new Date().toISOString();
  let user = null;

  if (usePostgres) {
    const res = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > $2 LIMIT 1',
      [resetToken, now]
    );
    user = res.rows[0];
  } else {
    const users = readTable('users');
    user = users.find(
      (u) => u.reset_token === resetToken && u.reset_token_expires_at && new Date(u.reset_token_expires_at) > new Date()
    );
  }

  if (!user) {
    throw new Error('Invalid or expired password reset token. Please request a new reset link.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, salt);

  if (usePostgres) {
    await query(
      `UPDATE users 
       SET password_hash = $1, password_salt = $2, reset_token = NULL, reset_token_expires_at = NULL, updated_at = $3
       WHERE id = $4`,
      [passwordHash, salt, now, user.id]
    );
  } else {
    const users = readTable('users');
    const existing = users.find((u) => u.id === user.id);
    if (existing) {
      existing.password_hash = passwordHash;
      existing.password_salt = salt;
      existing.reset_token = null;
      existing.reset_token_expires_at = null;
      existing.updated_at = now;
      writeTable('users', users);
    }
  }

  return { success: true, message: 'Password has been reset successfully. You can now log in.' };
}

/**
 * Link an authenticated Stellar wallet to an existing user account
 */
export async function linkWalletToUser({ userId, walletAddress }) {
  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) {
    throw new Error('Invalid Stellar wallet address format.');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User account not found.');
  }

  // Check if wallet is already claimed by a DIFFERENT account
  const existingWithWallet = await findUserByWallet(normalized);
  if (existingWithWallet && existingWithWallet.id !== userId) {
    throw new Error('This wallet address is already linked to another user account.');
  }

  const now = new Date().toISOString();
  const nextProvider = user.auth_provider === 'email' ? 'hybrid' : user.auth_provider;

  if (usePostgres) {
    await query(
      `UPDATE users SET wallet_address = $1, auth_provider = $2, updated_at = $3 WHERE id = $4`,
      [normalized, nextProvider, now, userId]
    );

    await query(
      `INSERT INTO wallet_associations (id, user_id, wallet_address, network, is_primary, verified_at)
       VALUES ($1, $2, $3, 'testnet', true, $4)
       ON CONFLICT (user_id, wallet_address) DO UPDATE SET verified_at = $4`,
      [`wa_${crypto.randomBytes(12).toString('hex')}`, userId, normalized, now]
    );
  } else {
    const users = readTable('users');
    const target = users.find((u) => u.id === userId);
    if (target) {
      target.wallet_address = normalized;
      target.auth_provider = nextProvider;
      target.updated_at = now;
      writeTable('users', users);
    }

    const walletAssoc = readTable('wallet_associations');
    const existingAssoc = walletAssoc.find((w) => w.user_id === userId && w.wallet_address === normalized);
    if (!existingAssoc) {
      walletAssoc.push({
        id: `wa_${crypto.randomBytes(12).toString('hex')}`,
        user_id: userId,
        wallet_address: normalized,
        network: 'testnet',
        is_primary: true,
        verified_at: now,
      });
      writeTable('wallet_associations', walletAssoc);
    }
  }

  return { success: true, walletAddress: normalized, authProvider: nextProvider };
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
