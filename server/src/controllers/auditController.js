import crypto from 'node:crypto';
import { analyzeContractWithAI, CANDIDATE_MODELS } from '../services/aiAuditor.js';
import sorobanService from '../services/sorobanService.js';

export async function auditContract(req, res, next) {
  try {
    const code = req.body.codeSnippet || req.body.code || req.body.contractCode;
    const isPostDeployment = req.body.isPostDeployment || false;
    const clientHash = req.body.contractHash;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contract code snippet is required as a non-empty string in "codeSnippet", "contractCode", or "code".',
      });
    }

    const calculatedHash = crypto.createHash('sha256').update(code).digest('hex');
    const contractHash = clientHash || calculatedHash;
    const auditType = isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT';

    console.log(`[*] [Audit] Incoming ${auditType} audit request (Hash: ${contractHash.slice(0, 12)}...)`);

    const report = await analyzeContractWithAI(code, Boolean(isPostDeployment));

    console.log(
      `[✓] [Audit] Analysis completed via ${report.modelUsed || 'Solace AI Engine'} | Risk: ${report.riskScore}/100 | Vulnerabilities: ${report.vulnerabilities?.length || 0}`
    );

    const contractInfo = sorobanService.getContractInfo();

    // Process audit fee deduction from the caller's wallet
    const userWallet = req.body.userWallet || req.body.auditor || req.body.walletAddress;
    let feeReceipt = null;
    if (userWallet) {
      try {
        feeReceipt = await sorobanService.processAuditFeePayment({
          userAddress: userWallet,
          contractHash,
        });
      } catch (fErr) {
        console.warn(`[!] [Audit] Fee charging warning: ${fErr.message}`);
      }
    } else {
      // Default standard fee info
      const feeInfo = await sorobanService.getAuditFeeInfo();
      feeReceipt = {
        success: true,
        status: 'PENDING_CONFIRMATION',
        feeXLM: feeInfo.feeXLM,
        feeStroops: feeInfo.auditFeeStroops,
        currency: 'XLM',
        payer: 'Awaiting User Wallet Connection',
        contractHash,
        contractId: contractInfo.contractId,
      };
    }

    // Soroban invocation payload for record_audit
    const onChainPayload = {
      functionName: 'record_audit',
      contractId: contractInfo.contractId,
      parameters: {
        auditor: contractInfo.auditorAddress,
        contract_hash: contractHash,
        risk_score: report.riskScore,
        is_secure: report.isSecure,
        audit_type: auditType,
      },
      cliCommand: `stellar contract invoke --id ${contractInfo.contractId} --source ${contractInfo.auditorAddress || '<AUDITOR_IDENTITY>'} --network testnet -- record_audit --auditor ${contractInfo.auditorAddress || '<AUDITOR_ADDRESS>'} --contract_hash "${contractHash}" --risk_score ${report.riskScore} --is_secure ${report.isSecure} --audit_type "${auditType}"`,
    };

    return res.status(200).json({
      success: true,
      data: report,
      contractHash,
      auditType,
      report,
      contractInfo,
      onChainPayload,
      feeReceipt,
    });
  } catch (error) {
    console.error(`[!] [Audit] Request failed: ${error.message}`);
    next(error);
  }
}

export function healthCheck(req, res) {
  res.status(200).json({
    success: true,
    service: 'Solace AI Security Audit Server',
    status: 'healthy',
    engine: 'Solace Dual Flash AST Multi-Model Engine',
    candidateModels: CANDIDATE_MODELS,
    contract: sorobanService.getContractInfo(),
    timestamp: new Date().toISOString(),
  });
}

export function getContractMetadata(req, res) {
  try {
    const network = req.query.network || 'testnet';
    const info = sorobanService.getContractInfo(network);
    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getOnChainAuditRecord(req, res) {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({ success: false, error: 'Contract hash is required in URL path.' });
    }
    const result = await sorobanService.getOnChainAudit(hash);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordAuditOnChain(req, res) {
  try {
    const { contractHash, riskScore, isSecure, auditType } = req.body;
    if (!contractHash || riskScore === undefined || isSecure === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: contractHash, riskScore, and isSecure are required.',
      });
    }

    const result = await sorobanService.recordOnChainAudit({
      contractHash,
      riskScore,
      isSecure,
      auditType: auditType || 'PRE_DEPLOYMENT',
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getContractTelemetryHandler(req, res) {
  try {
    const { contractId } = req.params;
    const network = req.query.network || 'testnet';
    if (!contractId) {
      return res.status(400).json({ success: false, error: 'Contract ID is required in URL.' });
    }

    const telemetry = await sorobanService.getContractTelemetry(contractId.trim(), network);
    res.status(200).json(telemetry);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAuditFeeHandler(req, res) {
  try {
    const network = req.query.network || 'testnet';
    const feeInfo = await sorobanService.getAuditFeeInfo(network);
    res.status(200).json(feeInfo);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function payAuditFeeHandler(req, res) {
  try {
    const { userAddress, contractHash } = req.body;
    if (!userAddress || !contractHash) {
      return res.status(400).json({
        success: false,
        error: 'userAddress and contractHash are required to charge the audit fee.',
      });
    }

    const receipt = await sorobanService.processAuditFeePayment({
      userAddress,
      contractHash,
    });
    res.status(200).json(receipt);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function checkAuditFeeStatusHandler(req, res) {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({ success: false, error: 'Contract hash is required in URL.' });
    }

    const status = await sorobanService.isAuditFeePaid(hash);
    res.status(200).json(status);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

