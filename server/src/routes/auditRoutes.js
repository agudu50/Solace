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
  buildFeeTxHandler,
  submitFeeTxHandler,
} from '../controllers/auditController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/audit', auditContract);

// On-Chain Contract Routes
router.get('/contract/info', getContractMetadata);
router.get('/contract/fee', getAuditFeeHandler);
router.get('/contract/fee-status/:hash', checkAuditFeeStatusHandler);
router.post('/contract/pay-fee', payAuditFeeHandler);
router.post('/contract/build-fee-tx', buildFeeTxHandler);
router.post('/contract/submit-fee-tx', submitFeeTxHandler);
router.get('/contract/audit/:hash', getOnChainAuditRecord);
router.get('/contract/telemetry/:contractId', getContractTelemetryHandler);
router.post('/contract/record', recordAuditOnChain);

export default router;

