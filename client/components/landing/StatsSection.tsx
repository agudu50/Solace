'use client';
import React from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATS = [
  {
    value: 'Protocol 22',
    label: 'Stellar & Soroban Standard',
    description: 'Fully compliant with Protocol 22 storage rent and auth semantics',
    icon: Database,
    tag: 'STANDARD',
  },
  {
    value: '6 Vectors',
    label: 'AST Invariant Classes',
    description: 'Auth bypass, storage TTL eviction, panic traps, overflow, admin privilege, gas bounds',
    icon: ShieldCheck,
    tag: 'INVARIANTS',
  },
  {
    value: '30-90 XLM',
    label: 'Prepaid Audit Bundles',
    description: 'Non-expiring credit bundles: Starter (30 XLM), Growth (60 XLM), Professional (90 XLM)',
    icon: Zap,
    tag: 'PREPAID',
  },
  {
    value: '100% Ledger',
    label: 'Cryptographic Provenance',
    description: 'Audits stored immutably in Soroban persistent storage on CAC2TV...NPN2',
    icon: Lock,
    tag: 'ON-CHAIN',
  },
];

export default function StatsSection() {
  return (
    <section className="relative w-full py-16 sm:py-20 bg-slate-50/70 dark:bg-[#0c0f17]/70 border-y border-slate-200/80 dark:border-white/10 backdrop-blur-md">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {STATS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-3xl p-6 sm:p-7 bg-white/80 dark:bg-[#111726]/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5 dark:shadow-black/40 hover:border-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-accent bg-accent-subtle px-2.5 py-0.5 rounded-full border border-accent/20">
                      {item.tag}
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white mb-1 tracking-tight">
                    {item.value}
                  </div>

                  <div className="text-xs font-bold text-accent mb-2.5">
                    {item.label}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-accent transition-colors">
                  <span>Verified Architecture</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
