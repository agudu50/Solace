import crypto from 'node:crypto';
import { query, usePostgres, readTable, writeTable } from '../db/db.js';

/**
 * Record an administrative action into the audit trail
 */
export async function logAdminAction({ actorWallet, action, target, details = {}, ipAddress = null }) {
  const logId = `log_${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date().toISOString();

  if (usePostgres) {
    await query(
      `INSERT INTO audit_logs (id, actor_wallet, action, target, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, actorWallet, action, target, JSON.stringify(details), ipAddress, now]
    );
  } else {
    const logs = readTable('audit_logs');
    logs.push({
      id: logId,
      actor_wallet: actorWallet,
      action,
      target,
      details,
      ip_address: ipAddress,
      created_at: now,
    });
    writeTable('audit_logs', logs);
  }

  console.log(` [AUDIT LOG] ${actorWallet} -> ${action} [${target}]`);
  return { id: logId, createdAt: now };
}

/**
 * Get audit logs for the admin console
 */
export async function getAdminAuditLogs(limit = 100) {
  if (usePostgres) {
    const res = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  }

  const logs = readTable('audit_logs');
  return [...logs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}
