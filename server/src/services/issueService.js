import crypto from 'node:crypto';
import { query, usePostgres, readTable, writeTable } from '../db/db.js';

/**
 * Issues: problems reported by users plus server errors captured automatically.
 * Repeats of the same unresolved system error are grouped by `fingerprint`
 * (occurrences++), so one failing endpoint doesn't flood the queue.
 */

export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null);

export async function createIssue({
  source,
  kind = 'bug',
  severity = 'medium',
  title,
  description = null,
  page = null,
  walletAddress = null,
  email = null,
  fingerprint = null,
}) {
  const now = new Date().toISOString();
  const sev = SEVERITIES.includes(severity) ? severity : 'medium';
  const row = {
    id: `iss_${crypto.randomBytes(10).toString('hex')}`,
    source: source === 'system' ? 'system' : 'user',
    kind: clip(kind, 48) || 'bug',
    severity: sev,
    title: clip(title, 256) || 'Untitled issue',
    description: clip(description, 5000),
    page: clip(page, 512),
    wallet_address: clip(walletAddress, 56),
    email: clip(email, 256),
    fingerprint: clip(fingerprint, 256),
  };

  if (usePostgres) {
    if (row.fingerprint) {
      const existing = await query(
        `UPDATE issues SET occurrences = occurrences + 1, last_seen_at = $2, updated_at = $2
         WHERE fingerprint = $1 AND status <> 'resolved' RETURNING *`,
        [row.fingerprint, now],
      );
      if (existing.rows[0]) return existing.rows[0];
    }
    const res = await query(
      `INSERT INTO issues (id, source, kind, severity, title, description, page, wallet_address, email, fingerprint,
                           occurrences, status, created_at, updated_at, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,'open',$11,$11,$11) RETURNING *`,
      [row.id, row.source, row.kind, row.severity, row.title, row.description, row.page, row.wallet_address, row.email, row.fingerprint, now],
    );
    return res.rows[0];
  }

  const issues = readTable('issues');
  if (row.fingerprint) {
    const dup = issues.find((i) => i.fingerprint === row.fingerprint && i.status !== 'resolved');
    if (dup) {
      dup.occurrences = (dup.occurrences || 1) + 1;
      dup.last_seen_at = now;
      dup.updated_at = now;
      writeTable('issues', issues);
      return dup;
    }
  }
  const full = { ...row, occurrences: 1, status: 'open', resolution_note: null, resolved_by: null, created_at: now, updated_at: now, last_seen_at: now };
  issues.push(full);
  writeTable('issues', issues);
  return full;
}

export async function listIssues({ status = null, limit = 200 } = {}) {
  if (usePostgres) {
    const res = status
      ? await query('SELECT * FROM issues WHERE status = $1 ORDER BY last_seen_at DESC LIMIT $2', [status, limit])
      : await query('SELECT * FROM issues ORDER BY last_seen_at DESC LIMIT $1', [limit]);
    return res.rows;
  }
  return readTable('issues')
    .filter((i) => !status || i.status === status)
    .sort((a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at))
    .slice(0, limit);
}

export async function countOpenIssues() {
  if (usePostgres) {
    const res = await query(`SELECT status, count(*) FROM issues WHERE status <> 'resolved' GROUP BY status`);
    return res.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count, 10) }), { open: 0, in_progress: 0 });
  }
  const issues = readTable('issues');
  return {
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
  };
}

export async function updateIssue(id, { status, note, actor }) {
  if (!ISSUE_STATUSES.includes(status)) throw new Error(`Status must be one of: ${ISSUE_STATUSES.join(', ')}`);
  const now = new Date().toISOString();
  const resolvedBy = status === 'resolved' ? clip(actor, 256) : null;
  const resolution = clip(note, 2000);

  if (usePostgres) {
    const res = await query(
      `UPDATE issues SET status = $2, resolution_note = COALESCE($3, resolution_note), resolved_by = $4, updated_at = $5
       WHERE id = $1 RETURNING *`,
      [id, status, resolution, resolvedBy, now],
    );
    return res.rows[0] || null;
  }
  const issues = readTable('issues');
  const issue = issues.find((i) => i.id === id);
  if (!issue) return null;
  issue.status = status;
  if (resolution) issue.resolution_note = resolution;
  issue.resolved_by = resolvedBy;
  issue.updated_at = now;
  writeTable('issues', issues);
  return issue;
}
