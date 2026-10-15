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
      `[✓] [Audit] Analysis completed via ${report.modelUsed || 'Gemini'} | Risk: ${report.riskScore}/100 | Vulnerabilities: ${report.vulnerabilities?.length || 0}`
    );

    const contractInfo = sorobanService.getContractInfo();

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
    engine: 'Gemini AI Adaptive Multi-Model Engine',
    candidateModels: CANDIDATE_MODELS,
    contract: sorobanService.getContractInfo(),
    timestamp: new Date().toISOString(),
  });
}

export function getContractMetadata(req, res) {
  try {
    const info = sorobanService.getContractInfo();
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
