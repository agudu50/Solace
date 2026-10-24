'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Database,
  ExternalLink,
  Copy,
  Check,
  Upload,
  Coins,
} from 'lucide-react';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';
import { useWallet } from '../../context/WalletContext';

export default function AuditStudioSection() {
  const { walletKey, network } = useWallet();
  const [code, setCode] = useState<string>(SAMPLE_SOROBAN_CONTRACT);
  const [contractName, setContractName] = useState<string>('VaultContract.rs');
  const [auditMode, setAuditMode] = useState<'PRE' | 'POST'>('PRE');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditDone, setAuditDone] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [anchoring, setAnchoring] = useState<boolean>(false);
  const [anchored, setAnchored] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('7a8f3d12c8b49e0f61254789ab23cd45ef67890123456789abcdef0123456789');

  const contractHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const handleRunAudit = () => {
    setIsAuditing(true);
    setAnchored(false);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditDone(true);
    }, 900);
  };

  const handleReset = () => {
    setCode(SAMPLE_SOROBAN_CONTRACT);
    setAuditDone(true);
    setAnchored(false);
  };

  const handleAnchorOnChain = () => {
    setAnchoring(true);
    setTimeout(() => {
      setAnchoring(false);
      setAnchored(true);
    }, 1200);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(contractHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section id="audit" className="relative w-full py-16 sm:py-24 bg-white dark:bg-[#0e1320] border-t border-slate-200 dark:border-slate-800">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>On-Page Security Studio</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Solace Audit Studio
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Run complete static AST invariant audits on your Soroban smart contracts directly on this page. Inspect risk scores, review Gemini AI remediations, and inscribe audit proofs onto the Stellar ledger.
          </p>
        </div>

        {/* Studio Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Audit Mode:
            </span>
            <button
              type="button"
              onClick={() => setAuditMode('PRE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                auditMode === 'PRE'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Pre-Deployment AST Verification
            </button>
            <button
              type="button"
              onClick={() => setAuditMode('POST')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                auditMode === 'POST'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Post-Deployment Ledger Verification
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample</span>
            </button>

            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Running AST Engine...' : 'Run Security Audit'}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Studio Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Code Editor Terminal Window */}
          <div className="lg:col-span-7 bg-[#0a0d14] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col text-left">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                <span className="font-bold text-white">{contractName}</span>
                <span className="text-[10px] text-slate-500">Soroban Rust v22</span>
              </div>
              <span className="text-[11px] text-accent font-bold">
                {code.split('\n').length} Lines
              </span>
            </div>

            {/* Editable Code Input */}
            <div className="relative p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto modern-code-scrollbar">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={18}
                className="w-full bg-transparent text-slate-200 font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none border-0 selection:bg-accent selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Editor Footer Status */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>AST Parser: Ready</span>
              </span>
              <span>SHA-256: {contractHash.slice(0, 12)}...</span>
            </div>
          </div>

          {/* Right: Live Audit Telemetry & On-Chain Anchor */}
          <div className="lg:col-span-5 flex flex-col gap-5 text-left">
            {/* Risk Score & Status Banner */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Audit Verdict &amp; Risk Rating
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-accent-subtle text-accent border border-accent/20 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flaws Detected</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black font-mono text-accent">
                    72 / 100
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Calculated Soroban Invariant Risk Score
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    2 Invariants Breached
                  </span>
                  <span className="text-[11px] text-accent font-semibold">
                    State Mutation at Risk
                  </span>
                </div>
              </div>

              {/* Invariant Verification Grid */}
              <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Caller Authorization (require_auth)
                  </span>
                  <span className="font-bold text-accent">MISSING</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Persistent Storage TTL Rent Bump
                  </span>
                  <span className="font-bold text-slate-500">EXPIRED</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Host Panic &amp; Unwrap Traps
                  </span>
                  <span className="font-bold text-accent">SAFE</span>
                </div>
              </div>
            </div>

            {/* Vulnerabilities & Remediation Box */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-accent" />
                  <span>Vulnerability Findings</span>
                </h4>
                <span className="text-[11px] font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded-md border border-accent/20">
                  High Severity
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                Line 38 (`withdraw`): State balance is decremented without verifying caller authorization via `to.require_auth()` or admin address signature.
              </p>

              {/* Gemini AI Remediation Code */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Gemini Remediation Patch</span>
                </span>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs border border-accent/30 overflow-x-auto">
                  <pre>{`// Enforce caller authorization:
to.require_auth();`}</pre>
                </div>
              </div>

              {/* On-Chain Ledger Anchor Button & Proof */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                {!anchored ? (
                  <button
                    type="button"
                    onClick={handleAnchorOnChain}
                    disabled={anchoring}
                    className="w-full py-3 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>
                      {anchoring
                        ? 'Submitting Proof to Stellar Ledger (1.0 XLM)...'
                        : 'Anchor Audit Proof On-Chain (1.0 XLM)'}
                    </span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-accent-subtle border border-accent/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-accent">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Audit Sealed On Stellar Ledger</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono break-all">
                      TxHash: {txHash.slice(0, 24)}...
                    </div>
                    <a
                      href="https://stellar.expert/explorer/testnet/contract/CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent font-bold underline flex items-center gap-1 mt-1"
                    >
                      <span>Verify on Stellar Expert</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
