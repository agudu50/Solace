'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  Check,
  Copy,
  Fingerprint,
  GitPullRequestArrow,
  Hourglass,
  Play,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, animate, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { SectionHeading, btn, container } from './primitives';
import { EASE_OUT } from './motion';

/* ------------------------------------------------------------------ */
/* Samples                                                             */
/* ------------------------------------------------------------------ */

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

interface ContractSample {
  id: string;
  name: string;
  filename: string;
  description: string;
  code: string;
  /** 1-indexed lines highlighted once the scan completes. */
  flagLines: number[];
  /** Inline fix: inserted after `after`, optionally replacing `replaces`. */
  patch: { after: number; replaces?: number; lines: string[] };
  vulnTitle: string;
  vulnCategory: string;
  severity: Severity;
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
    description: 'DeFi vault missing admin signature verification on withdrawal.',
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
    flagLines: [7, 8, 9, 17],
    patch: { after: 6, lines: ['    admin.require_auth();'] },
    vulnTitle: 'Authorization bypass on state mutation',
    vulnCategory: 'Soroban auth invariant',
    severity: 'CRITICAL',
    riskScore: 72,
    fixedSnippet: `// SOLACE AI REMEDIATION:
admin.require_auth(); // Enforce Soroban cryptographic caller signature`,
    astExplanation:
      'The AST engine traversed every mutation endpoint and found a write to DataKey::Balance with no preceding admin.require_auth() signature check.',
    contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'storage',
    name: 'Storage Rent TTL',
    filename: 'storage_rent_manager.rs',
    description: 'Persistent state written without extending its time-to-live.',
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
    flagLines: [8, 9, 10, 11],
    patch: { after: 11, lines: ['    env.storage().persistent().extend_ttl(&caller, 535_680, 535_680);'] },
    vulnTitle: 'Missing persistent storage TTL extension',
    vulnCategory: 'Ledger state rent eviction',
    severity: 'HIGH',
    riskScore: 68,
    fixedSnippet: `// SOLACE AI REMEDIATION:
env.storage().persistent().extend_ttl(&caller, 535_680, 535_680); // ~30 days rent longevity`,
    astExplanation:
      'Protocol 22 archives expired persistent keys. Without a proactive TTL bump, user records face permanent eviction from the ledger.',
    contractHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'pool',
    name: 'Liquidity Swap Math',
    filename: 'liquidity_pool_swap.rs',
    description: 'Unchecked arithmetic that can overflow and panic the host on large volumes.',
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
    flagLines: [8, 9, 11],
    patch: {
      after: 11,
      replaces: 11,
      lines: [
        '    let new_reserves = env.storage().instance().get(&DataKey::Reserve).unwrap()',
        '        .checked_add(amount_in).ok_or(Error::ArithmeticOverflow)?;',
      ],
    },
    vulnTitle: 'Unchecked arithmetic and panic vector',
    vulnCategory: 'Soroban VM safety',
    severity: 'MEDIUM',
    riskScore: 58,
    fixedSnippet: `// SOLACE AI REMEDIATION:
let new_reserves = env.storage().instance().get(&DataKey::Reserve).unwrap()
    .checked_add(amount_in).ok_or(Error::ArithmeticOverflow)?;`,
    astExplanation:
      'A naked + operator is used instead of .checked_add(). In Soroban, an unhandled overflow halts execution and reverts the whole transaction.',
    contractHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  },
];

const SEV: Record<Severity, { dot: string; text: string; ring: string; bg: string; border: string; badge: string }> = {
  CRITICAL: { dot: 'bg-accent', text: 'text-[#ff5c93]', ring: 'var(--e-global-color-accent)', bg: 'bg-accent/[0.12]', border: 'border-accent', badge: 'border-accent/40' },
  HIGH: { dot: 'bg-amber-400', text: 'text-amber-400', ring: '#fbbf24', bg: 'bg-amber-400/[0.08]', border: 'border-amber-400', badge: 'border-amber-400/40' },
  MEDIUM: { dot: 'bg-sky-400', text: 'text-sky-400', ring: '#38bdf8', bg: 'bg-sky-400/[0.08]', border: 'border-sky-400', badge: 'border-sky-400/40' },
};

const STAGES: { agent: string; task: string; icon: LucideIcon }[] = [
  { agent: 'Bytecode Verifier', task: 'Parse syn AST', icon: Fingerprint },
  { agent: 'Auth Sentinel', task: 'require_auth invariants', icon: ShieldCheck },
  { agent: 'Rent Keeper', task: 'Storage TTL bounds', icon: Hourglass },
  { agent: 'Panic Hunter', task: 'Arithmetic safety', icon: Bug },
];

const SCAN_MS = 2600;
const LINE_H = 22;

/* ------------------------------------------------------------------ */
/* Syntax colouring                                                    */
/* ------------------------------------------------------------------ */

const KW = /^(pub|fn|let|mut|if|return|match|else|struct|impl|use|mod)$/;
const TYPES = /^(Env|Address|i128|Result|Error|UserRecord|DataKey|Balance|Reserve|ArithmeticOverflow|InsufficientFunds|Ok|Err)$/;
const CALLS = /^(withdraw|save_record|swap_exact_tokens|storage|instance|persistent|get|set|unwrap|require_auth|extend_ttl|checked_add|ok_or)$/;
const TOKEN = /(\/\/.*$|\b\w+\b|\s+|[^\s\w]+)/g;

function renderRust(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    const warn = /CRITICAL|THREAT|CRASH|FLAW|Missing|Anyone|Writing|Protocol|Raw/.test(trimmed);
    return <span className={warn ? 'text-[#ff8fb8]' : 'text-slate-500 italic'}>{line}</span>;
  }
  const parts = line.match(TOKEN) ?? [line];
  return parts.map((t, i) => {
    let cls = 'text-slate-300';
    if (KW.test(t)) cls = 'text-[#c792ea]';
    else if (TYPES.test(t)) cls = 'text-[#82aaff]';
    else if (CALLS.test(t)) cls = t === 'unwrap' ? 'text-[#f78c6c]' : 'text-[#89ddff]';
    else if (/^\d[\d_]*$/.test(t)) cls = 'text-[#f78c6c]';
    else if (/^[^\s\w]+$/.test(t)) cls = 'text-slate-500';
    return (
      <span key={i} className={cls}>
        {t}
      </span>
    );
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Phase = 'idle' | 'scanning' | 'done';

export default function InteractiveScanner() {
  const { walletKey, connect } = useWallet();
  const reduce = useReducedMotion();
  const [sample, setSample] = useState<ContractSample>(SAMPLES[0]);
  const [phase, setPhase] = useState<Phase>('done');
  const [scanned, setScanned] = useState(Number.MAX_SAFE_INTEGER);
  const [showPatch, setShowPatch] = useState(true);
  const [copied, setCopied] = useState(false);
  const runId = useRef(0);

  const lines = sample.code.split('\n');
  const stage = phase === 'done' ? STAGES.length : phase === 'idle' ? -1 : Math.min(STAGES.length - 1, Math.floor((scanned / lines.length) * STAGES.length));
  const sev = SEV[sample.severity];

  // Cancel any in-flight scan on unmount.
  useEffect(() => () => void runId.current++, []);

  const selectSample = (s: ContractSample) => {
    runId.current++;
    setSample(s);
    setPhase('idle');
    setScanned(0);
    setShowPatch(false);
  };

  const persistReport = (auditor: string) => {
    const scanReport = {
      id: `scan-${Date.now()}`,
      contract: sample.filename,
      contractName: sample.filename,
      hash: sample.contractHash,
      contractHash: sample.contractHash,
      auditType: 'PRE_DEPLOYMENT',
      riskScore: sample.riskScore,
      isSecure: sample.riskScore >= 90,
      auditor,
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
          title: sample.vulnTitle,
          severity: sample.severity,
          description: sample.astExplanation,
          recommendation: sample.fixedSnippet,
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
    window.dispatchEvent(new CustomEvent('solace-audit-completed', { detail: scanReport }));
  };

  const runScan = async () => {
    let key = walletKey;
    if (!key) {
      try {
        key = await connect();
      } catch (_) {
        return;
      }
      if (!key) return;
    }

    const id = ++runId.current;
    const alive = () => runId.current === id;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    setShowPatch(false);
    setScanned(0);
    setPhase('scanning');

    if (!reduce) {
      const per = SCAN_MS / lines.length;
      for (let i = 1; i <= lines.length; i++) {
        await wait(per);
        if (!alive()) return;
        setScanned(i);
      }
      await wait(250);
      if (!alive()) return;
    }

    setScanned(Number.MAX_SAFE_INTEGER);
    setPhase('done');
    persistReport(key);
    await wait(reduce ? 0 : 900);
    if (alive()) setShowPatch(true);
  };

  const copyHash = () => {
    navigator.clipboard.writeText(sample.contractHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Window flattens from a tilted plane as it scrolls into view.
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'start 0.35'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  const done = phase === 'done';
  const scanning = phase === 'scanning';

  return (
    <section id="scanner" className="relative w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10 overflow-hidden">
      <div className={container}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-16">
          <SectionHeading
            eyebrow="Simulator"
            title="Watch the engine work on real patterns"
            description="Pick a Soroban contract pattern and run the scan. See exactly what Solace flags, why, and the patch it proposes."
            className="mb-0 sm:mb-0"
          />
        </div>

        <div ref={frameRef} className="relative [perspective:2000px]">
          {/* Glow under the window */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[70%] rounded-[50%] bg-accent opacity-[0.10] dark:opacity-[0.18] blur-[100px]" />

          <motion.div
            style={reduce ? undefined : { rotateX, scale, transformOrigin: '50% 100%' }}
            className="relative rounded-xl border border-slate-800 dark:border-white/10 bg-[#121212] text-slate-300 overflow-hidden shadow-[0_50px_120px_-40px_rgba(0,0,0,0.6)]"
          >
            {/* Title bar: file tabs + run */}
            <div className="flex items-stretch border-b border-white/10 bg-[#0e0e0e]">
              <div role="tablist" aria-label="Contract samples" className="flex flex-1 min-w-0 overflow-x-auto modern-code-scrollbar">
                {SAMPLES.map((s) => {
                  const selected = s.id === sample.id;
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      onClick={() => selectSample(s)}
                      className={`relative flex items-center gap-2 shrink-0 h-11 px-4 font-mono text-xs border-r border-white/10 transition-colors cursor-pointer ${
                        selected ? 'text-white bg-[#121212]' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${SEV[s.severity].dot}`} />
                      {s.filename}
                      {selected && (
                        <motion.span layoutId="scanner-tab" className="absolute inset-x-0 top-0 h-px bg-accent" transition={{ duration: 0.35, ease: EASE_OUT }} />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 px-3 shrink-0">
                <button
                  type="button"
                  onClick={runScan}
                  disabled={scanning}
                  className="group inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {done ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {!walletKey ? 'Connect wallet to scan' : scanning ? 'Scanning…' : done ? 'Run again' : 'Run AST scan'}
                </button>
              </div>
            </div>

            {/* Agent pipeline */}
            <ol className="grid grid-cols-2 md:grid-cols-4 border-b border-white/10 text-[11px]">
              {STAGES.map((s, i) => {
                const state = i < stage ? 'done' : i === stage ? 'run' : 'wait';
                const Icon = s.icon;
                return (
                  <li
                    key={s.agent}
                    className={`relative flex items-center gap-2.5 px-4 h-12 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''} md:border-l first:md:border-l-0 border-white/10`}
                  >
                    <span
                      className={`grid place-items-center w-6 h-6 rounded-md border transition-colors duration-300 ${
                        state === 'done'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : state === 'run'
                          ? 'bg-accent/20 border-accent/60 text-white'
                          : 'border-white/10 text-slate-600'
                      }`}
                    >
                      {state === 'done' ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-medium ${state === 'wait' ? 'text-slate-500' : 'text-slate-200'}`}>{s.agent}</span>
                      <span className="block truncate font-mono text-slate-500">{s.task}</span>
                    </span>
                    {state === 'run' && (
                      <motion.span
                        layoutId="scanner-stage"
                        className="absolute inset-x-0 bottom-0 h-px bg-accent"
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Code */}
              <div className="lg:col-span-7 lg:border-r border-white/10 flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-3 px-4 h-10 border-b border-white/5 text-[11px]">
                  <span className="truncate text-slate-500">{sample.description}</span>
                  {done && (
                    <button
                      type="button"
                      onClick={() => setShowPatch((v) => !v)}
                      className="shrink-0 inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <GitPullRequestArrow className="w-3.5 h-3.5" />
                      {showPatch ? 'Hide patch' : 'Show patch'}
                    </button>
                  )}
                </div>

                <div className="relative flex-1 py-3 font-mono text-[12px] sm:text-[12.5px] overflow-x-auto modern-code-scrollbar min-h-[440px]">
                  {/* Scan sweep */}
                  <AnimatePresence>
                    {scanning && (
                      <motion.div
                        key="sweep"
                        aria-hidden
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: 12 + Math.min(scanned, lines.length - 1) * LINE_H }}
                        exit={{ opacity: 0 }}
                        transition={{ y: { duration: SCAN_MS / lines.length / 1000, ease: 'linear' }, opacity: { duration: 0.2 } }}
                        className="absolute left-0 right-0 top-0 pointer-events-none"
                        style={{ height: LINE_H }}
                      >
                        <div className="absolute inset-0 bg-accent/10 border-y border-accent/40" />
                        <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-accent/[0.06]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {lines.map((line, idx) => {
                    const n = idx + 1;
                    const flagged = done && sample.flagLines.includes(n);
                    const visible = phase !== 'scanning' || idx < scanned;
                    const removed = showPatch && sample.patch.replaces === n;
                    return (
                      <React.Fragment key={`${sample.id}-${idx}`}>
                        <div
                          style={{ height: LINE_H }}
                          className={`relative flex items-center pr-4 whitespace-pre border-l-2 transition-[background-color,border-color,opacity] duration-300 ${
                            removed
                              ? 'bg-accent/10 border-accent/70 line-through decoration-accent/60 opacity-60'
                              : flagged
                              ? `${sev.bg} ${sev.border}`
                              : 'border-transparent'
                          } ${visible ? 'opacity-100' : 'opacity-30'}`}
                        >
                          <span className="w-12 shrink-0 text-right pr-4 text-slate-600 select-none">
                            {removed ? <span className="text-accent">−</span> : n}
                          </span>
                          <span>{renderRust(line)}</span>
                          {flagged && n === sample.flagLines[0] && (
                            <motion.span
                              initial={{ opacity: 0, x: 6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, ease: EASE_OUT }}
                              className={`ml-auto pl-4 hidden sm:inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-wider ${sev.text}`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {sample.severity}
                            </motion.span>
                          )}
                        </div>

                        {n === sample.patch.after && (
                          <AnimatePresence initial={false}>
                            {showPatch &&
                              sample.patch.lines.map((p, pi) => (
                                <motion.div
                                  key={`${sample.id}-patch-${pi}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: LINE_H, opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.45, delay: pi * 0.08, ease: EASE_OUT }}
                                  className="flex items-center pr-4 whitespace-pre border-l-2 border-emerald-400 bg-emerald-400/[0.08] overflow-hidden"
                                >
                                  <span className="w-12 shrink-0 text-right pr-4 text-emerald-400 select-none">+</span>
                                  <span className="text-emerald-300">{p}</span>
                                </motion.div>
                              ))}
                          </AnimatePresence>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Report */}
              <div className="lg:col-span-5 border-t lg:border-t-0 border-white/10 flex flex-col min-h-[440px]">
                <AnimatePresence mode="wait">
                  {done ? (
                    <Report key={`report-${sample.id}`} sample={sample} copied={copied} onCopy={copyHash} />
                  ) : (
                    <motion.div
                      key={`wait-${sample.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col p-5 sm:p-6"
                    >
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">AST invariant report</p>
                      <div className="flex-1 grid place-items-center text-center py-10">
                        <div>
                          <ScanOrb active={scanning} progress={scanning ? scanned / lines.length : 0} />
                          <p className="mt-6 text-sm text-slate-200">
                            {scanning ? STAGES[Math.max(0, stage)].task + '…' : 'Ready to scan'}
                          </p>
                          <p className="mt-1.5 text-xs text-slate-500 max-w-[16rem] mx-auto">
                            {scanning
                              ? `${STAGES[Math.max(0, stage)].agent} is walking ${sample.filename}`
                              : walletKey
                              ? 'Run the scan to see what the agents flag.'
                              : 'Connect Freighter to run the scan. No credit is used.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 h-9 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-2">
                <span className="relative flex w-1.5 h-1.5">
                  {scanning && <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 animate-ping-soft" />}
                  <span className={`relative w-1.5 h-1.5 rounded-full ${scanning ? 'bg-amber-400' : done ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                </span>
                <span className="text-slate-300">
                  {scanning ? `scanning ${Math.min(scanned, lines.length)}/${lines.length} lines` : done ? 'analysis complete · 1 finding' : 'awaiting AST inspection'}
                </span>
              </span>
              <span className="hidden sm:inline">Soroban SDK v22.0.1 · Rust 1.80</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Report panel                                                        */
/* ------------------------------------------------------------------ */

const item = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE_OUT } },
};

function Report({ sample, copied, onCopy }: { sample: ContractSample; copied: boolean; onCopy: () => void }) {
  const sev = SEV[sample.severity];
  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="flex-1 flex flex-col p-5 sm:p-6"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">AST invariant report</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${sev.badge} ${sev.bg} ${sev.text} font-mono text-[10px] uppercase tracking-wider`}>
          <AlertTriangle className="w-3 h-3" />
          {sample.severity}
        </span>
      </motion.div>

      <motion.div variants={item} className="mt-5 flex items-center gap-5">
        <RiskGauge value={sample.riskScore} color={sev.ring} />
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-medium tracking-tight text-white leading-snug">{sample.vulnTitle}</h3>
          <p className={`mt-1 text-xs ${sev.text}`}>{sample.vulnCategory}</p>
        </div>
      </motion.div>

      <motion.p variants={item} className="mt-5 text-[13px] text-slate-400 leading-relaxed">
        {sample.astExplanation}
      </motion.p>

      <motion.div variants={item} className="mt-5 rounded-md border border-emerald-500/25 bg-emerald-500/[0.04] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 h-8 border-b border-emerald-500/15 text-[11px] text-emerald-400">
          <GitPullRequestArrow className="w-3.5 h-3.5" />
          Remediation patch · 3/3 models agree
        </div>
        <pre className="px-3 py-2.5 font-mono text-[11.5px] leading-5 overflow-x-auto remediation-code-scrollbar">
          {sample.fixedSnippet.split('\n').map((l, i) => (
            <div key={i} className="whitespace-pre">
              {renderRust(l)}
            </div>
          ))}
        </pre>
      </motion.div>

      <motion.dl variants={item} className="mt-5 text-xs divide-y divide-white/5 border-y border-white/5">
        <Row k="Ledger destination" v={<span className="text-slate-200">solace_core</span>} />
        <Row k="Contract ID" v={<span className="text-slate-200">CAC2TVMF…NPN2</span>} />
        <Row
          k="Bytecode SHA-256"
          v={
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-200">{sample.contractHash.slice(0, 10)}…</span>
              <button
                type="button"
                onClick={onCopy}
                className="p-1 -m-1 rounded text-slate-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Copy bytecode hash"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
          }
        />
        <Row k="Cost" v={<span className="text-slate-200">1 credit · prepaid bundle</span>} />
      </motion.dl>

      <motion.div variants={item} className="mt-auto pt-6">
        <a href="#audit" className={`${btn.primary} w-full group`}>
          Open full audit in Solace Studio
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </motion.div>
    </motion.div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 h-9">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-mono truncate">{v}</dd>
    </div>
  );
}

/** Circular risk meter that sweeps and counts up to `value`. */
function RiskGauge({ value, color }: { value: number; color: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return setN(value);
    const c = animate(0, value, { duration: 1.2, delay: 0.15, ease: EASE_OUT, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, reduce]);

  return (
    <div className="relative w-16 h-16 shrink-0" role="img" aria-label={`Risk score ${value} out of 100`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? value / 100 : 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: 1.2, delay: 0.15, ease: EASE_OUT }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-medium tabular-nums text-white leading-none">{n}</span>
      </span>
    </div>
  );
}

/** Concentric rings that spin up while a scan is running. */
function ScanOrb({ active, progress }: { active: boolean; progress: number }) {
  const reduce = useReducedMotion();
  const spin = active && !reduce;
  return (
    <div className="relative w-28 h-28 mx-auto [perspective:400px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full border ${active ? 'border-accent/50' : 'border-white/10'}`}
          style={{ inset: i * 14, transformStyle: 'preserve-3d' }}
          animate={
            spin
              ? { rotateX: [60, 60], rotateZ: i % 2 ? [360, 0] : [0, 360] }
              : { rotateX: 60, rotateZ: 0 }
          }
          transition={spin ? { rotateZ: { duration: 3 + i, repeat: Infinity, ease: 'linear' } } : { duration: 0.6 }}
        >
          {spin && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--e-global-color-accent)]" />}
        </motion.div>
      ))}
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-xs tabular-nums text-slate-300">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
