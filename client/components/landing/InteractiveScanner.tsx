'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  Terminal,
  ArrowUpRight,
  Cpu,
  Lock,
  Layers,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface ContractSample {
  id: string;
  name: string;
  filename: string;
  description: string;
  code: string;
  vulnLine: number;
  vulnTitle: string;
  vulnCategory: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  riskScore: number;
  fixedSnippet: string;
  astExplanation: string;
  contractHash: string;
}

const SAMPLES: ContractSample[] = [
  {
    id: 'vault',
    name: 'Token Vault Withdraw',
    filename: 'soroban_token_vault.rs',
    description: 'DeFi vault contract missing admin signature verification on withdrawal dispatch.',
    code: `pub fn withdraw(
    env: Env,
    admin: Address,
    to: Address,
    amount: i128
) -> Result<i128, Error> {
    // CRITICAL INVARIANT FLAW:
    // Missing admin.require_auth() check!
    // Anyone can invoke this function and drain the vault!
    
    let mut balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap();
    if balance < amount {
        return Err(Error::InsufficientFunds);
    }
    
    balance -= amount;
    env.storage().instance().set(&DataKey::Balance, &balance);
    Ok(balance)
}`,
    vulnLine: 8,
    vulnTitle: 'Authorization Bypass on State Mutation',
    vulnCategory: 'Soroban Auth Invariant',
    severity: 'CRITICAL',
    riskScore: 72,
    fixedSnippet: `// SOLACE AI REMEDIATION:
admin.require_auth(); // Enforce Soroban cryptographic caller signature`,
    astExplanation:
      'Solace AST engine traversed all mutation endpoints and identified state modification of `DataKey::Balance` without a preceding `admin.require_auth()` signature verification.',
    contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'storage',
    name: 'Storage Rent TTL',
    filename: 'storage_rent_manager.rs',
    description: 'Contract writes persistent state without extending time-to-live rent boundaries.',
    code: `pub fn save_record(
    env: Env,
    caller: Address,
    record: UserRecord
) -> Result<(), Error> {
    caller.require_auth();
    
    // STORAGE RENT THREAT:
    // Writing to persistent storage without extending TTL rent.
    // In Protocol 22, this state will be evicted by the ledger!
    env.storage().persistent().set(&caller, &record);
    
    Ok(())
}`,
    vulnLine: 9,
    vulnTitle: 'Missing Persistent Storage TTL Extension',
    vulnCategory: 'Ledger State Rent Eviction',
    severity: 'HIGH',
    riskScore: 68,
    fixedSnippet: `// SOLACE AI REMEDIATION:
env.storage().persistent().extend_ttl(&caller, 535_680, 535_680); // ~30 days rent longevity`,
    astExplanation:
      'Stellar Protocol 22 archives expired persistent storage keys. Without proactive TTL bump extension, user account balances and states face permanent ledger eviction.',
    contractHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'pool',
    name: 'Liquidity Swap Math',
    filename: 'liquidity_pool_swap.rs',
    description: 'Unchecked arithmetic operation susceptible to integer overflow panic on high token volumes.',
    code: `pub fn swap_exact_tokens(
    env: Env,
    caller: Address,
    amount_in: i128
) -> Result<i128, Error> {
    caller.require_auth();
    
    // HOST PANIC CRASH VECTOR:
    // Raw arithmetic addition can overflow and crash the Soroban VM!
    let fee: i128 = (amount_in * 3) / 1000;
    let new_reserves: i128 = env.storage().instance().get(&DataKey::Reserve).unwrap() + amount_in;
    
    Ok(new_reserves)
}`,
    vulnLine: 9,
    vulnTitle: 'Unchecked Arithmetic & Panic Vector',
    vulnCategory: 'Soroban VM Safety',
    severity: 'MEDIUM',
    riskScore: 58,
    fixedSnippet: `// SOLACE AI REMEDIATION:
let new_reserves = env.storage().instance().get(&DataKey::Reserve).unwrap()
    .checked_add(amount_in).ok_or(Error::ArithmeticOverflow)?;`,
    astExplanation:
      'Solace detected naked binary arithmetic operator `+` instead of checked arithmetic `.checked_add()`. In Soroban, unhandled arithmetic overflow halts execution and reverts transaction state.',
    contractHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  },
];

// High-speed syntax coloring function for Soroban Rust code
function renderColoredRust(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    const isWarning =
      trimmed.includes('CRITICAL') ||
      trimmed.includes('THREAT') ||
      trimmed.includes('CRASH') ||
      trimmed.includes('FLAW') ||
      trimmed.includes('Missing') ||
      trimmed.includes('Writing to persistent') ||
      trimmed.includes('Raw arithmetic');
    return (
      <span className={isWarning ? 'text-red-400 font-bold' : 'text-slate-500 italic'}>
        {line}
      </span>
    );
  }

  const tokenRegex =
    /(\b(?:pub|fn|let|mut|if|return|match|else|true|false|struct|impl|use|mod|Ok|Err)\b|\b(?:Env|Address|i128|Result|Error|UserRecord|DataKey|Balance|Reserve|ArithmeticOverflow|InsufficientFunds)\b|\b(?:withdraw|save_record|swap_exact_tokens|storage|instance|persistent|get|set|unwrap|require_auth|extend_ttl|checked_add|ok_or)\b|\b\d+[\d_]*\b|"[^"]*"|\/\/.+$|[-><&:=+*/-]+|\s+|[^\s\w]+|\w+)/g;

  const matches = line.match(tokenRegex);
  if (!matches) return <span>{line}</span>;

  return (
    <>
      {matches.map((token, i) => {
        if (/^(pub|fn|let|mut|if|return|match|else|struct|impl|use|mod)$/.test(token)) {
          return (
            <span key={i} className="text-accent font-bold">
              {token}
            </span>
          );
        }
        if (/^(Ok|Err)$/.test(token)) {
          return (
            <span key={i} className="text-amber-400 font-bold">
              {token}
            </span>
          );
        }
        if (
          /^(Env|Address|i128|Result|Error|UserRecord|DataKey|Balance|Reserve|ArithmeticOverflow|InsufficientFunds)$/.test(
            token
          )
        ) {
          return (
            <span key={i} className="text-sky-400 font-semibold">
              {token}
            </span>
          );
        }
        if (
          /^(withdraw|save_record|swap_exact_tokens|storage|instance|persistent|get|set|unwrap|require_auth|extend_ttl|checked_add|ok_or)$/.test(
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
          return (
            <span key={i} className="text-slate-500 italic">
              {token}
            </span>
          );
        }
        if (/^[-><&:=+*/-]+$/.test(token)) {
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

export default function InteractiveScanner() {
  const [selectedSample, setSelectedSample] = useState<ContractSample>(SAMPLES[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [scanStage, setScanStage] = useState<string>('Analysis Complete');
  const [scanCompleted, setScanCompleted] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const handleSelectSample = (sample: ContractSample) => {
    setSelectedSample(sample);
    setScanCompleted(false);
    setScanProgress(0);
    setScanStage('Awaiting AST Inspection');
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(15);
    setScanStage('Parsing Soroban Syn AST...');

    setTimeout(() => {
      setScanProgress(45);
      setScanStage('Evaluating require_auth & caller invariance...');
    }, 450);

    setTimeout(() => {
      setScanProgress(75);
      setScanStage('Inspecting persistent storage rent TTL bounds...');
    }, 900);

    setTimeout(() => {
      setScanProgress(100);
      setScanStage('Solace AI Verification & Ledger Seal Ready');
      setIsScanning(false);
      setScanCompleted(true);

      const scanReport = {
        id: `scan-${Date.now()}`,
        contract: selectedSample.filename,
        contractName: selectedSample.filename,
        hash: selectedSample.contractHash,
        contractHash: selectedSample.contractHash,
        auditType: 'PRE_DEPLOYMENT',
        riskScore: selectedSample.riskScore,
        isSecure: selectedSample.riskScore >= 90,
        auditor: 'GBWSB2X7WUXPZXW2HQY2CYHCKY76T7G3R4H5P3WXZHAYL7SF3FDYPI',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        ledgerSequence: '#4829104',
        invariants: [
          'Invariant-1: require_auth() on State Mutations',
          'Invariant-2: Storage TTL Rent Extension Bound',
          'Invariant-3: Safe Checked Arithmetic',
        ],
        vulnerabilities: [
          {
            title: selectedSample.vulnTitle,
            severity: selectedSample.severity,
            description: selectedSample.astExplanation,
            recommendation: selectedSample.fixedSnippet,
          },
        ],
      };

      try {
        const stored = JSON.parse(localStorage.getItem('solace_audit_history') || '[]');
        const filtered = Array.isArray(stored)
          ? stored.filter((item: any) => (item.contract || item.contractName) !== scanReport.contract)
          : [];
        localStorage.setItem('solace_audit_history', JSON.stringify([scanReport, ...filtered]));
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solace-audit-completed', { detail: scanReport }));
      }
    }, 1350);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(selectedSample.contractHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section id="scanner" className="relative w-full py-16 sm:py-24 bg-slate-50/50 dark:bg-[#0c101b]/60 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Test the Solace AST Engine Live
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Select a real Soroban smart contract pattern below. Run the instant AST inspection to observe how Solace detects vulnerabilities and generates cryptographic on-chain proofs.
          </p>
        </div>

        {/* Contract Sample Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {SAMPLES.map((sample) => {
            const isSelected = selectedSample.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 scale-[1.02]'
                    : 'bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-accent/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0" />
                <span>{sample.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : sample.severity === 'CRITICAL'
                      ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30'
                      : sample.severity === 'HIGH'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                  }`}
                >
                  {sample.severity}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Simulator Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Code Editor Terminal Window */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111726] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Terminal Window Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/80 dark:bg-[#0a0d14]/80 border-b border-slate-200/80 dark:border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="font-bold text-slate-800 dark:text-slate-200 ml-2">
                  {selectedSample.filename}
                </span>
              </div>

              {/* Action Buttons inside Terminal Bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Run AST Scan'}</span>
                </button>
              </div>
            </div>

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 relative overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}

            {/* Code Content with Line Numbers & Laser Scan Overlay */}
            <div className="relative p-4 sm:p-6 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto bg-[#0a0d14] text-slate-200 modern-code-scrollbar">
              {/* Animated Laser Scanning Beam in Dominant Color */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-accent border-b border-accent pointer-events-none shadow-sm shadow-accent animate-[bounce_1.5s_infinite]" />
              )}

              <pre className="text-slate-300 font-mono">
                {selectedSample.code.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const isVuln =
                    scanCompleted &&
                    (line.includes('CRITICAL INVARIANT FLAW') ||
                      line.includes('STORAGE RENT THREAT') ||
                      line.includes('HOST PANIC CRASH VECTOR') ||
                      line.includes('Missing admin.require_auth') ||
                      line.includes('Writing to persistent storage') ||
                      line.includes('Raw arithmetic addition'));
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-4 py-0.5 px-2 rounded-md transition-colors ${
                        isVuln
                          ? 'bg-red-950/60 text-red-200 border-l-4 border-red-500 font-bold'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="w-6 text-right text-slate-600 select-none shrink-0 font-mono">
                        {lineNum}
                      </span>
                      <span className="flex-1 whitespace-pre font-mono">
                        {renderColoredRust(line)}
                      </span>
                    </div>
                  );
                })}
              </pre>
            </div>

            {/* Terminal Status Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/60 dark:bg-[#0a0d14]/60 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isScanning
                      ? 'bg-amber-400 animate-pulse'
                      : scanCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {scanStage}
                </span>
              </span>
              <span>Soroban SDK v22.0.1 · Rust 1.80</span>
            </div>
          </div>

          {/* Right: Real-Time Findings & Cryptographic Inscription Panel */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Finding Card */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  AST Invariant Report
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    selectedSample.severity === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{selectedSample.severity} Flaw</span>
                </span>
              </div>

              {/* Finding Title & Risk Score */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {selectedSample.vulnTitle}
                  </h3>
                  <span className="text-xs font-semibold text-accent mt-0.5 block">
                    {selectedSample.vulnCategory}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono text-accent">
                    {selectedSample.riskScore}/100
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Risk Score
                  </span>
                </div>
              </div>

              {/* AST Explanation */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-5">
                {selectedSample.astExplanation}
              </p>

              {/* AI Auto-Remediation Code Box */}
              <div className="mb-5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  <span>Solace AI Remediation Patch</span>
                </span>
                <div className="p-3.5 rounded-2xl bg-[#090c15] border border-emerald-500/40 text-emerald-300 font-mono text-xs overflow-x-auto shadow-inner remediation-code-scrollbar">
                  <pre>
                    {selectedSample.fixedSnippet.split('\n').map((snipLine, sIdx) => (
                      <div key={sIdx} className="leading-relaxed whitespace-pre">
                        {renderColoredRust(snipLine)}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* On-Chain Anchor Inscription Details */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Ledger Destination</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    solace_core (Soroban)
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Stellar Contract ID</span>
                  <span className="font-mono font-bold text-accent truncate max-w-[200px]">
                    CAC2TVMF5TZ3CH3FS...NPN2
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Bytecode SHA-256</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedSample.contractHash.slice(0, 10)}...
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                      title="Copy contract hash"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Protocol Inscription Fee</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    1.0 XLM Micro-Fee
                  </span>
                </div>
              </div>

              {/* Launch Studio CTA (Glide directly to #audit on single page) */}
              <div className="mt-5">
                <a
                  href="#audit"
                  className="w-full py-3.5 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold shadow-md shadow-accent/25 transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Full Audit in Solace Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
