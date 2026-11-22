import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createIssue } from '../services/issueService.js';
import { recordHeartbeat } from '../services/telemetryService.js';

const router = Router();

// Optional auth (attaches req.user when a session exists, never blocks) is applied
// per route: this router is mounted at /api, so router.use() would run it for
// every API request that passes through.

/**
 * Presence heartbeat from an open tab.
 * POST /api/presence  { visitorId, path }
 */
router.post('/presence', authenticate, (req, res) => {
  const { visitorId, path } = req.body || {};
  recordHeartbeat(visitorId, { path, user: req.user });
  res.status(204).end();
});

// Tiny in-memory limiter for public reports: 5 per IP per 10 minutes.
const reportHits = new Map();
function allowReport(ip) {
  const now = Date.now();
  const hits = (reportHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (hits.length >= 5) return false;
  hits.push(now);
  reportHits.set(ip, hits);
  return true;
}

/**
 * User-reported problem.
 * POST /api/issues  { title, description, page, kind, context }
 */
router.post('/issues', authenticate, async (req, res) => {
  try {
    if (!allowReport(req.ip)) {
      return res.status(429).json({ success: false, error: 'Too many reports. Please try again in a few minutes.' });
    }
    const { title, description, page, kind, context } = req.body || {};
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Please give the problem a short title.' });
    }
    const details = [description, context ? `\n---\nContext: ${String(context).slice(0, 1500)}` : '']
      .filter(Boolean)
      .join('');
    const issue = await createIssue({
      source: 'user',
      kind: ['bug', 'payment', 'account', 'audit', 'other'].includes(kind) ? kind : 'bug',
      severity: kind === 'payment' ? 'high' : 'medium',
      title: title.trim(),
      description: details || null,
      page,
      walletAddress: req.user?.address || null,
      email: req.user?.email || null,
    });
    res.status(201).json({ success: true, id: issue.id });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not file the report right now.' });
  }
});

export default router;
