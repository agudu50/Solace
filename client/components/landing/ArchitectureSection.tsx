'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { SectionHeading, btn, container, panel } from './primitives';
import { EASE_OUT, Reveal, useActive } from './motion';

const LAYERS = [
  {
    tag: 'Auth',
    title: 'Freighter keypair',
    body: 'Auditors sign in non-custodially. Keys never leave the wallet and every inscription carries the auditor signature.',
  },
  {
    tag: 'Engine',
    title: 'AST + multi-model',
    body: 'A dual-pass engine evaluates auth invariants and storage rent, then drafts remediations validated against the rules.',
  },
  {
    tag: 'Core',
    title: 'solace_core contract',
    body: 'A deployed Rust contract stores audit records in persistent storage, funded by prepaid credit bundles.',
  },
  {
    tag: 'Verify',
    title: 'Public ledger',
    body: 'Anyone can query Stellar RPC to inspect proofs, bytecode hashes and scores. No central party to trust.',
  },
];

interface LogRow {
  id: number;
  time: string;
  event: string;
  subject: string;
  score: number | null;
  ok: boolean;
}

const SEED: Omit<LogRow, 'id' | 'time'>[] = [
  { event: 'audit.anchored', subject: 'CBQ7…K2LM', score: 95, ok: true },
  { event: 'audit.anchored', subject: 'CDX4…9PQA', score: 71, ok: true },
  { event: 'audit.flagged', subject: 'CA3N…TT8E', score: 38, ok: false },
  { event: 'credits.purchased', subject: 'GBWS…DYPI', score: null, ok: true },
  { event: 'audit.anchored', subject: 'CCJ2…W0RS', score: 88, ok: true },
  { event: 'audit.anchored', subject: 'CF81…ZQ3D', score: 92, ok: true },
  { event: 'audit.flagged', subject: 'CB0D…M4NX', score: 44, ok: false },
  { event: 'report.verified', subject: 'CDX4…9PQA', score: 71, ok: true },
];

const VISIBLE_ROWS = 5;
const BASE_SECONDS = 14 * 3600 + 2 * 60 + 11; // 14:02:11

const fmt = (sec: number) =>
  [Math.floor(sec / 3600) % 24, Math.floor(sec / 60) % 60, sec % 60].map((n) => String(n).padStart(2, '0')).join(':');

// Newest first; deterministic so server and client render the same initial rows.
const initialRows = (): LogRow[] =>
  SEED.slice(0, VISIBLE_ROWS).map((r, i) => ({ ...r, id: i, time: fmt(BASE_SECONDS - i * 217) }));

export default function ArchitectureSection() {
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<LogRow[]>(initialRows);
  const logRef = useRef<HTMLDivElement>(null);
  const live = useActive(logRef);
  const reduce = useReducedMotion();

  // Stream a new ledger event in at the top every few seconds while visible.
  useEffect(() => {
    if (!live || reduce) return;
    const t = setInterval(() => {
      setRows((prev) => {
        const id = prev[0].id + 1;
        const seed = SEED[id % SEED.length];
        const [h, m, sec] = prev[0].time.split(':').map(Number);
        const time = fmt(h * 3600 + m * 60 + sec + 23 + (id % 5) * 9);
        return [{ ...seed, id, time }, ...prev].slice(0, VISIBLE_ROWS);
      });
    }, 3200);
    return () => clearInterval(t);
  }, [live, reduce]);
  const contractId = 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

  const handleCopy = () => {
    navigator.clipboard.writeText(contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="architecture" className="w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10">
      <div className={container}>
        <SectionHeading
          eyebrow="Architecture"
          title="Provenance you can verify, not just read"
          description="Most security tools hand you a PDF. Solace seals findings into Soroban persistent storage so wallets, launchpads and indexers can check a contract before they touch it."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Layers */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 content-start">
            {LAYERS.map((l, i) => (
              <Reveal key={l.tag} delay={i * 0.08} className="border-t border-slate-200 dark:border-white/10 pt-5">
                <span className="eyebrow">{l.tag}</span>
                <h3 className="mt-3 text-base font-medium text-slate-900 dark:text-white">{l.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{l.body}</p>
              </Reveal>
            ))}
          </div>

          {/* Ledger log mockup */}
          <Reveal delay={0.1} className={`lg:col-span-7 ${panel} overflow-hidden`}>
            <div ref={logRef}>
            <div className="flex items-center justify-between px-4 sm:px-5 h-11 border-b border-slate-200 dark:border-white/10">
              <span className="text-sm font-medium text-slate-900 dark:text-white">Ledger activity</span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 animate-ping-soft motion-reduce:hidden" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                live · testnet
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-white/10">
                    <th className="font-normal px-4 sm:px-5 py-2.5">Time</th>
                    <th className="font-normal px-4 py-2.5">Event</th>
                    <th className="font-normal px-4 py-2.5">Subject</th>
                    <th className="font-normal px-4 sm:px-5 py-2.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        layout
                        initial={{ opacity: 0, backgroundColor: 'rgba(200, 5, 82, 0.08)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(200, 5, 82, 0)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE_OUT, backgroundColor: { duration: 1.6 } }}
                        className="border-b last:border-b-0 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300"
                      >
                        <td className="px-4 sm:px-5 py-3 text-slate-500 tabular-nums">{row.time}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-[1px] ${row.ok ? 'bg-emerald-500' : 'bg-accent'}`} />
                            {row.event}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.subject}</td>
                        <td className="px-4 sm:px-5 py-3 text-right tabular-nums">
                          {row.score === null ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className={row.score < 50 ? 'text-accent' : ''}>{row.score}</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            </div>
          </Reveal>
        </div>

        {/* Contract bar */}
        <div className={`mt-10 ${panel} p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
          <div className="min-w-0">
            <span className="eyebrow">Deployed contract · Stellar testnet</span>
            <p className="mt-1.5 font-mono text-xs sm:text-sm text-slate-900 dark:text-white break-all">{contractId}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={handleCopy} className={`${btn.secondary} h-9`}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy ID'}
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn.secondary} h-9`}
            >
              Stellar Expert
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
