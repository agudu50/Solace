import { Router } from 'express';
import { auditContract, healthCheck } from '../controllers/auditController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/audit', auditContract);

export default router;
