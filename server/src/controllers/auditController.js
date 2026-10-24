import crypto from 'node:crypto';
import { analyzeContractWithAI, CANDIDATE_MODELS } from '../services/aiAuditor.js';
import sorobanService from '../services/sorobanService.js';
import creditStore, {
  getPackages,
  getUserBalance,
  getUserHistory,
  consumeCreditForContract,
} from '../services/creditStore.js';

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

    const userWallet = req.body.userWallet || req.body.auditor || req.body.walletAddress;
    const clientFeeReceipt = req.body.feeReceipt;

    // Credit-based verification: require user to have >= 1 credit (or verified receipt)
    let creditReceipt = null;
    if (userWallet) {
      try {
        creditReceipt = consumeCreditForContract({
          userAddress: userWallet,
          contractHash,
        });
      } catch (cErr) {
        if (!clientFeeReceipt) {
          return res.status(402).json({
            success: false,
            needsCredits: true,
            error:
              cErr.message ||
              'Insufficient audit credits. Please purchase a prepaid credit bundle (Starter: 30 XLM for 3 audits, Growth: 60 XLM for 6 audits, or Professional: 90 XLM for 9 audits).',
            packages: getPackages(),
          });
        }
      }
    }

    console.log(`[*] [Audit] Incoming ${auditType} audit request (Hash: ${contractHash.slice(0, 12)}...)`);

    const report = await analyzeContractWithAI(code, Boolean(isPostDeployment));

    console.log(
      `[✓] [Audit] Analysis completed via ${report.modelUsed || 'Solace AI Engine'} | Risk: ${report.riskScore}/100 | Vulnerabilities: ${report.vulnerabilities?.length || 0}`
    );

    const contractInfo = sorobanService.getContractInfo();

    let feeReceipt = clientFeeReceipt || null;
    if (!feeReceipt && creditReceipt) {
      feeReceipt = {
        success: true,
        status: 'CREDIT_DEDUCTED',
        currency: 'XLM',
        payer: userWallet,
        contractHash,
        contractId: contractInfo.contractId,
        remainingCredits: creditReceipt.remainingCredits,
        creditConsumed: creditReceipt.deducted,
        timestamp: new Date().toISOString(),
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

export async function buildFeeTxHandler(req, res) {
  try {
    const { userAddress, contractHash, network } = req.body;
    if (!userAddress) {
      return res.status(400).json({ success: false, error: 'userAddress is required.' });
    }
    const txData = await sorobanService.buildAuditFeeTransaction({
      userAddress,
      contractHash: contractHash || '00000000000000000000000000000000',
      network: network || 'testnet',
    });
    res.status(200).json(txData);
  } catch (err) {
    console.error(`[-] [AuditController] Failed to build fee tx: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitFeeTxHandler(req, res) {
  try {
    const { signedXdr, userAddress, contractHash, network } = req.body;
    if (!signedXdr) {
      return res.status(400).json({ success: false, error: 'signedXdr is required.' });
    }
    const receipt = await sorobanService.submitSignedAuditFeeTransaction({
      signedXdr,
      userAddress,
      contractHash,
      network: network || 'testnet',
    });
    res.status(200).json(receipt);
  } catch (err) {
    console.error(`[-] [AuditController] Failed to submit fee tx: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// Credit-Based Subscription Handlers (30, 60, 90 XLM)
// ============================================================================

export function getPackagesHandler(req, res) {
  try {
    const packages = getPackages();
    res.status(200).json({
      success: true,
      packages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function getUserCreditsHandler(req, res) {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ success: false, error: 'User wallet address is required in URL.' });
    }
    const balance = getUserBalance(address);
    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function getUserCreditHistoryHandler(req, res) {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ success: false, error: 'User wallet address is required in URL.' });
    }
    const history = getUserHistory(address);
    const balance = getUserBalance(address);
    res.status(200).json({
      success: true,
      balance,
      purchases: history.purchases,
      consumptions: history.consumptions,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function buildPackagePurchaseTxHandler(req, res) {
  try {
    const { userAddress, packageId, network } = req.body;
    if (!userAddress || !packageId) {
      return res.status(400).json({
        success: false,
        error: 'userAddress and packageId (1, 2, or 3) are required to build purchase transaction.',
      });
    }

    const txData = await sorobanService.buildPackagePurchaseTransaction({
      userAddress,
      packageId: Number(packageId),
      network: network || 'testnet',
    });
    res.status(200).json(txData);
  } catch (err) {
    console.error(`[-] [AuditController] Failed to build package purchase tx: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitPackagePurchaseTxHandler(req, res) {
  try {
    const { signedXdr, userAddress, packageId, network } = req.body;
    if (!signedXdr || !userAddress || !packageId) {
      return res.status(400).json({
        success: false,
        error: 'signedXdr, userAddress, and packageId are required.',
      });
    }

    const receipt = await sorobanService.submitSignedPackagePurchaseTransaction({
      signedXdr,
      userAddress,
      packageId: Number(packageId),
      network: network || 'testnet',
    });
    res.status(200).json(receipt);
  } catch (err) {
    console.error(`[-] [AuditController] Failed to submit package purchase tx: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

export function consumeCreditHandler(req, res) {
  try {
    const { userAddress, contractHash } = req.body;
    if (!userAddress || !contractHash) {
      return res.status(400).json({
        success: false,
        error: 'userAddress and contractHash are required to consume credit.',
      });
    }

    const result = consumeCreditForContract({
      userAddress,
      contractHash,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}



