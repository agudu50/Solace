'use client';
import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import PricingModal from '../pricing/PricingModal';
import { btn, container, codePanel } from './primitives';

const CODE: { n: number; text: React.ReactNode; flag?: boolean }[] = [
  { n: 1, text: <><span className="text-slate-500">#[contractimpl]</span></> },
  { n: 2, text: <><span className="text-[#c792ea]">impl</span> Token {'{'}</> },
  { n: 3, text: <>  <span className="text-[#c792ea]">pub fn</span> <span className="text-white">transfer</span>(env: Env, from: Address, to: Address, amt: i128) {'{'}</> },
  { n: 4, text: <>    <span className="text-slate-500">// missing: from.require_auth();</span></>, flag: true },
  { n: 5, text: <>    <span className="text-[#c792ea]">let</span> bal = read_balance(&amp;env, &amp;from)<span className="text-[#f78c6c]">.unwrap()</span>;</> },
  { n: 6, text: <>    write_balance(&amp;env, &amp;from, bal - amt);</> },
  { n: 7, text: <>    write_balance(&amp;env, &amp;to, read_balance(&amp;env, &amp;to) + amt);</> },
  { n: 8, text: <>  {'}'}</> },
  { n: 9, text: <>{'}'}</> },
];

const FINDINGS = [
  { sev: 'CRIT', label: 'Missing require_auth() on transfer', loc: 'L3', tone: 'text-accent' },
  { sev: 'HIGH', label: 'Host panic via unwrap() on balance read', loc: 'L5', tone: 'text-amber-400' },
  { sev: 'MED', label: 'No extend_ttl() on persistent balance', loc: 'L6', tone: 'text-sky-400' },
];

const METRICS = [
  { value: '< 0.4s', label: 'AST scan latency' },
  { value: '6', label: 'Invariant classes checked' },
  { value: 'SHA-256', label: 'Bytecode seal per audit' },
  { value: '30 XLM', label: 'Starter bundle, never expires' },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

export default function HeroSection() {
  const { walletKey, connect, connecting } = useWallet();
  const [showPricing, setShowPricing] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (_) {}
  };

  return (
    <section className="relative w-full border-b border-slate-200 dark:border-white/10">
      <div className="absolute inset-0 grid-lines pointer-events-none" aria-hidden />

      <div className={`relative ${container} pt-14 sm:pt-20 lg:pt-24`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Copy */}
          <div className="lg:col-span-6">
            <motion.button
              {...fade(0)}
              type="button"
              onClick={() => setShowPricing(true)}
              className="group inline-flex items-center gap-3 mb-8 pl-1 pr-3 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] text-xs text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer"
            >
              <span className="px-1.5 py-0.5 rounded-[3px] bg-accent text-white font-mono text-[10px] uppercase tracking-wider">
                New
              </span>
              <span>Multi-model analysis now cross-checks every finding</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </motion.button>

            <motion.h1
              {...fade(0.05)}
              className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem] font-medium tracking-tightest text-slate-900 dark:text-white"
            >
              Security audits for Soroban, sealed on&#8209;chain.
            </motion.h1>

            <motion.p
              {...fade(0.1)}
              className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl"
            >
              Solace catches authorization gaps, storage-rent eviction and host panics in your
              Stellar contracts, then anchors a verifiable audit record to the ledger.
            </motion.p>

            <motion.div {...fade(0.15)} className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#audit" className={btn.primary}>
                Audit a contract
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#scanner" className={btn.secondary}>
                Try the simulator
              </a>
              {!walletKey && (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className={`${btn.link} ml-1 disabled:opacity-50`}
                >
                  <Wallet className="w-4 h-4" />
                  {connecting ? 'Connecting…' : 'Connect Freighter'}
                </button>
              )}
            </motion.div>
          </div>

          {/* Product panel */}
          <motion.div {...fade(0.2)} className="lg:col-span-6">
            <div className={`${codePanel} overflow-hidden text-[12.5px] leading-[1.7]`}>
              {/* Tab bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 h-10 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-white">token.rs</span>
                  <span className="text-slate-500">lib.rs</span>
                </div>
                <span className="text-slate-500">solace audit --network testnet</span>
              </div>

              {/* Code */}
              <div className="py-3 overflow-x-auto modern-code-scrollbar">
                {CODE.map((line) => (
                  <div
                    key={line.n}
                    className={`flex pr-4 whitespace-pre ${line.flag ? 'bg-accent/10 border-l-2 border-accent' : 'border-l-2 border-transparent'}`}
                  >
                    <span className="w-10 shrink-0 text-right pr-4 text-slate-600 select-none">{line.n}</span>
                    <span>{line.text}</span>
                  </div>
                ))}
              </div>

              {/* Findings */}
              <div className="border-t border-white/10">
                <div className="flex items-center justify-between px-4 h-9 text-[11px] uppercase tracking-wider text-slate-500">
                  <span>Findings · 3</span>
                  <span>Risk 82 / 100</span>
                </div>
                {FINDINGS.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 px-4 h-9 border-t border-white/5 text-xs"
                  >
                    <span className={`w-10 shrink-0 ${f.tone}`}>{f.sev}</span>
                    <span className="flex-1 truncate text-slate-200 font-sans">{f.label}</span>
                    <span className="text-slate-500">{f.loc}</span>
                  </div>
                ))}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 h-10 text-[11px] text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  anchored to solace_core
                </span>
                <span className="truncate">tx 7a8f3d…e21c<span className="caret">▍</span></span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Metrics strip */}
        <dl className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 border-t border-slate-200 dark:border-white/10">
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className={`py-6 sm:py-8 pr-4 ${i % 2 === 1 ? 'pl-4 sm:pl-6 border-l border-slate-200 dark:border-white/10' : ''} ${
                i === 2 ? 'lg:pl-6 lg:border-l border-slate-200 dark:border-white/10' : ''
              } ${i >= 2 ? 'border-t lg:border-t-0 border-slate-200 dark:border-white/10' : ''}`}
            >
              <dt className="eyebrow">{m.label}</dt>
              <dd className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {showPricing && <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />}
    </section>
  );
}
