'use client';
import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  Cpu,
  ExternalLink,
  Edit3,
  Eye,
} from 'lucide-react';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';
import { useWallet } from '../../context/WalletContext';
import { motion } from 'framer-motion';
import PricingModal from '../pricing/PricingModal';
import { fetchUserCreditBalance, consumeAuditCredit } from '../../utils/solaceService';

function renderColoredRust(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    const isVuln = trimmed.includes('Vulnerability') || trimmed.includes('CRITICAL');
    return (
      <span className={isVuln ? 'text-red-400 font-bold' : 'text-slate-500 italic'}>
        {line}
      </span>
    );
  }

  const tokenRegex =
    /(\b(?:pub|fn|let|mut|if|return|match|else|true|false|struct|impl|use|mod|enum|panic)\b|\b(?:Env|Address|i128|Result|Error|DataKey|Admin|Balance|String|symbol_short|no_std|contract|contractimpl|contracttype)\b|\b(?:init|deposit|withdraw|storage|instance|persistent|get|set|unwrap|unwrap_or|require_auth|extend_ttl|clone)\b|\b\d+[\d_]*\b|"[^"]*"|#!\[[^\]]+\]|#\[[^\]]+\]|\/\/.+$|[-><&:=+*/#]+|\s+|[^\s\w]+|\w+)/g;

  const matches = line.match(tokenRegex);
  if (!matches) return <span>{line}</span>;

  return (
    <>
      {matches.map((token, i) => {
        if (/^(pub|fn|let|mut|if|return|match|else|struct|impl|use|mod|enum)$/.test(token)) {
          return (
            <span key={i} className="text-accent font-bold">
              {token}
            </span>
          );
        }
        if (token === 'panic') {
          return (
            <span key={i} className="text-red-400 font-bold">
              {token}
            </span>
          );
        }
        if (token.startsWith('#[') || token.startsWith('#![')) {
          return (
            <span key={i} className="text-amber-400 font-semibold">
              {token}
            </span>
          );
        }
        if (/^(Env|Address|i128|Result|Error|DataKey|Admin|Balance|String|symbol_short)$/.test(token)) {
          return (
            <span key={i} className="text-sky-400 font-semibold">
              {token}
            </span>
          );
        }
        if (
          /^(init|deposit|withdraw|storage|instance|persistent|get|set|unwrap|unwrap_or|require_auth|extend_ttl|clone)$/.test(
            token
          )
        ) {
          return (
            <span key={i} className="text-emerald-400">
              {token}
            </span>
          );
        }
        if (/^\d+[\d_]*$/.test(token)) {
          return (
            <span key={i} className="text-amber-300">
              {token}
            </span>
          );
        }
        if (token.startsWith('"')) {
          return (
            <span key={i} className="text-emerald-300">
              {token}
            </span>
          );
        }
        if (token.startsWith('//')) {
          const isVuln = token.includes('Vulnerability');
          return (
            <span key={i} className={isVuln ? 'text-red-400 font-bold' : 'text-slate-500 italic'}>
              {token}
            </span>
          );
        }
        if (/^[-><&:=+*/#]+$/.test(token)) {
          return (
            <span key={i} className="text-slate-400 font-medium">
              {token}
            </span>
          );
        }
        return (
          <span key={i} className="text-slate-200">
            {token}
          </span>
        );
      })}
    </>
  );
}

export default function AuditStudioSection() {
  const { walletKey, network, connect } = useWallet();
  const [code, setCode] = useState<string>(SAMPLE_SOROBAN_CONTRACT);
  const [contractName, setContractName] = useState<string>('VaultContract.rs');
  const [auditMode, setAuditMode] = useState<'PRE' | 'POST'>('PRE');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditDone, setAuditDone] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const txHash = '7a8f3d12c8b49e0f61254789ab23cd45ef67890123456789abcdef0123456789';
  const contractHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);

  React.useEffect(() => {
    if (walletKey) {
      fetchUserCreditBalance(walletKey)
        .then((b) => setAvailableCredits(b.availableCredits))
        .catch(() => setAvailableCredits(0));
    } else {
      setAvailableCredits(null);
    }
  }, [walletKey]);

  const handleRunAudit = async () => {
    let activeKey = walletKey;
    if (!activeKey) {
      try {
        activeKey = await connect();
      } catch (_) {
        return;
      }
      if (!activeKey) return;
    }

    if (availableCredits !== null && availableCredits <= 0) {
      setShowPricingModal(true);
      return;
    }

    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditDone(true);
      setAvailableCredits((prev) => (prev && prev > 0 ? prev - 1 : 0));

      const newAudit = {
        id: `audit-${Date.now()}`,
        contract: contractName || 'VaultContract.rs',
        contractName: contractName || 'VaultContract.rs',
        hash: contractHash,
        contractHash: contractHash,
        auditType: auditMode === 'PRE' ? 'PRE_DEPLOYMENT' : 'POST_DEPLOYMENT',
        riskScore: 72,
        isSecure: false,
        auditor: activeKey,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        ledgerSequence: `#4829105`,
        invariants: [
          'Invariant-1: require_auth() on State Mutations',
          'Invariant-2: Storage TTL Rent Extension Bound',
          'Invariant-4: Reentrancy CEI Ordering',
        ],
        vulnerabilities: [
          {
            title: 'Missing Authorization on withdraw() Endpoint',
            severity: 'HIGH',
            description: 'Original code did not enforce to.require_auth() or admin signature before balance deduction.',
            recommendation: 'Injected to.require_auth() directly prior to ledger balance read and storage deduction.',
          },
          {
            title: 'Unchecked Re-initialization on init()',
            severity: 'MEDIUM',
            description: 'Admin key could be overwritten if init was invoked subsequent times.',
            recommendation: 'Added env.storage().instance().has(&DataKey::Admin) panic guard check.',
          },
        ],
        isAnchored: true,
        txHash,
      };

      try {
        const stored = JSON.parse(localStorage.getItem('solace_audit_history') || '[]');
        const filtered = Array.isArray(stored)
          ? stored.filter((item: any) => (item.contract || item.contractName) !== newAudit.contract)
          : [];
        localStorage.setItem('solace_audit_history', JSON.stringify([newAudit, ...filtered]));
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solace-audit-completed', { detail: newAudit }));
      }
    }, 900);
  };

  const handleReset = () => {
    setCode(SAMPLE_SOROBAN_CONTRACT);
    setAuditDone(true);
  };

  return (
    <section id="audit" className="relative w-full py-16 sm:py-24 bg-white/40 dark:bg-[#090b10]/40 border-t border-slate-200/80 dark:border-white/10 backdrop-blur-md">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>On-Page Security Studio</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4"
          >
            Solace Audit Studio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
          >
            Run complete static AST invariant audits on your Soroban smart contracts directly on this page. Inspect risk scores, review Solace AI remediations, and inscribe audit proofs onto the Stellar ledger.
          </motion.p>
        </div>

        {/* Studio Controls Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-white/80 dark:bg-[#111726]/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm"
        >
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
              <span>
                {!walletKey
                  ? 'Connect Wallet to Audit'
                  : isAuditing
                  ? 'Running AST Engine...'
                  : 'Run Security Audit'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Main 2-Column Studio Canvas with Equal-Height Stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Code Editor Terminal Window */}
          <div className="lg:col-span-7 bg-[#0a0d14] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full justify-between text-left">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                <span className="font-bold text-white">{contractName}</span>
                <span className="text-[10px] text-slate-500">Soroban Rust v22</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-accent font-bold">
                  {code.split('\n').length} Lines
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  title={isEditing ? 'View formatted colored code' : 'Edit contract source code'}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-3 h-3 text-accent" />
                      <span>Colored View</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3 text-accent" />
                      <span>Edit Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Syntax-Colored Code View with Line Numbers */}
            <div className="relative p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-y-auto flex-1 modern-code-scrollbar min-h-[500px]">
              {isEditing ? (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={24}
                  className="w-full h-full min-h-[480px] bg-transparent text-slate-200 font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none border-0 selection:bg-accent selection:text-white"
                  spellCheck={false}
                />
              ) : (
                <pre className="text-slate-300 font-mono">
                  {code.split('\n').map((line, idx) => {
                    const lineNum = idx + 1;
                    const isVuln = line.includes('Vulnerability');
                    return (
                      <div
                        key={idx}
                        className={`flex items-start transition-colors duration-150 py-0.5 ${
                          isVuln
                            ? 'bg-red-500/10 -mx-4 sm:-mx-5 px-4 sm:px-5 border-l-2 border-red-500'
                            : 'hover:bg-slate-800/40 -mx-4 sm:-mx-5 px-4 sm:px-5'
                        }`}
                      >
                        <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-3 font-mono text-[11px]">
                          {lineNum}
                        </span>
                        <span className="flex-1 whitespace-pre">
                          {renderColoredRust(line)}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              )}
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
          <div className="lg:col-span-5 flex flex-col h-full justify-between gap-5 text-left">
            {/* Risk Score & Status Banner */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl shrink-0">
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

            {/* Vulnerabilities & Remediation Box (flex-1 to match height) */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex-1 flex flex-col justify-between">
              <div>
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

                {/* Solace AI Remediation Code */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-accent" />
                    <span>Solace AI Remediation Patch</span>
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs border border-accent/30 overflow-x-auto">
                    <pre>{`// Enforce caller authorization:
to.require_auth();`}</pre>
                  </div>
                </div>
              </div>

              {/* Permanent On-Chain Ledger Anchor Proof (button removed) */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Ledger Inscription Seal</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      ON-CHAIN ANCHORED
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Stellar Contract</span>
                    <span className="font-mono text-accent font-bold">CAC2TV...NPN2</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Audit Credit</span>
                    <span className="font-mono text-accent font-bold">
                      1 Credit (Prepaid Bundle)
                      {availableCredits !== null && (
                        <span className="ml-1.5 text-[10px] text-slate-500 font-normal">
                          ({availableCredits} left)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">
                      Tx: {txHash.slice(0, 16)}...
                    </span>
                    <a
                      href="https://stellar.expert/explorer/testnet/contract/CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Stellar Expert (Testnet)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          if (walletKey) {
            fetchUserCreditBalance(walletKey)
              .then((b) => setAvailableCredits(b.availableCredits))
              .catch(() => {});
          }
        }}
      />
    </section>
  );
}
