import { Router } from 'express';
import {
  auditContract,
  healthCheck,
  getContractMetadata,
  getOnChainAuditRecord,
  recordAuditOnChain,
} from '../controllers/auditController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/audit', auditContract);

// On-Chain Contract Routes
router.get('/contract/info', getContractMetadata);
router.get('/contract/audit/:hash', getOnChainAuditRecord);
router.post('/contract/record', recordAuditOnChain);

export default router;
