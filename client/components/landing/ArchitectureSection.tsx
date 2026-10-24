'use client';
import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const LAYERS = [
  {
    layer: 'Layer 1 · Auth Client',
    title: 'Freighter Keypair',
    description:
      'Decentralized auditor signature with zero private key disclosure. Signs payload anchors directly via the Freighter browser extension.',
    tech: '@stellar/freighter-api',
    icon: Lock,
  },
  {
    layer: 'Layer 2 · Analysis Engine',
    title: 'AST + Gemini Multi-Model',
    description:
      'Dual-pass engine evaluating Soroban authorization invariants, storage rent boundaries, and generating syntactic remediation code.',
    tech: 'SHA-256 Digest & JSON Schema',
    icon: Cpu,
  },
  {
    layer: 'Layer 3 · On-Chain Core',
    title: 'solace_core Contract',
    description:
      'Deployed Rust contract on Stellar Testnet and Mainnet. Inscribes audit records in persistent storage funded by a 1.0 XLM protocol micro-fee.',
    tech: '1.0 XLM Rent Treasury',
    icon: Layers,
  },
  {
    layer: 'Layer 4 · Verification',
    title: 'Public Ledger Explorer',
    description:
      'Anyone can query the Stellar RPC to inspect cryptographic audit proofs, verified bytecode hashes, and risk scores without centralized trust.',
    tech: 'Stellar Expert & RPC Live',
    icon: CheckCircle2,
  },
];

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
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Architecture</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4"
          >
            On-Chain Ledger Provenance Model
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
          >
            Most security tools generate transient off-chain reports. Solace permanently seals verified audit findings into Soroban persistent storage, allowing users, dApps, and indexers to verify contract integrity directly on Stellar.
          </motion.p>
        </div>

        {/* Architecture Flow Visual Container with Dribbble Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-white/80 dark:bg-[#111726]/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-10 shadow-2xl overflow-hidden"
        >
          {/* Subtle background glow in dominant color #C80552 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* 4-Stage Architecture Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {LAYERS.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent bg-accent-subtle px-2 py-0.5 rounded-md border border-accent/20">
                        {layer.layer}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                      {layer.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {layer.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 text-[11px] font-mono text-accent font-semibold flex items-center justify-between">
                    <span>{layer.tech}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Live Deployed Contract Address Banner */}
          <div className="mt-8 pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
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
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedContract ? 'Copied Contract ID' : 'Copy ID'}</span>
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition flex items-center gap-1.5"
              >
                <span>Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
