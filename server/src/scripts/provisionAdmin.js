#!/usr/bin/env node

/**
 * Secure Administrator Provisioning Script
 * 
 * Usage:
 *   node src/scripts/provisionAdmin.js <wallet-address> [--role admin|super_admin]
 *   npm run provision-admin -- <wallet-address>
 * 
 * Examples:
 *   node src/scripts/provisionAdmin.js GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI
 *   node src/scripts/provisionAdmin.js GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI --role super_admin
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { initDb } from '../db/db.js';
import { findUserByWallet, createUser, updateUserRole, isValidStellarAddress, normalizeWallet } from '../services/userService.js';
import { logAdminAction } from '../services/auditLogService.js';

async function main() {
  const args = process.argv.slice(2);
  let walletAddress = null;
  let targetRole = 'admin';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--role' && args[i + 1]) {
      targetRole = args[i + 1].toLowerCase();
      i++;
    } else if (!args[i].startsWith('--')) {
      walletAddress = args[i];
    }
  }

  // Fallback to AUDITOR_ADDRESS from .env if running without arguments for initial bootstrap
  if (!walletAddress && process.env.AUDITOR_ADDRESS) {
    console.log(`[!] No wallet provided. Using AUDITOR_ADDRESS from .env: ${process.env.AUDITOR_ADDRESS}`);
    walletAddress = process.env.AUDITOR_ADDRESS;
  }

  if (!walletAddress) {
    console.error(' [ERROR] Wallet address is required.');
    console.log('\nUsage:');
    console.log('  node src/scripts/provisionAdmin.js <STELLAR_WALLET_ADDRESS> [--role admin|super_admin]');
    console.log('\nExample:');
    console.log('  node src/scripts/provisionAdmin.js GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI');
    process.exit(1);
  }

  const normalized = normalizeWallet(walletAddress);
  if (!isValidStellarAddress(normalized)) {
    console.error(` [ERROR] Invalid Stellar wallet address format: "${walletAddress}"`);
    console.error('Stellar public keys must be 56 characters starting with "G".');
    process.exit(1);
  }

  if (!['admin', 'super_admin'].includes(targetRole)) {
    console.error(` [ERROR] Invalid role: "${targetRole}". Must be "admin" or "super_admin".`);
    process.exit(1);
  }

  console.log('='.repeat(65));
  console.log('  SOLACE PLATFORM: ADMINISTRATOR PROVISIONING PROTOCOL');
  console.log('='.repeat(65));
  console.log(` Target Wallet: ${normalized}`);
  console.log(` Assigned Role: ${targetRole}`);

  // Connect to database
  const dbStatus = await initDb();
  console.log(` Storage Engine: ${dbStatus.engine}`);

  // 1. Check if user already exists
  let user = await findUserByWallet(normalized);

  if (!user) {
    console.log(`[*] Creating new user record for wallet ${normalized}...`);
    user = await createUser(normalized, targetRole);
    console.log(`[✓] Created user account ${user.id} with role "${targetRole}".`);
  } else {
    console.log(`[*] Found existing user record ${user.id} with current role "${user.role}".`);
    if (user.role === targetRole) {
      console.log(`[✓] Wallet is ALREADY provisioned as "${targetRole}". No change required.`);
    } else {
      user = await updateUserRole(normalized, targetRole);
      console.log(`[✓] Successfully updated user role from to "${targetRole}".`);
    }
  }

  // 2. Record administrative audit log
  await logAdminAction({
    actorWallet: 'CLI_BOOTSTRAP_PROVISIONER',
    action: 'PROVISION_ADMIN_WALLET',
    target: normalized,
    details: {
      assignedRole: targetRole,
      timestamp: new Date().toISOString(),
      engine: dbStatus.engine,
    },
  });

  console.log('='.repeat(65));
  console.log(' PROVISIONING COMPLETE');
  console.log(` Wallet: ${normalized}`);
  console.log(` Role:   ${user.role}`);
  console.log(` Status: ${user.status}`);
  console.log('\nThe administrator can now authenticate at:');
  console.log('  http://localhost:3000/admin/login');
  console.log('='.repeat(65));
  process.exit(0);
}

main().catch((err) => {
  console.error('\n [FATAL] Provisioning failed:', err);
  process.exit(1);
});
