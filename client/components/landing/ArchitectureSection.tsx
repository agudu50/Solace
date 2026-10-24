'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  FileCode,
  Sparkles,
} from 'lucide-react';

export default function ArchitectureSection() {
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const contractId = 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractId);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <section id="architecture" className="relative w-full py-16 sm:py-24 overflow-hidden">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            On-Chain Ledger Provenance Model
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Most security tools generate transient off-chain reports. Solace permanently seals verified audit findings into Soroban persistent storage, allowing users, dApps, and indexers to verify contract integrity directly on Stellar.
          </p>
        </div>

        {/* Architecture Flow Visual Container */}
        <div className="relative bg-white dark:bg-[#111726] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xl overflow-hidden">
          {/* Subtle background glow in dominant color #C80552 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* 4-Stage Architecture Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {/* Box 1: Non-Custodial Client */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                  Layer 1 · Auth Client
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  Freighter Keypair
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Decentralized auditor signature with zero private key disclosure. Signs payload anchors directly via the Freighter browser extension.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-accent font-semibold">
                @stellar/freighter-api
              </div>
            </div>

            {/* Box 2: AI & Invariant Core */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                  Layer 2 · Analysis Engine
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  AST + Gemini Multi-Model
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Dual-pass engine evaluating Soroban authorization invariants, storage rent boundaries, and generating syntactic remediation code.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-accent font-semibold">
                SHA-256 Digest &amp; JSON Schema
              </div>
            </div>

            {/* Box 3: On-Chain Soroban Contract */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                  Layer 3 · On-Chain Core
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  solace_core Contract
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Deployed Rust contract on Stellar Testnet and Mainnet. Inscribes audit records in persistent storage funded by a 1.0 XLM protocol micro-fee.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-accent font-semibold">
                1.0 XLM Rent Treasury
              </div>
            </div>

            {/* Box 4: Ledger Explorer & Verification */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                  Layer 4 · Verification
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                  Public Ledger Explorer
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Anyone can query the Stellar RPC to inspect cryptographic audit proofs, verified bytecode hashes, and risk scores without centralized trust.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono text-accent font-semibold">
                Stellar Expert &amp; RPC Live
              </div>
            </div>
          </div>

          {/* Live Deployed Contract Address Banner */}
          <div className="mt-8 pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
              <div className="text-left">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">
                  Deployed On-Chain Contract (Stellar Testnet Protocol 22)
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-accent break-all">
                  {contractId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyContract}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedContract ? 'Copied Contract ID' : 'Copy ID'}</span>
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <span>Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
