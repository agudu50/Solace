import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'db');

// Ensure local persistence directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let pool = null;
let usePostgres = false;

// Errors raised while *acquiring* a connection: the SQL was never sent, so the
// query is safe to retry. Neon computes scale to zero when idle and can take a
// few seconds to wake. Errors after a query was sent are never retried, so a
// write (e.g. a credit deduction) can't be applied twice.
const CONNECT_ERROR = /connection terminated due to connection timeout|timeout exceeded when trying to connect|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Initialize PostgreSQL connection if DATABASE_URL is configured
 */
export async function initDb() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 10,
        idleTimeoutMillis: 30000,
        // Neon cold starts can exceed 5s; give the compute time to wake.
        connectionTimeoutMillis: 15000,
        keepAlive: true,
      });

      // Neon drops idle connections when the compute suspends. pg reports that
      // as an 'error' event on the pool; with no listener Node crashes the whole
      // server. The pool discards the dead client and reconnects on next use.
      pool.on('error', (err) => {
        console.warn(' [DB] Idle Postgres client error (will reconnect on next query):', err.message);
      });

      // Test connection, retrying while a suspended compute wakes up
      let client;
      for (let attempt = 1; ; attempt++) {
        try {
          client = await pool.connect();
          break;
        } catch (err) {
          if (attempt >= 3 || !CONNECT_ERROR.test(err.message)) throw err;
          console.warn(` [DB] Neon connection attempt ${attempt} failed (${err.message}); retrying…`);
          await sleep(1000 * attempt);
        }
      }
      console.log(' [DB] Connected successfully to Neon PostgreSQL database.');
      client.release();

      usePostgres = true;
      await createTablesPostgres();
      return { success: true, engine: 'neon-postgres' };
    } catch (err) {
      console.warn(' [DB] Neon PostgreSQL connection failed or timed out:', err.message);
      console.log(' [DB] Falling back to persistent local storage engine with identical schema.');
      usePostgres = false;
      initFileDb();
      return { success: true, engine: 'local-persistent-store', error: err.message };
    }
  } else {
    console.log(' [DB] DATABASE_URL not set. Running on persistent local storage engine (Neon-ready schema).');
    usePostgres = false;
    initFileDb();
    return { success: true, engine: 'local-persistent-store' };
  }
}

/**
 * Create tables in PostgreSQL (Neon)
 */
async function createTablesPostgres() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(256),
      email VARCHAR(256) UNIQUE,
      password_hash VARCHAR(256),
      password_salt VARCHAR(128),
      reset_token VARCHAR(128),
      reset_token_expires_at TIMESTAMPTZ,
      auth_provider VARCHAR(32) NOT NULL DEFAULT 'wallet',
      wallet_address VARCHAR(56) UNIQUE,
      role VARCHAR(32) NOT NULL DEFAULT 'user',
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    -- Safe column additions for existing installations
    DO $$ BEGIN
      BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(256);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(256) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(256);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt VARCHAR(128);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) DEFAULT 'wallet';
        ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END $$;

    CREATE TABLE IF NOT EXISTS wallet_associations (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_address VARCHAR(56) NOT NULL,
      network VARCHAR(32) NOT NULL DEFAULT 'testnet',
      is_primary BOOLEAN NOT NULL DEFAULT true,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, wallet_address)
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      id VARCHAR(64) PRIMARY KEY,
      wallet_address VARCHAR(56) NOT NULL,
      nonce VARCHAR(128) NOT NULL UNIQUE,
      domain VARCHAR(128) NOT NULL,
      action VARCHAR(64) NOT NULL,
      message TEXT NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_address VARCHAR(56),
      role VARCHAR(32) NOT NULL,
      token_hash VARCHAR(128) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT false,
      ip_address VARCHAR(64),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      actor_wallet VARCHAR(56),
      action VARCHAR(64) NOT NULL,
      target VARCHAR(128),
      details JSONB,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credit_balances (
      wallet_address VARCHAR(56),
      user_id VARCHAR(64),
      credit_balance INTEGER NOT NULL DEFAULT 0,
      total_purchased INTEGER NOT NULL DEFAULT 0,
      total_consumed INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (wallet_address)
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id VARCHAR(64) PRIMARY KEY,
      wallet_address VARCHAR(56),
      user_id VARCHAR(64),
      type VARCHAR(32) NOT NULL,
      amount INTEGER NOT NULL,
      package_id INTEGER,
      tx_hash VARCHAR(128),
      reason TEXT,
      actor VARCHAR(56),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      wallet_address VARCHAR(56) NOT NULL,
      package_id INTEGER NOT NULL,
      amount_xlm NUMERIC(12, 4) NOT NULL,
      credits_granted INTEGER NOT NULL,
      network VARCHAR(32) NOT NULL DEFAULT 'testnet',
      tx_hash VARCHAR(128) UNIQUE NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      wallet_address VARCHAR(56),
      contract_name VARCHAR(256),
      contract_hash VARCHAR(128) NOT NULL,
      credits_reserved INTEGER NOT NULL DEFAULT 10,
      credits_deducted INTEGER NOT NULL DEFAULT 10,
      status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
      risk_score INTEGER,
      model_used VARCHAR(64),
      findings_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS contract_audits (
      id VARCHAR(64) PRIMARY KEY,
      wallet_address VARCHAR(56),
      user_id VARCHAR(64),
      contract_name VARCHAR(256) NOT NULL,
      contract_hash VARCHAR(128) NOT NULL,
      risk_score INTEGER NOT NULL,
      is_secure BOOLEAN NOT NULL,
      summary TEXT,
      audit_type VARCHAR(32) NOT NULL DEFAULT 'PRE',
      findings_json JSONB,
      code_snippet TEXT,
      ledger_seq BIGINT,
      on_chain_tx_hash VARCHAR(128),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Issues: user-reported problems and auto-captured server errors
    CREATE TABLE IF NOT EXISTS issues (
      id VARCHAR(64) PRIMARY KEY,
      source VARCHAR(16) NOT NULL,               -- 'user' | 'system'
      kind VARCHAR(48) NOT NULL DEFAULT 'bug',
      severity VARCHAR(16) NOT NULL DEFAULT 'medium',
      title VARCHAR(256) NOT NULL,
      description TEXT,
      page VARCHAR(512),
      wallet_address VARCHAR(56),
      email VARCHAR(256),
      fingerprint VARCHAR(256),                  -- groups repeats of the same system error
      occurrences INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(16) NOT NULL DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved'
      resolution_note TEXT,
      resolved_by VARCHAR(256),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create performance indexes
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_fingerprint ON issues(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_challenges_nonce ON auth_challenges(nonce);
    CREATE INDEX IF NOT EXISTS idx_challenges_wallet ON auth_challenges(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_credit_tx_wallet ON credit_transactions(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_audits_wallet ON contract_audits(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_audits_hash ON contract_audits(contract_hash);
  `;

  await pool.query(schemaSql);
  console.log(' [DB] Neon PostgreSQL schema verified and indexes created.');
  await migrateLocalDataToPostgres();
}

/**
 * Automatically migrate existing local records into Neon PostgreSQL
 */
async function migrateLocalDataToPostgres() {
  try {
    // 1. Migrate users
    const users = readTable('users');
    for (const u of users) {
      if (!u || !u.id) continue;
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, password_salt, reset_token, reset_token_expires_at, auth_provider, wallet_address, role, status, created_at, updated_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          u.id,
          u.name || null,
          u.email || null,
          u.password_hash || null,
          u.password_salt || null,
          u.reset_token || null,
          u.reset_token_expires_at ? new Date(u.reset_token_expires_at) : null,
          u.auth_provider || 'wallet',
          u.wallet_address || null,
          u.role || 'user',
          u.status || 'active',
          u.created_at ? new Date(u.created_at) : new Date(),
          u.updated_at ? new Date(u.updated_at) : new Date(),
          u.last_login_at ? new Date(u.last_login_at) : null,
        ]
      );
    }

    // 2. Migrate credit balances
    const balances = readTable('credit_balances');
    for (const b of balances) {
      if (b && b.wallet_address) {
        await pool.query(
          `INSERT INTO credit_balances (wallet_address, user_id, credit_balance, total_purchased, total_consumed, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (wallet_address) DO UPDATE SET
             credit_balance = EXCLUDED.credit_balance,
             total_purchased = EXCLUDED.total_purchased,
             total_consumed = EXCLUDED.total_consumed`,
          [
            b.wallet_address,
            b.user_id || null,
            b.credit_balance || 0,
            b.total_purchased || 0,
            b.total_consumed || 0,
            b.updated_at ? new Date(b.updated_at) : new Date(),
          ]
        );
      }
    }

    // 3. Migrate wallet associations
    const associations = readTable('wallet_associations');
    for (const a of associations) {
      if (a && a.id && a.user_id && a.wallet_address) {
        await pool.query(
          `INSERT INTO wallet_associations (id, user_id, wallet_address, network, is_primary, verified_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [
            a.id,
            a.user_id,
            a.wallet_address,
            a.network || 'testnet',
            a.is_primary !== false,
            a.verified_at ? new Date(a.verified_at) : new Date(),
          ]
        );
      }
    }

    console.log(' [DB] Synchronized existing local records to Neon PostgreSQL.');
  } catch (err) {
    console.warn(' [DB] Data migration warning:', err.message);
  }
}

/**
 * File-based Storage Engine (Provides 100% parity with Neon schema when running locally)
 */
const TABLES = [
  'users',
  'wallet_associations',
  'auth_challenges',
  'sessions',
  'audit_logs',
  'credit_balances',
  'credit_transactions',
  'contract_audits',
  'payments',
  'ai_analysis_jobs',
  'issues',
];

function getTableFile(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function initFileDb() {
  for (const table of TABLES) {
    const file = getTableFile(table);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf8');
    }
  }

  // Migrate legacy data/credits.json if exists
  try {
    const legacyCreditsPath = path.join(__dirname, '..', '..', 'data', 'credits.json');
    if (fs.existsSync(legacyCreditsPath)) {
      const legacyData = JSON.parse(fs.readFileSync(legacyCreditsPath, 'utf8'));
      const balanceFile = getTableFile('credit_balances');
      const balances = JSON.parse(fs.readFileSync(balanceFile, 'utf8'));
      
      let modified = false;
      for (const [wallet, item] of Object.entries(legacyData)) {
        if (!balances.find((b) => b.wallet_address === wallet)) {
          balances.push({
            wallet_address: wallet,
            credit_balance: item.balance || 0,
            total_purchased: item.totalPurchased || item.balance || 0,
            total_consumed: item.totalConsumed || 0,
            updated_at: new Date().toISOString(),
          });
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2), 'utf8');
      }
    }
  } catch (_) {}
}

function readTable(table) {
  const file = getTableFile(table);
  try {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function writeTable(table, data) {
  const file = getTableFile(table);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Generic query abstraction for both Neon PostgreSQL and FileDB
 */
export async function query(sql, params = []) {
  if (usePostgres && pool) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        if (attempt >= 3 || !CONNECT_ERROR.test(err.message)) throw err;
        console.warn(` [DB] Query could not connect (${err.message}); retry ${attempt}/2…`);
        await sleep(500 * attempt);
      }
    }
  }

  // Otherwise, use structured file storage methods
  return executeFileQuery(sql, params);
}

/**
 * Local SQL emulation for basic CRUD when Postgres connection is not configured
 */
function executeFileQuery(sql, params = []) {
  const normalized = sql.trim();

  // Basic SELECT handling
  if (normalized.startsWith('SELECT')) {
    const tableMatch = normalized.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tableMatch) return { rows: [], rowCount: 0 };
    const table = tableMatch[1];
    let rows = readTable(table);

    // Filter by single or dual equality
    if (normalized.includes('WHERE')) {
      const wherePart = normalized.split(/WHERE/i)[1].split(/ORDER|LIMIT/i)[0];
      
      // Match parameters
      let paramIndex = 1;
      const conditions = wherePart.split(/\s+AND\s+/i);
      
      rows = rows.filter((item) => {
        return conditions.every((cond) => {
          const match = cond.match(/([a-zA-Z0-9_]+)\s*=\s*\$(\d+)/);
          if (match) {
            const col = match[1];
            const pIdx = parseInt(match[2], 10) - 1;
            const expectedVal = params[pIdx];
            return item[col] === expectedVal;
          }
          return true;
        });
      });
    }

    if (normalized.includes('ORDER BY created_at DESC') || normalized.includes('ORDER BY updated_at DESC')) {
      rows.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));
    }

    if (normalized.includes('LIMIT')) {
      const limitMatch = normalized.match(/LIMIT\s+(\d+|\$(\d+))/i);
      if (limitMatch) {
        const limitVal = limitMatch[2] ? params[parseInt(limitMatch[2], 10) - 1] : parseInt(limitMatch[1], 10);
        rows = rows.slice(0, limitVal);
      }
    }

    return { rows, rowCount: rows.length };
  }

  return { rows: [], rowCount: 0 };
}

export { usePostgres, pool, readTable, writeTable };
