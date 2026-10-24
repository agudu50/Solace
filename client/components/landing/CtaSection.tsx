'use client';
import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';

export default function CtaSection() {
  const { walletKey, connect, connecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (_) {}
  };

  return (
    <section className="relative w-full py-16 sm:py-24 overflow-hidden">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden bg-white/80 dark:bg-[#111726]/60 backdrop-blur-xl border-2 border-accent p-8 sm:p-14 lg:p-20 shadow-2xl text-center"
        >
          {/* Ambient Lighting in Dominant Brand Color #C80552 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/12 rounded-full blur-[140px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Tag badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold mb-6 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production-Ready Soroban Auditing</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] mb-6"
            >
              Never Deploy an Unaudited Contract on Stellar.
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl"
            >
              Inspect your Rust source code in seconds, eliminate authorization leaks and host panics, and establish permanent cryptographic proof on the Soroban ledger.
            </motion.p>

            {/* Action Buttons in Solid Dominant Color (Glide directly to #audit) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-8"
            >
              <a
                href="#audit"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Security Studio</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              {!walletKey ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white dark:bg-[#111726] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold border border-slate-200/80 dark:border-white/10 shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4 text-accent" />
                  <span>{connecting ? 'Connecting...' : 'Connect Freighter'}</span>
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white dark:bg-[#111726] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold border border-slate-200/80 dark:border-white/10 shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <span>Go to Security Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </motion.div>

            {/* Trust and Non-Custodial Footer */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                <span>Non-Custodial Session</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M3.5 8.5h17" />
                  <path d="M3.5 15.5h17" />
                </svg>
                <span>Stellar Protocol 22</span>
              </span>
              <span>•</span>
              <span>Zero Key Storage</span>
              <span>•</span>
              <a href="#reports" className="text-accent hover:underline font-bold cursor-pointer">
                Browse Verified Reports
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
