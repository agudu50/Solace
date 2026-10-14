import crypto from 'node:crypto';
import { analyzeContractWithAI } from '../services/aiAuditor.js';

export async function auditContract(req, res, next) {
  try {
    const code = req.body.codeSnippet || req.body.code;
    const isPostDeployment = req.body.isPostDeployment || false;
    const clientHash = req.body.contractHash;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contract code snippet is required as a non-empty string in "codeSnippet" or "code".',
      });
    }

    const calculatedHash = crypto.createHash('sha256').update(code).digest('hex');
    const contractHash = clientHash || calculatedHash;

    const report = await analyzeContractWithAI(code, Boolean(isPostDeployment));

    const auditType = isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT';

    // Soroban invocation payload for record_audit
    const onChainPayload = {
      functionName: 'record_audit',
      contractId: process.env.SOLACE_CONTRACT_ID || null,
      parameters: {
        auditor: process.env.AUDITOR_ADDRESS || null,
        contract_hash: contractHash,
        risk_score: report.riskScore,
        is_secure: report.isSecure,
        audit_type: auditType,
      },
      cliCommand: `stellar contract invoke --id ${process.env.SOLACE_CONTRACT_ID || '<SOLACE_CONTRACT_ID>'} --source ${process.env.AUDITOR_ADDRESS || '<AUDITOR_IDENTITY>'} --network testnet -- record_audit --auditor ${process.env.AUDITOR_ADDRESS || '<AUDITOR_ADDRESS>'} --contract_hash "${contractHash}" --risk_score ${report.riskScore} --is_secure ${report.isSecure} --audit_type "${auditType}"`,
    };

    return res.status(200).json({
      success: true,
      data: report,
      contractHash,
      auditType,
      report,
      onChainPayload,
    });
  } catch (error) {
    next(error);
  }
}

export function healthCheck(req, res) {
  res.status(200).json({
    success: true,
    service: 'Solace AI Security Audit Server',
    status: 'healthy',
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
}
