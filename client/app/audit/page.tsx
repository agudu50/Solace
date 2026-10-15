'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Shield,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowLeft,
  Copy,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';

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
  postDeploymentRecommendations?: string[];
  modelUsed?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const LIVE_CONTRACT_ID = 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

export default function AuditStudioPage() {
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'INVARIANTS'>('STUDIO');
  const [codeSnippet, setCodeSnippet] = useState<string>(SAMPLE_SOROBAN_CONTRACT);
  const [isPostDeployment, setIsPostDeployment] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [contractHash, setContractHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [anchoring, setAnchoring] = useState<boolean>(false);
  const [anchorResult, setAnchorResult] = useState<{
    transactionHash: string;
    contractId: string;
    explorerUrl: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadVault = () => {
    setCodeSnippet(SAMPLE_SOROBAN_CONTRACT);
    setReport(null);
    setAnchorResult(null);
  };

  const handleLoadSolaceCore = () => {
    setCodeSnippet(`// Solace Core Contract (contract/src/lib.rs)
// Implements immutable audit inscription and retrieval on Stellar Soroban
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuditRecord {
    pub auditor: Address,
    pub contract_hash: BytesN<32>,
    pub risk_score: u32,
    pub is_secure: bool,
    pub audit_type: Symbol,
    pub timestamp: u64,
}

#[contract]
pub struct SolaceContract;

#[contractimpl]
impl SolaceContract {
    pub fn record_audit(
        env: Env,
        auditor: Address,
        contract_hash: BytesN<32>,
        risk_score: u32,
        is_secure: bool,
        audit_type: Symbol,
    ) {
        auditor.require_auth();
        let record = AuditRecord {
            auditor,
            contract_hash: contract_hash.clone(),
            risk_score,
            is_secure,
            audit_type,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&contract_hash, &record);
    }
}
`);
    setReport(null);
    setAnchorResult(null);
  };

  const handleClear = () => {
    setCodeSnippet('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCodeSnippet(text);
      }
    };
    reader.readAsText(file);
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
      setError('Could not connect to the backend server. Verify the API is running on port 5000.');
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

  const lineCount = codeSnippet ? codeSnippet.split('\n').length : 0;

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-8">
      {/* Main Studio Canvas */}
      <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Live Security Engine</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Stellar Soroban v22
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Interactive Code Audit Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Autonomous Gemini AI AST inspection & verification on Stellar Soroban
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap">
            {/* View Tabs */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-1 rounded-full shadow-sm flex text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('STUDIO')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold transition ${
                  activeTab === 'STUDIO'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('INVARIANTS')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold transition ${
                  activeTab === 'INVARIANTS'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Audit Pass Rate</span>
              </button>
            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Tab 1: Studio */}
        {activeTab === 'STUDIO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Code Editor & Audit Action */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
                <div>
                  {/* Top Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {/* Load Presets */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Load:</span>
                      <button
                        type="button"
                        onClick={handleLoadVault}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-full transition"
                      >
                        Vault Protocol
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSolaceCore}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-full transition"
                      >
                        Solace Core
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-full transition flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".rs,.wasm,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      {codeSnippet && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Pre / Post Deploy Toggle (Brand accent, no black) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 p-1 rounded-full text-xs">
                      <button
                        type="button"
                        onClick={() => setIsPostDeployment(false)}
                        className={`px-3 py-1 rounded-full font-semibold transition ${
                          !isPostDeployment
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Pre-Deploy
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setIsPostDeployment(true)}
                        className={`px-3 py-1 rounded-full font-semibold transition ${
                          isPostDeployment
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Post-Deploy
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Box */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 shadow-inner">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800/80 font-mono">
                      <span className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-accent" />
                        <span>soroban_contract.rs</span>
                      </span>
                      <span>{lineCount} lines</span>
                    </div>
                    <textarea
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      placeholder="// Paste Soroban Rust smart contract (lib.rs) or click 'Vault Protocol' above..."
                      rows={18}
                      className="w-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed placeholder:text-slate-600"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isPostDeployment
                      ? 'Validates live persistent storage rent TTL and archival eviction risks.'
                      : 'Analyzes AST authorization rules & panic vulnerabilities.'}
                  </span>

                  <button
                    type="button"
                    onClick={handleAudit}
                    disabled={loading || !codeSnippet.trim()}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold transition shadow-md shadow-accent/25 whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Gemini AI Analyzing Code...' : 'Audit Smart Contract'}</span>
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Findings & On-Chain Verification */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col h-full min-h-[500px] transition-colors">
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Findings & Ledger Receipt
                  </h2>
                  {report && (
                    <button
                      type="button"
                      onClick={handleAnchorOnChain}
                      disabled={anchoring}
                      className="px-3.5 py-1 rounded-full bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold transition shadow-md shadow-accent/20 flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{anchoring ? 'Anchoring...' : 'Anchor on Soroban'}</span>
                    </button>
                  )}
                </div>

                {!report && !loading && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Ready for Code Inspection</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Load a sample Soroban contract or paste Rust code and click Audit Smart Contract to initiate automated vulnerability detection.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-3" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Gemini AI Analyzing AST Invariants...
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Evaluating require_auth(), persistent storage bounds, and arithmetic safety.
                    </p>
                  </div>
                )}

                {report && !loading && (
                  <div className="space-y-4 overflow-y-auto max-h-[620px] pr-1">
                    {/* Scores & Status Pill */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          Security Score
                        </span>
                        <div className={`text-2xl font-black mt-0.5 ${report.riskScore > 50 ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
                          {report.riskScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          Audit Verdict
                        </span>
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                          report.isSecure
                            ? 'bg-accent-subtle text-accent border border-accent/20'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                        }`}>
                          {report.isSecure ? '• Verified Secure' : '• Action Required'}
                        </span>
                      </div>
                    </div>

                    {/* Hash Pill */}
                    {contractHash && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate mr-2">
                          Hash: {contractHash.slice(0, 16)}...
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyHash}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {/* On-Chain Anchored Confirmation */}
                    {anchorResult && (
                      <div className="p-3 rounded-2xl bg-accent-subtle border border-accent/20 text-xs">
                        <span className="font-bold text-accent block">Permanently Anchored on Stellar Testnet</span>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                          Audit findings cryptographically anchored in contract{' '}
                          <span className="font-mono text-accent">{LIVE_CONTRACT_ID.slice(0, 10)}...</span>
                        </p>
                        <a
                          href={anchorResult.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-accent underline mt-1.5 inline-flex items-center gap-1 hover:text-accent-hover"
                        >
                          <span>View Transaction on Stellar Expert</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Executive Summary */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Executive Summary</span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{report.summary}</p>
                    </div>

                    {/* Detected Issues */}
                    {report.vulnerabilities && report.vulnerabilities.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Detected Issues ({report.vulnerabilities.length})
                        </span>
                        {report.vulnerabilities.map((vuln, i) => (
                          <div key={i} className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-red-950 dark:text-red-200">{vuln.title}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                                {vuln.severity}
                              </span>
                            </div>
                            <p className="text-red-900/80 dark:text-red-300/80 text-[11px] leading-relaxed mb-2">
                              {vuln.description}
                            </p>
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-red-200/50 dark:border-red-900/50 text-[11px]">
                              <span className="font-bold text-accent block mb-0.5">Recommended Fix:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">{vuln.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invariants */}
        {activeTab === 'INVARIANTS' && (
          <div className="bg-white dark:bg-[#111726] rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Audit Pass Rate</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Automated Soroban AST invariant analysis across categories</p>
              </div>

              <div className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                +98.2% Pass Rate
              </div>
            </div>

            {/* Bar Chart Visualization with Updated Invariant Categories */}
            <div className="flex items-end justify-between h-72 px-4 sm:px-12 pt-6 border-b border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex flex-col justify-between h-full text-xs text-slate-400 dark:text-slate-500 py-1 pr-4">
                <span>5k</span>
                <span>4k</span>
                <span>3k</span>
                <span>2k</span>
                <span>1k</span>
                <span>0</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-44 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Auth Guards</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-52 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">State Rent</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-48 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Panic Safety</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-64 rounded-2xl bg-accent shadow-md relative overflow-hidden">
                  <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Access Control</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-46 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Safe Math</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-50 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Bytecode</span>
              </div>
            </div>

            <div className="pt-4 mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                <span>Enforced Authorization Protocols</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('STUDIO')}
                className="font-semibold text-slate-900 dark:text-white hover:text-accent underline underline-offset-2 flex items-center gap-1"
              >
                <span>Test Contract Code</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
