import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { analyzeContractWithAI } from '../services/aiAuditor.js';

dotenv.config();

async function run() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Solace AI Audit Runner
Usage:
  npm run audit [-- [path/to/contract.rs] [--post-deployment]]

Examples:
  npm run audit                                     # Audits default contracts/src/lib.rs (pre-deployment)
  npm run audit -- --post-deployment               # Audits default contract in post-deployment mode
  npm run audit -- ../contracts/src/lib.rs          # Audits a custom contract file
`);
    process.exit(0);
  }

  const isPostDeployment = args.includes('--post-deployment');
  const targetFileArg = args.find((arg) => !arg.startsWith('--'));
  // Default to contracts/src/lib.rs either relative to cwd or server directory
  let targetFilePath = targetFileArg;
  if (!targetFilePath) {
    const candidates = [
      path.join(process.cwd(), '..', 'contracts', 'src', 'lib.rs'),
      path.join(process.cwd(), 'contracts', 'src', 'lib.rs'),
      path.resolve(import.meta.dirname, '../../../contracts/src/lib.rs'),
    ];
    targetFilePath = candidates.find((p) => fs.existsSync(p)) || path.join('contracts', 'src', 'lib.rs');
  }

  console.log('='.repeat(70));
  console.log('  SOLACE AI - Smart Contract Security Auditor for Stellar Soroban');
  console.log('='.repeat(70));
  console.log(`[+] Target Contract: ${targetFilePath}`);
  console.log(`[+] Audit Mode:      ${isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT'}`);

  if (!fs.existsSync(targetFilePath)) {
    console.error(`[-] Error: File not found: ${targetFilePath}`);
    process.exit(1);
  }

  const contractCode = fs.readFileSync(targetFilePath, 'utf-8');
  const contractHash = crypto.createHash('sha256').update(contractCode).digest('hex');

  console.log(`[+] SHA-256 Hash:    ${contractHash}`);
  console.log('[*] Invoking Gemini 3.8 Flash security engine...\n');

  try {
    const report = await analyzeContractWithAI(contractCode, isPostDeployment);

    console.log('--- AUDIT REPORT SUMMARY ---');
    console.log(`Risk Score:  ${report.riskScore}/100`);
    console.log(`Security:    ${report.isSecure ? 'VERIFIED SECURE' : 'ACTION REQUIRED / VULNERABLE'}`);
    console.log(`Summary:     ${report.summary}\n`);

    if (report.vulnerabilities && report.vulnerabilities.length > 0) {
      console.log(`--- IDENTIFIED VULNERABILITIES (${report.vulnerabilities.length}) ---`);
      for (const [idx, vuln] of report.vulnerabilities.entries()) {
        console.log(`\n[${idx + 1}] [${vuln.severity}] ${vuln.title}`);
        console.log(`    Risk:           ${vuln.description}`);
        console.log(`    Recommendation: ${vuln.recommendation}`);
      }
      console.log();
    } else {
      console.log('[+] No critical or high-risk vulnerabilities detected.\n');
    }

    if (report.postDeploymentRecommendations && report.postDeploymentRecommendations.length > 0) {
      console.log('--- POST-DEPLOYMENT RECOMMENDATIONS ---');
      for (const rec of report.postDeploymentRecommendations) {
        console.log(` • ${rec}`);
      }
      console.log();
    }

    // Soroban on-chain sync payload
    const auditType = isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT';
    console.log('='.repeat(70));
    console.log('  SOROBAN ON-CHAIN RECORDING PAYLOAD');
    console.log('='.repeat(70));
    console.log('To record this audit on the Stellar ledger via SolaceContract, invoke:');
    console.log(`
stellar contract invoke \\
  --id ${process.env.SOLACE_CONTRACT_ID || '<SOLACE_CONTRACT_ID>'} \\
  --source ${process.env.AUDITOR_ADDRESS || '<AUDITOR_IDENTITY_OR_KEY>'} \\
  --network testnet \\
  -- \\
  record_audit \\
  --auditor ${process.env.AUDITOR_ADDRESS || '<AUDITOR_ADDRESS>'} \\
  --contract_hash "${contractHash}" \\
  --risk_score ${report.riskScore} \\
  --is_secure ${report.isSecure} \\
  --audit_type "${auditType}"
`);

    console.log('Audit payload prepared successfully.');
  } catch (err) {
    console.error('[-] Audit process failed:', err.message);
    if (!process.env.GEMINI_API_KEY) {
      console.warn('\n[!] Note: GEMINI_API_KEY is not set. Please create a .env file with your GEMINI_API_KEY.');
    }
    process.exit(1);
  }
}

run();
