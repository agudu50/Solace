'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Terminal,
  Wallet,
  ArrowUpRight,
  Lock,
  Layers,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';

const Hero3DCanvas = dynamic(() => import('./Hero3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-[340px] xs:h-[380px] sm:h-[540px] lg:h-[620px] flex items-center justify-center">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-accent/40 animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border-2 border-accent/20 animate-[spin_12s_linear_infinite_reverse]" />
        <div className="w-28 h-28 rounded-full bg-accent/20 backdrop-blur-xl border border-accent/50 shadow-2xl shadow-accent/40 flex items-center justify-center animate-pulse">
          <span className="text-white font-mono font-black text-xs uppercase tracking-widest text-center">
            FLUID CORE
          </span>
        </div>
      </div>
    </div>
  ),
});

export default function HeroSection() {
  const { walletKey, network, connect, connecting } = useWallet();
  const [active3DMode, setActive3DMode] = useState<'guard' | 'scan' | 'anchor'>('guard');

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (_) {}
  };

  return (
    <section className="relative w-full overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 bg-transparent transition-colors">
      {/* Background Ambient Glows (Dominant #C80552) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[500px] bg-accent/12 rounded-full blur-[160px]" />
        <div className="absolute top-[280px] left-1/4 w-[350px] h-[350px] bg-accent/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Hero Header (Matching Dribbble Reference) */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-8 sm:mb-12">
          {/* Top Protocol Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-[#111726]/90 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
              Solace Security Core
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-bold text-accent flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9.5" />
                <path d="M3.5 8.5h17" />
                <path d="M3.5 15.5h17" />
              </svg>
              <span>Stellar Protocol 22</span>
            </span>
          </motion.div>

          {/* Centered Main Headline in Modern Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.06] mb-5"
          >
            Elevate Your Smart Contract{' '}
            <span className="text-accent inline-block">
              Security
            </span>
          </motion.h1>

          {/* Centered Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mb-8"
          >
            Eliminate Soroban authorization flaws, storage rent eviction crashes, and host panics.
            Powered by autonomous AST invariant verification and on-chain ledger provenance.
          </motion.p>

          {/* Centered Pill Action Buttons (Matching Dribbble Style) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
          >
            <a
              href="#audit"
              className="px-8 py-3.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-extrabold shadow-xl shadow-accent/30 hover:shadow-accent/45 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Your Contract</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="#scanner"
              className="px-7 py-3.5 rounded-full bg-white dark:bg-[#111726] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Terminal className="w-4 h-4 text-accent" />
              <span>Interactive AST Simulator</span>
            </a>

            {!walletKey && (
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="px-6 py-3.5 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-50"
              >
                <Wallet className="w-4 h-4 text-accent" />
                <span>{connecting ? 'Connecting...' : 'Connect Freighter'}</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* 3D Liquid Motion Centerpiece with Floating Glassmorphic Cards (Dribbble Layout) */}
        <div className="relative w-full max-w-5xl mx-auto mt-2 sm:mt-6">
          {/* Ambient Lighting Behind Liquid Glass Sphere */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[540px] h-[300px] sm:h-[540px] bg-accent/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

          {/* Central Three.js Molten Fluid Glass Sphere Canvas */}
          <div className="relative w-full h-[340px] xs:h-[380px] sm:h-[540px] lg:h-[620px] flex items-center justify-center">
            <Hero3DCanvas mode={active3DMode} onModeChange={setActive3DMode} />

            {/* Desktop Left Floating Glassmorphic Card */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
              className="hidden sm:block absolute left-4 lg:left-8 top-1/3 -translate-y-1/2 z-20 max-w-[240px] lg:max-w-[260px] p-4 lg:p-5 rounded-2xl bg-white/70 dark:bg-[#111726]/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 group hover:scale-[1.03] transition-transform duration-300 pointer-events-auto"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-accent">
                  INVARIANT PROTOCOL
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug mb-1">
                6 Formal Invariant Guards
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Autonomous AST rule verification on every state mutation.
              </p>

              {/* Verified Pill */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Zero Bypass Vulnerabilities</span>
              </div>
            </motion.div>

            {/* Desktop Right Floating Glassmorphic Card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
              className="hidden sm:block absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 max-w-[230px] lg:max-w-[250px] p-4 lg:p-5 rounded-2xl bg-white/70 dark:bg-[#111726]/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 group hover:scale-[1.03] transition-transform duration-300 pointer-events-auto"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-accent">
                  SECURITY SCORE
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  99.8%
                </span>
                <span className="text-xs font-bold text-emerald-500">
                  Verified Safe
                </span>
              </div>

              {/* Progress bar in dominant #C80552 (No gradient) */}
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-2">
                <div className="w-[99.8%] h-full bg-accent rounded-full" />
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Stellar Soroban Ledger Testnet
              </p>
            </motion.div>
          </div>

          {/* Mobile Dedicated Glassmorphic Cards (Clean, visible, and never obscuring the 3D canvas) */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mt-3 sm:hidden px-2">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#111726]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-accent">
                  INVARIANT PROTOCOL
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug mb-1">
                6 Formal Invariant Guards
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Autonomous AST verification on state mutations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#111726]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-accent">
                  SECURITY SCORE
                </span>
                <span className="text-xs font-bold text-emerald-500">
                  99.8% Safe
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-1.5">
                <div className="w-[99.8%] h-full bg-accent rounded-full" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Stellar Soroban Testnet
              </p>
            </div>
          </div>
        </div>

        {/* Technical Trust Metrics Strip */}
        <div className="max-w-4xl mx-auto mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              &lt; 0.4s
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              AST Scan Latency
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-accent">
              100%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              On-Chain Provenance
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-accent">
              1.0 XLM
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Treasury Anchor Fee
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              SHA-256
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Bytecode Seal
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
