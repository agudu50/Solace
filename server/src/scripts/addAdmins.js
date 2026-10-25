import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { initDb } from '../db/db.js';
import { findUserByWallet, createUser, updateUserRole, isValidStellarAddress, normalizeWallet } from '../services/userService.js';
import { logAdminAction } from '../services/auditLogService.js';

const ADMIN_WALLETS = [
  'GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX',
  'GD5NJEVHQMLEDB25UP4C5JSOXCQWHILTE3XQY2EMM657Y3GDDKLHYH7X'
];

async function run() {
  await initDb();
  console.log('--- Provisioning Requested Administrator Wallets ---');

  for (const rawWallet of ADMIN_WALLETS) {
    const wallet = normalizeWallet(rawWallet);
    if (!isValidStellarAddress(wallet)) {
      console.error(`Invalid Stellar address: ${wallet}`);
      continue;
    }

    let user = await findUserByWallet(wallet);
    if (!user) {
      user = await createUser(wallet, 'admin');
      console.log(`[CREATED] Provisioned new administrator account: ${wallet}`);
    } else {
      user = await updateUserRole(wallet, 'admin');
      console.log(`[UPDATED] Updated existing account to administrator: ${wallet}`);
    }

    await logAdminAction({
      actorWallet: 'OPERATOR_PROVISIONER',
      action: 'ADMIN_PROVISIONED',
      target: wallet,
      details: {
        role: 'admin',
        provisionedVia: 'operator_request',
        timestamp: new Date().toISOString()
      }
    });
  }

  console.log('--- Provisioning Complete ---');
}

run().catch((err) => {
  console.error('Error provisioning admins:', err);
  process.exit(1);
});
