'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  Cpu,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Terminal,
  Database,
  ExternalLink,
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Source Ingestion & AST Parsing',
    subtitle: 'Upload Rust code or contract address',
    description:
      'Solace ingests your Soroban smart contract source code or fetches the on-chain compiled WASM bytecode from Stellar RPC. The lexer generates an Abstract Syntax Tree (AST) representing all entrypoints, storage keys, and authorization requirements.',
    detailPoints: [
      'Supports single-file & multi-module Soroban crates',
      'Calculates SHA-256 cryptographic bytecode digest',
      'Non-custodial session via Freighter wallet',
    ],
    codePreview: `// Step 1: Input source parsed into AST
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // AST node traversed: FunctionDefinition -> Signature -> Block
}`,
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Autonomous Invariant Scanning & AI Remediation',
    subtitle: 'Soroban rule engine + Gemini fallback',
    description:
      'Our deterministic rule engine cross-examines syntax trees against Soroban security best practices: require_auth() invariants, host panic elimination, and storage rent TTL extensions. Gemini multi-model AI generates line-attributed fixes.',
    detailPoints: [
      'Authorization bypass detection',
      'Storage rent eviction & TTL boundary calculation',
      'Instant syntax-highlighted Rust patch generation',
    ],
    codePreview: `// Step 2: Invariant Check
[AST ENGINE] Checking caller: from.require_auth() -> MISSING!
[GEMINI AI] Generating remediation diff for line 4...`,
  },
  {
    step: '03',
    icon: FileCheck2,
    title: 'Cryptographic On-Chain Ledger Inscription',
    subtitle: 'Immutable proof on Stellar Soroban',
    description:
      'The audit risk score, auditor keypair signature, and contract SHA-256 hash are submitted via an active Freighter session to the deployed solace_core Soroban contract on Stellar Testnet or Mainnet, creating a permanent on-chain record.',
    detailPoints: [
      'Anchored on solace_core (CAC2TVMF...V6PNPN2)',
      '1.0 XLM micro-fee routed to protocol rent treasury',
      'Publicly verifiable on Stellar Expert and Soroban RPC',
    ],
    codePreview: `// Step 3: Soroban On-Chain Anchor
solace_core::anchor_audit(
    contract_hash: "e3b0c44298fc...",
    risk_score: 95,
    auditor: "GBWSB2...FDYPI"
) -> TxHash: 7a8f3d... (Confirmed)`,
  },
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section id="how-it-works" className="relative w-full py-16 sm:py-24 bg-white/40 dark:bg-[#0b0e17]/40 border-t border-slate-200/70 dark:border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Operational Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            How Solace Secures Soroban in 3 Steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            From raw Rust source code to an immutable cryptographic inscription on the Stellar ledger in less than 30 seconds.
          </p>
        </div>

        {/* 3 Step Interactive Process Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Step Selector List (Left Column) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={s.step}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer text-left ${
                    isActive
                      ? 'bg-white dark:bg-[#111726] border-accent shadow-xl shadow-accent/10 ring-1 ring-accent/30'
                      : 'bg-white/50 dark:bg-[#111726]/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-all ${
                        isActive
                          ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.step}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {s.title}
                        </h3>
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                      </div>

                      <p className="text-xs text-accent font-semibold mb-2">
                        {s.subtitle}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                        {s.description}
                      </p>

                      {/* Detail Bullet Points */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                        {s.detailPoints.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step Visual Preview Display (Right Column) */}
          <div className="lg:col-span-6 bg-[#0a0d14] rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col justify-between text-left font-mono">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="w-4 h-4 text-accent" />
                  <span className="font-bold text-white">
                    solace_pipeline_execution.log
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-subtle border border-accent/20 px-2.5 py-0.5 rounded-full">
                  Step {STEPS[activeStep].step} Active
                </span>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-[#111726] rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed overflow-x-auto modern-code-scrollbar mb-6">
                <pre>{STEPS[activeStep].codePreview}</pre>
              </div>

              {/* Live Step Explanation Details */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subsystem Target:</span>
                  <span className="text-white font-bold">Stellar Soroban Protocol 22</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Cryptographic Proof:</span>
                  <span className="text-accent font-bold">SHA-256 Ledger Anchor</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Execution Latency:</span>
                  <span className="text-accent font-bold">&lt; 30 Seconds Total</span>
                </div>
              </div>
            </div>

            {/* Launch Studio CTA button */}
            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-400 font-sans">
                Ready to run this pipeline on your contract?
              </span>
              <Link
                href="/audit"
                className="px-5 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-accent/20"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
