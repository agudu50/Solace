import { Router } from 'express';
import {
  getStatsHandler,
  getUsersHandler,
  updateUserStatusHandler,
  updateUserRoleHandler,
  getAuditsHandler,
  getPurchasesHandler,
  adjustCreditsHandler,
  getLogsHandler,
  getIssuesHandler,
  updateIssueHandler,
  getPresenceHandler,
  getMetricsHandler,
} from '../controllers/adminController.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All administrative routes require valid server-side administrator authorization
router.use(requireAdmin);

// Platform Analytics & System Telemetry
router.get('/stats', getStatsHandler);

// User Management
router.get('/users', getUsersHandler);
router.post('/users/:address/status', updateUserStatusHandler);
router.post('/users/:address/role', updateUserRoleHandler);

// Platform Audits & Findings
router.get('/audits', getAuditsHandler);

// Credit Packages & Transactions
router.get('/purchases', getPurchasesHandler);
router.post('/credits/adjust', adjustCreditsHandler);

// Audit Trail Logs
router.get('/logs', getLogsHandler);

// Issues queue, live presence and request metrics
router.get('/issues', getIssuesHandler);
router.patch('/issues/:id', updateIssueHandler);
router.get('/presence', getPresenceHandler);
router.get('/metrics', getMetricsHandler);

export default router;
