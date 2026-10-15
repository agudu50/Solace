'use client';
import { useState } from 'react';
import { connectWallet } from '../utils/solaceService';
import ContractInput from '../components/audit/ContractInput';

interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

interface AuditReport {
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilities: Vulnerability[];
  postDeploymentRecommendations: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [isPostDeployment, setIsPostDeployment] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [contractHash, setContractHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [walletKey, setWalletKey] = useState<string>('');
  const [anchorResult, setAnchorResult] = useState<{
    transactionHash: string;
    contractId: string;
    explorerUrl: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [anchoring, setAnchoring] = useState<boolean>(false);

  const handleConnectWallet = async () => {
    try {
      const key = await connectWallet();
      setWalletKey(key);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  const handleAudit = async () => {
    if (!codeSnippet.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeSnippet, isPostDeployment }),
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.data || data.report);
        if (data.contractHash) {
          setContractHash(data.contractHash);
        }
      } else {
        setError(data.error || 'Failed to generate audit report.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Ensure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnchorOnChain = async () => {
    if (!report || !contractHash) {
      setError('Please run an audit first before anchoring on-chain.');
      return;
    }
    setAnchoring(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/contract/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractHash,
          riskScore: report.riskScore,
          isSecure: report.isSecure,
          auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAnchorResult({
          transactionHash: data.transactionHash,
          contractId: data.contractId,
          explorerUrl: data.explorerUrl,
        });
      } else {
        setError(data.error || 'Failed to anchor audit on Soroban ledger.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error recording audit onto the Stellar ledger.');
    } finally {
      setAnchoring(false);
    }
  };

  const handleCopyHash = () => {
    if (!contractHash) return;
    navigator.clipboard.writeText(contractHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold px-2.5 py-1 bg-accent-subtle text-accent border border-accent-subtle rounded-full tracking-wider uppercase">
            Powered by Gemini AI Engine & Soroban SDK
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-white">Solace AI</h1>
          <p className="text-slate-400 mt-1">Autonomous smart contract security auditing, bug detection, and on-chain verification.</p>
        </div>

        <div>
          {walletKey ? (
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono text-accent">
              Connected: {walletKey.slice(0, 4)}...{walletKey.slice(-4)}
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition border border-slate-700"
            >
              Connect Freighter Wallet
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ContractInput
          codeSnippet={codeSnippet}
          setCodeSnippet={setCodeSnippet}
          isPostDeployment={isPostDeployment}
          setIsPostDeployment={setIsPostDeployment}
          loading={loading}
          error={error}
          onAudit={handleAudit}
        />

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Audit Dashboard & Findings</h2>
            {report && (
              <button
                onClick={handleAnchorOnChain}
                disabled={anchoring}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded transition"
              >
                {anchoring ? 'Anchoring...' : 'Anchor on Soroban'}
              </button>
            )}
          </div>

          {!report && !loading && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-500">
              <p>No audit executed yet.</p>
              <p className="text-xs mt-1">Paste your smart contract snippet and click Run Security Audit.</p>
            </div>
          )}

          {loading && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-slate-800 rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
              <p className="text-slate-300 font-medium">Scanning for Soroban vulnerabilities...</p>
            </div>
          )}

          {report && !loading && (
            <div className="flex-grow space-y-5 overflow-y-auto max-h-[520px] pr-2">
              {/* Hash and On-Chain status */}
              {contractHash && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Audit Hash</span>
                    <span className="text-xs font-mono text-accent truncate block max-w-sm">
                      {contractHash}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyHash}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 whitespace-nowrap"
                  >
                    {copiedHash ? '✓ Copied' : 'Copy Hash'}
                  </button>
                </div>
              )}

              {/* On-Chain Anchored Confirmation */}
              {anchorResult && (
                <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      Permanently Anchored on Stellar Testnet
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    Audit findings cryptographically anchored in contract{' '}
                    <span className="font-mono text-accent">{anchorResult.contractId.slice(0, 8)}...</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a
                      href={anchorResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                    >
                      View Tx on Stellar Expert ↗
                    </a>
                    <a
                      href={`/reports?hash=${contractHash}`}
                      className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
                    >
                      Verify in Reports Page →
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Risk Score</span>
                  <p className={`text-3xl font-black mt-1 ${report.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {report.riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security Status</span>
                  <p className={`text-xl font-bold mt-2 ${report.isSecure ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {report.isSecure ? 'Secure' : 'Vulnerabilities Found'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Executive Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
              </div>

              {report.vulnerabilities && report.vulnerabilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3">
                    Detected Vulnerabilities ({report.vulnerabilities.length})
                  </h3>
                  <div className="space-y-3">
                    {report.vulnerabilities.map((vuln, idx) => (
                      <div key={idx} className="bg-red-950/20 border border-red-900/40 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200 text-sm">{vuln.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{vuln.description}</p>
                        <div className="mt-3 bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs">
                          <span className="font-semibold text-accent block mb-0.5">Recommended Fix:</span>
                          <span className="text-slate-300 font-mono">{vuln.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
