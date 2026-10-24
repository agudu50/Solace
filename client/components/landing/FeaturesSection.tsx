'use client';
import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  GitPullRequest,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface FeatureItem {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  specs: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: Cpu,
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
    specs: ['1.0 XLM micro-fee treasury routing', 'Tamper-proof Soroban storage', 'Public ledger verification explorer'],
  },
  {
    icon: Sparkles,
    badge: 'Multi-Model Fallback',
    title: 'Adaptive Gemini AI Auditor',
    description:
      'High-throughput static rule analysis enriched by Google Gemini AI with automatic multi-model failover, generating exact, syntax-highlighted Rust remediations.',
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
      {/* Subtle background glow in dominant color #C80552 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-3 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Core Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Engineered for Mission-Critical Soroban Protocols
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Every layer of Solace is purposefully designed around the unique constraints of Stellar and Soroban: strict authorization invariants, storage rent economics, and cryptographic ledger provenance.
          </p>
        </div>

        {/* 6-Card Feature Grid with Solid Dominant Styling (No Gradients) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white dark:bg-[#111726] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Icon & Solid Dominant Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shadow-xs">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>

                    <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-accent-subtle text-accent border-accent/20 shadow-xs">
                      {feature.badge}
                    </span>
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
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
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
              </div>
            );
          })}
        </div>

        {/* Studio Launch Banner at bottom of Features (Solid Dominant Accent) */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111726] border-2 border-accent shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-1">
              Ready to verify your Soroban smart contract?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Upload your Rust code or paste a contract ID to generate your first audit report in seconds.
            </p>
          </div>

          <Link
            href="/audit"
            className="px-6 py-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold shadow-md shadow-accent/25 transition-all flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Security Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
