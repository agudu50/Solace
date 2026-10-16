import { Router } from 'express';
import {
  auditContract,
  healthCheck,
  getContractMetadata,
  getOnChainAuditRecord,
  recordAuditOnChain,
  getContractTelemetryHandler,
  getAuditFeeHandler,
  payAuditFeeHandler,
  checkAuditFeeStatusHandler,
} from '../controllers/auditController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/audit', auditContract);

// On-Chain Contract Routes
router.get('/contract/info', getContractMetadata);
router.get('/contract/fee', getAuditFeeHandler);
router.get('/contract/fee-status/:hash', checkAuditFeeStatusHandler);
router.post('/contract/pay-fee', payAuditFeeHandler);
router.get('/contract/audit/:hash', getOnChainAuditRecord);
router.get('/contract/telemetry/:contractId', getContractTelemetryHandler);
router.post('/contract/record', recordAuditOnChain);

export default router;

