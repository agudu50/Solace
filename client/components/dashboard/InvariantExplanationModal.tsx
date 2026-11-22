'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Code2, Info } from 'lucide-react';

export interface InvariantTopic {
  key: string;
  title: string;
  category: string;
  score?: number;
  status?: string;
  whatChecks: string;
  whyText?: string;
  whySafe: string;
  whyBad: string;
  sorobanContext: string;
  remediationSnippet: string;
  color?: string;
}

export const INVARIANT_KNOWLEDGE_BASE: Record<string, InvariantTopic> = {
  auth: {
    key: 'auth',
    title: 'Authorization & Caller Verification',
    category: 'Caller Verification',
    whatChecks: 'Verifies that sensitive endpoints requiring user or administrative approval invoke caller.require_auth() or address.require_auth_for_args(...) before mutating state.',
    whyText: 'Missing caller authentication allows arbitrary actors to invoke privileged functions (like withdraw or transfer) without holding the private keys.',
    whySafe: '100% means every sensitive state transition requires explicit cryptographic proof of ownership. Unauthorized callers cannot forge signatures on Stellar.',
    whyBad: 'Scores below 75% indicate that unauthenticated callers can trigger financial state mutations, allowing anyone to drain contract funds or hijack protocol state.',
    sorobanContext: 'In Stellar Soroban, user authorization is explicit and non-custodial. Calling require_auth() asserts that the invoker or authorized address signed the Soroban invocation envelope with their Ed25519 private key.',
    remediationSnippet: `// 1. Enforce caller authorization before state mutation
pub fn withdraw(env: Env, caller: Address, amount: i128) -> Result<(), Error> {
    caller.require_auth(); // Halts execution if signature verification fails

    // 2. Safely process withdrawal
    let balance = get_balance(&env, &caller)?;
    set_balance(&env, &caller, balance - amount)?;
    Ok(())
}`,
    color: '#10b981',
  },
  storage: {
    key: 'storage',
    title: 'Storage Rent & TTL Eviction Boundaries',
    category: 'State Lifecycle',
    whatChecks: 'Monitors instance, persistent, and temporary storage TTL (Time-To-Live) boundaries to ensure contract entries are renewed before ledger eviction.',
    whyText: 'Soroban Protocol 22 enforces strict rent models. Data entries without live extend_ttl() calls expire and are permanently archived or evicted from the ledger.',
    whySafe: '100% indicates that persistent storage entries (user balances, vaults, token supplies) have automated TTL extension buffers preventing rent expiration.',
    whyBad: 'Scores below 75% mean state keys risk eviction. When an entry is evicted, user balance queries return None and the contract state becomes bricked.',
    sorobanContext: 'Stellar Soroban charges storage rent per ledger entry based on byte size and lifetime. Contracts must call env.storage().persistent().extend_ttl(...) during interactions to keep their state active.',
    remediationSnippet: `// Extend persistent storage TTL during contract operations
let rent_bump_amount = 100_000; // ~100k ledgers
let threshold = 50_000;

env.storage().persistent().extend_ttl(
    &DataKey::Balance(user.clone()),
    threshold,
    rent_bump_amount
);`,
    color: '#06b6d4',
  },
  safety: {
    key: 'safety',
    title: 'Host Panic Safety & Error Handling',
    category: 'Runtime Traps',
    whatChecks: 'Scans for raw .unwrap(), .expect(), unhandled division by zero, or asserts that trigger an irreversible host trap inside the Soroban WebAssembly VM.',
    whyText: 'Using .unwrap() on Option or Result types without returning custom contract errors causes the host VM to panic, wasting invocation gas and aborting the transaction.',
    whySafe: '100% means all runtime failure paths return structured Result<T, ContractError> enums, allowing callers and dApps to gracefully handle errors.',
    whyBad: 'Scores below 75% mean unexpected user inputs or missing keys cause VM crashes, freezing transaction execution and leaving frontend integrations blind.',
    sorobanContext: 'When a Soroban contract panics, execution aborts immediately, uncommitted ledger changes revert, and no structured error code is surfaced to the client application.',
    remediationSnippet: `#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    InsufficientBalance = 1,
    Unauthorized = 2,
    KeyNotFound = 3,
}

// Return clean errors instead of calling .unwrap()
pub fn query_state(env: Env, key: Symbol) -> Result<i128, ContractError> {
    env.storage().instance().get(&key).ok_or(ContractError::KeyNotFound)
}`,
    color: '#a855f7',
  },
  admin: {
    key: 'admin',
    title: 'State & Initialization Overwrites',
    category: 'Constructor Invariants',
    whatChecks: 'Guards contract initialization routines to ensure constructor init() functions can only be invoked once and cannot be front-run or re-initialized.',
    whyText: 'Contracts without initialization locks allow attackers to call init() again after deployment, overwriting the owner address with their own wallet.',
    whySafe: '100% indicates administrative roles are sealed upon initial setup and protected with env.storage().instance().has(&ADMIN_KEY) checks.',
    whyBad: 'Scores below 75% mean an attacker can overwrite governance keys, update fee recipients, or upgrade contract bytecode to a malicious binary.',
    sorobanContext: 'Unlike Ethereum constructor routines that execute only during contract creation, Soroban init() functions are standard public endpoints unless explicitly guarded by persistent storage flags.',
    remediationSnippet: `// Prevent constructor re-initialization attack
pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
    if env.storage().instance().has(&DataKey::Admin) {
        return Err(ContractError::AlreadyInitialized);
    }
    admin.require_auth();
    env.storage().instance().set(&DataKey::Admin, &admin);
    Ok(())
}`,
    color: '#C80552',
  },
  math: {
    key: 'math',
    title: 'Arithmetic Safety & Integer Overflows',
    category: 'Numeric Boundaries',
    whatChecks: 'Verifies all balance additions, deductions, token minting, and fee calculations use checked math (checked_add, checked_sub, checked_mul).',
    whyText: 'Direct arithmetic operators (+, -, *) can overflow or underflow at boundary limits, causing silent numeric wrapping or unintended token generation.',
    whySafe: '100% means mathematical operations revert safely with descriptive errors if balance limits or numeric thresholds are exceeded.',
    whyBad: 'Scores below 75% indicate potential overflow flaws that malicious actors can exploit to mint arbitrary tokens or bypass collateral limits.',
    sorobanContext: 'Rust in debug mode checks overflows, but in release builds arithmetic wrapping can occur if checked arithmetic is not explicitly utilized.',
    remediationSnippet: `// Use checked arithmetic to prevent token overflow/underflow
let new_balance = current_balance
    .checked_add(deposit_amount)
    .ok_or(ContractError::ArithmeticOverflow)?;

let remaining = total_shares
    .checked_sub(burn_amount)
    .ok_or(ContractError::ArithmeticUnderflow)?;`,
    color: '#f59e0b',
  },
  code: {
    key: 'code',
    title: 'Gas, Bytecode & Execution Limits',
    category: 'Resource Budget',
    whatChecks: 'Evaluates WebAssembly bytecode size, loop bounds, CPU instruction consumption, and ledger footprint read/write operations.',
    whyText: 'Unbounded loop iterations or oversized storage read footprints risk exceeding Stellar network transaction limits (e.g. 100M CPU instructions).',
    whySafe: '100% indicates that contract execution remains well below budget limits across all operational input sizes.',
    whyBad: 'Scores below 75% mean complex operations may hit the Soroban CPU budget ceiling on testnet or mainnet, causing transactions to fail.',
    sorobanContext: 'Stellar validators meter CPU instructions, memory allocation, and read/write byte footprints. Exceeding any budget limit immediately terminates transaction execution.',
    remediationSnippet: `// Enforce pagination or bounded loops to protect CPU budgets
const MAX_PAGE_SIZE: u32 = 50;

pub fn batch_process(env: Env, items: Vec<Address>) -> Result<(), Error> {
    if items.len() > MAX_PAGE_SIZE {
        return Err(ContractError::BatchTooLarge);
    }
    for item in items.iter() {
        // Bounded execution
    }
    Ok(())
}`,
    color: '#6366f1',
  },
  other: {
    key: 'other',
    title: 'General Architecture & Contract Hygiene',
    category: 'Design Best Practices',
    whatChecks: 'Scans for anti-patterns, redundant storage allocations, dead code paths, missing doc comments, and non-standard visibility modifiers in Soroban Rust smart contracts.',
    whyText: 'While not direct critical exploits, architectural findings degrade maintainability, increase contract bytecode size, and complicate formal auditing verification.',
    whySafe: '100% indicates clean, modular, and idiomatic Rust code following official Stellar Soroban conventions and best practices.',
    whyBad: 'Low scores highlight code smells, duplicate state structures, or excessive complexity that may obscure subtle security vulnerabilities.',
    sorobanContext: 'Soroban contracts compile to WebAssembly and run in a metered, resource-constrained environment. Keeping contract architecture modular and lean reduces footprint fees and minimizes bug surface.',
    remediationSnippet: `// Idiomatic Soroban structure with clean module separation
#[contract]
pub struct SolaceVault;

#[contractimpl]
impl SolaceVault {
    // Keep functions focused with explicit types and documented preconditions
    pub fn get_version() -> u32 {
        1
    }
}`,
    color: '#64748b',
  },
};

export default function InvariantExplanationModal({
  isOpen,
  onClose,
  topicKey,
  score,
  status,
}: {
  isOpen: boolean;
  onClose: () => void;
  topicKey: string | null;
  score?: number;
  status?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  // Resolve topic key from known aliases
  const tKey = (topicKey || '').toLowerCase();
  const normalizedKey = tKey.includes('auth') || tKey.includes('signature') || tKey.includes('caller') || tKey.includes('privilege')
    ? 'auth'
    : tKey.includes('storage') || tKey.includes('rent') || tKey.includes('ttl') || tKey.includes('evict')
    ? 'storage'
    : tKey.includes('panic') || tKey.includes('safety') || tKey.includes('trap') || tKey.includes('unwrap')
    ? 'safety'
    : tKey.includes('admin') || tKey.includes('init') || tKey.includes('state')
    ? 'admin'
    : tKey.includes('math') || tKey.includes('arithmetic') || tKey.includes('overflow') || tKey.includes('underflow')
    ? 'math'
    : tKey.includes('gas') || tKey.includes('bytecode') || tKey.includes('limit') || tKey.includes('loop')
    ? 'code'
    : tKey.includes('other')
    ? 'other'
    : 'code';

  const data = INVARIANT_KNOWLEDGE_BASE[normalizedKey] || INVARIANT_KNOWLEDGE_BASE['auth'];
  const displayScore = score ?? (data.score ?? 100);
  const displayStatus = status ?? (displayScore >= 100 ? 'Guarded' : displayScore >= 75 ? 'Warning' : 'Breached');
  const isSafe = displayScore >= 100;
  const isCritical = displayScore < 75;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#16171d] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 my-auto text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                  style={{ background: data.color || '#C80552' }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {data.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider ${
                        isSafe
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : isCritical
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {displayScore}% · {displayStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Category: {data.category} • Stellar Soroban Protocol 22
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto modern-code-scrollbar space-y-5 text-xs sm:text-[13px] leading-relaxed">
              {/* What this means */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  What this invariant verifies
                </h4>
                <p className="text-slate-700 dark:text-slate-300">
                  {data.whatChecks}
                </p>
              </div>

              {/* Why that score / percentage */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111216] border border-slate-200 dark:border-white/[0.08] space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Understanding the {displayScore}% score
                </h4>
                <p className="text-slate-700 dark:text-slate-300">
                  {data.whyText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs">
                    <span className="font-bold block mb-0.5">✓ Why 100% is safe:</span>
                    {data.whySafe}
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200 text-xs">
                    <span className="font-bold block mb-0.5">✕ Why &lt;75% is bad / breached:</span>
                    {data.whyBad}
                  </div>
                </div>
              </div>

              {/* Soroban Protocol Context */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Stellar Soroban Invariant Mechanics
                </h4>
                <p className="text-slate-700 dark:text-slate-300">
                  {data.sorobanContext}
                </p>
              </div>

              {/* Recommended Rust Remediation Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-accent" />
                    Recommended Soroban Rust Remediation
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-500 font-medium">Rust Invariant Pattern</span>
                </div>
                <pre className="p-3.5 rounded-2xl bg-[#0c0d11] text-emerald-400 font-mono text-xs leading-5 overflow-x-auto border border-white/10 modern-code-scrollbar selection:bg-accent/40">
                  {data.remediationSnippet}
                </pre>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                AST Ruleset: Soroban v22 Security Profile
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close &amp; Continue Audit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
