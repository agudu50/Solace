'use client';
import React from 'react';
import {
  ShieldCheck,
  Activity,
  Zap,
  Lock,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const STATS = [
  {
    value: 'Protocol 22',
    label: 'Stellar & Soroban Standard',
    description: 'Fully compliant with Protocol 22 storage rent and auth semantics',
    icon: Database,
  },
  {
    value: '6 Vectors',
    label: 'AST Invariant Classes',
    description: 'Auth bypass, storage TTL eviction, panic traps, overflow, admin privilege, gas bounds',
    icon: ShieldCheck,
  },
  {
    value: '1.0 XLM',
    label: 'Protocol Treasury Micro-Fee',
    description: 'Self-sustaining economic model routing rent renewal funding to the protocol treasury',
    icon: Zap,
  },
  {
    value: '100% Ledger',
    label: 'Cryptographic Provenance',
    description: 'Audits stored immutably in Soroban persistent storage on CAC2TV...NPN2',
    icon: Lock,
  },
];

export default function StatsSection() {
  return (
    <section className="relative w-full py-16 bg-slate-50/60 dark:bg-[#0c101b]/60 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111726] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white mb-1 tracking-tight">
                    {item.value}
                  </div>
                  <div className="text-xs font-bold text-accent mb-2">
                    {item.label}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
