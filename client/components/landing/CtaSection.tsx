'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { Eyebrow, btn, container } from './primitives';
import { EASE_OUT, Reveal, useActive } from './motion';

const KINDS = ['token', 'vault', 'DEX', 'DAO', 'lending'];

export default function CtaSection() {
  const { walletKey, connect, connecting } = useWallet();
  const [kind, setKind] = useState(0);
  const headRef = useRef<HTMLHeadingElement>(null);
  const active = useActive(headRef);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active || reduce) return;
    const t = setInterval(() => setKind((k) => (k + 1) % KINDS.length), 2400);
    return () => clearInterval(t);
  }, [active, reduce]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (_) {}
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0 grid-lines pointer-events-none" aria-hidden />
      <div className={`relative ${container} py-24 sm:py-32 flex flex-col items-center text-center`}>
        <Eyebrow className="mb-6">Get started</Eyebrow>
        <h2
          ref={headRef}
          className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tightest leading-[1.08] text-slate-900 dark:text-white"
        >
          Ship your first audited{' '}
          <span className="relative inline-flex overflow-hidden align-bottom pb-[0.08em]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={KINDS[kind]}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
                className="inline-block text-accent"
              >
                {KINDS[kind]}
              </motion.span>
            </AnimatePresence>
          </span>{' '}
          contract today
        </h2>
        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
          <span className="font-mono text-slate-900 dark:text-white">3 audits · 30 XLM</span> starter bundle.
          Credits stack and never expire.
        </p>

        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#audit" className={btn.primary}>
            Audit a contract
            <ArrowRight className="w-4 h-4" />
          </a>
          {walletKey ? (
            <Link href="/dashboard" className={btn.secondary}>
              Go to dashboard
            </Link>
          ) : (
            <button type="button" onClick={handleConnect} disabled={connecting} className={btn.secondary}>
              <Wallet className="w-4 h-4" />
              {connecting ? 'Connecting…' : 'Connect Freighter'}
            </button>
          )}
        </Reveal>

        <ul className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 font-mono text-xs text-slate-500">
          <li>Non-custodial</li>
          <li>Zero key storage</li>
          <li>Stellar Protocol 22</li>
          <li>
            <a href="#reports" className="hover:text-accent transition-colors">
              Verified reports →
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
