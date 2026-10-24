'use client';
import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  GitPullRequest,
  Lock,
  CheckCircle2,
  FileCheck2,
  Bot,
  Terminal,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureItem {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  specs: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: Terminal,
    badge: 'AST Deep Analysis',
    title: 'Static Invariant Verification',
    description:
      'Deep semantic parsing of Soroban Rust syntax trees. Flags missing require_auth() checks, caller spoofing, and privilege escalation vectors before deployment.',
    specs: ['require_auth() state coverage', 'Host panic unwrap() elimination', 'Unchecked math overflow guard'],
  },
  {
    icon: Database,
    badge: 'Protocol 22 State',
    title: 'Storage Rent & TTL Telemetry',
    description:
      'Stellar Protocol 22 evicts expired persistent storage. Solace computes real-time TTL boundaries, identifies missing extend_ttl() invocations, and prevents state loss.',
    specs: ['Persistent vs Instance isolation', 'Automatic TTL bump recommendations', 'Sub-second ledger state polling'],
  },
  {
    icon: FileCheck2,
    badge: 'Cryptographic Provenance',
    title: 'On-Chain Ledger Inscriptions',
    description:
      'Immutably stores audit risk scores, SHA-256 bytecode hashes, and auditor signatures on the deployed solace_core Soroban contract on the Stellar ledger.',
    specs: ['Prepaid non-expiring credit bundles', 'Tamper-proof Soroban storage', 'Public ledger verification explorer'],
  },
  {
    icon: Bot,
    badge: 'Multi-Model Fallback',
    title: 'Autonomous AI Remediation Engine',
    description:
      'High-throughput static rule analysis enriched by Solace AI with automatic multi-model failover, generating exact, syntax-highlighted Rust remediations.',
    specs: ['Zero single-point-of-failure fallback', 'Line-by-line vulnerability attribution', 'Context-aware code diffs'],
  },
  {
    icon: GitPullRequest,
    badge: 'CI/CD Pipeline',
    title: 'Automated GitHub Action Bot',
    description:
      'Seamlessly integrates into developer CI/CD workflows. Comments risk assessments, invariant compliance checks, and recommended patches directly on pull requests.',
    specs: ['Automated PR blocking on critical flaws', 'Zero-setup YAML GitHub Workflow', 'Real-time commit telemetry'],
  },
  {
    icon: Lock,
    badge: 'Non-Custodial',
    title: 'Freighter Decentralized Auth',
    description:
      'Auditors authenticate non-custodially via official Freighter wallet keypairs. All on-chain inscriptions and reports are cryptographically signed by the auditor.',
    specs: ['Zero private key exposure', 'Multi-network (Testnet & Mainnet)', 'Session-based cryptographic signing'],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative w-full py-16 sm:py-24 overflow-hidden">
      {/* Ambient background glow in dominant color #C80552 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Core Architecture</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4"
          >
            Engineered for Mission-Critical Soroban Protocols
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
          >
            Every layer of Solace is purposefully designed around the unique constraints of Stellar and Soroban: strict authorization invariants, storage rent economics, and cryptographic ledger provenance.
          </motion.p>
        </div>

        {/* 6-Card Feature Grid with Dribbble Glassmorphic Styling (No Gradients) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-white/80 dark:bg-[#111726]/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-all hover:border-accent/40 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Icon, Badge, and Circular Arrow Button (Dribbble Style) */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shadow-xs">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-accent-subtle text-accent border-accent/20 shadow-xs">
                        {feature.badge}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-accent group-hover:text-white transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2.5">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Specs List */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                  {feature.specs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Studio Launch Banner at bottom of Features (Points directly to #audit on this page) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#111726]/80 backdrop-blur-xl border-2 border-accent shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-1">
              Ready to verify your Soroban smart contract?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Upload your Rust code or paste a contract ID to generate your first audit report in seconds.
            </p>
          </div>

          <a
            href="#audit"
            className="px-6 py-3.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold shadow-md shadow-accent/25 transition-all flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Security Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
