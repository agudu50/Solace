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
  getPackagesHandler,
  getUserCreditsHandler,
  getUserCreditHistoryHandler,
  buildPackagePurchaseTxHandler,
  submitPackagePurchaseTxHandler,
  consumeCreditHandler,
} from '../controllers/auditController.js';

const router = Router();

// Health & Core Audit
router.get('/health', healthCheck);
router.post('/audit', auditContract);

// Prepaid Credit-Based Subscription Packages (30, 60, 90 XLM)
router.get('/credits/packages', getPackagesHandler);
router.get('/credits/balance/:address', getUserCreditsHandler);
router.get('/credits/history/:address', getUserCreditHistoryHandler);
router.post('/credits/build-purchase-tx', buildPackagePurchaseTxHandler);
router.post('/credits/submit-purchase-tx', submitPackagePurchaseTxHandler);
router.post('/credits/consume', consumeCreditHandler);

// On-Chain Contract & Backward-Compatible Routes
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
