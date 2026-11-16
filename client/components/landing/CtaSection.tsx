'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { Eyebrow, btn, container } from './primitives';

export default function CtaSection() {
  const { walletKey, connect, connecting } = useWallet();

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
        <h2 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tightest leading-[1.03] text-slate-900 dark:text-white">
          Ship your first audited contract today
        </h2>
        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
          <span className="font-mono text-slate-900 dark:text-white">3 audits · 30 XLM</span> starter bundle.
          Credits stack and never expire.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
        </div>

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
