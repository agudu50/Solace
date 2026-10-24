'use client';
import React, { useState } from 'react';
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
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <section id="how-it-works" className="relative w-full py-16 sm:py-24 bg-slate-50/70 dark:bg-[#0c0f17]/70 border-t border-slate-200/80 dark:border-white/10 backdrop-blur-md">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Operational Pipeline</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4"
          >
            How Solace Secures Soroban in 3 Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
          >
            From raw Rust source code to an immutable cryptographic inscription on the Stellar ledger in less than 30 seconds.
          </motion.p>
        </div>

        {/* 3 Step Interactive Process Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Step Selector List (Left Column) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStep === idx;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden text-left ${
                    isActive
                      ? 'bg-white/95 dark:bg-[#111726]/90 border-accent shadow-xl shadow-accent/10 dark:shadow-black/50 scale-[1.01]'
                      : 'bg-white/60 dark:bg-[#111726]/40 border-slate-200/80 dark:border-white/10 hover:border-accent/40 hover:bg-white/80 dark:hover:bg-[#111726]/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number Badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base shrink-0 transition-colors shadow-xs ${
                        isActive
                          ? 'bg-accent text-white shadow-md shadow-accent/25'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.step}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {s.title}
                        </h3>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                      </div>

                      <div className="text-xs font-bold text-accent mb-2">
                        {s.subtitle}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                        {s.description}
                      </p>

                      {/* Expanded Details on Active Step */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5"
                        >
                          {s.detailPoints.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive Live Terminal Pipeline Simulation (Right Column) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 bg-[#0a0d14] rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-left"
          >
            {/* Terminal Window Top Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent inline-block" />
                <span className="text-white font-bold">solace_pipeline_execution.log</span>
              </div>
              <span className="text-accent font-bold uppercase tracking-wider text-[10px]">
                Step {STEPS[activeStep].step} Active
              </span>
            </div>

            {/* Interactive Code Console Output */}
            <div className="font-mono text-xs sm:text-sm text-slate-300 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 mb-6 min-h-[140px] leading-relaxed overflow-x-auto modern-code-scrollbar">
              <pre className="text-emerald-400 whitespace-pre-wrap">{STEPS[activeStep].codePreview}</pre>
            </div>

            {/* Pipeline Telemetry Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Subsystem Target</span>
                <span className="text-white font-bold">Stellar Soroban Protocol 22</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Cryptographic Proof</span>
                <span className="text-accent font-bold">SHA-256 Ledger Anchor</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Execution Latency</span>
                <span className="text-white font-bold">&lt; 30 Seconds Total</span>
              </div>
            </div>

            {/* Launch Studio CTA button (Glide directly to #audit on single page) */}
            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-400 font-sans">
                Ready to run this pipeline on your contract?
              </span>
              <a
                href="#audit"
                className="px-5 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-accent/20 cursor-pointer"
              >
                <span>Launch Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
