'use client';
import React, { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SectionHeading, btn, codePanel, container } from './primitives';

interface Tab {
  id: string;
  label: string;
  heading: string;
  points: { title: string; body: string }[];
  cta: { label: string; href: string };
  visual: React.ReactNode;
}

const Row = ({ k, v, tone = 'text-slate-300' }: { k: string; v: string; tone?: string }) => (
  <div className="flex items-center justify-between gap-4 h-9 px-4 border-t border-white/5 first:border-t-0">
    <span className="text-slate-500">{k}</span>
    <span className={tone}>{v}</span>
  </div>
);

const TABS: Tab[] = [
  {
    id: 'analysis',
    label: 'Analysis',
    heading: 'Deterministic rules first, models second',
    points: [
      {
        title: 'AST invariant verification',
        body: 'Parses Soroban Rust into a syntax tree and checks every entrypoint for require_auth() coverage, caller spoofing and privilege escalation.',
      },
      {
        title: 'Multi-model remediation',
        body: 'Findings are cross-checked by several models with automatic failover, then turned into line-attributed Rust patches.',
      },
      {
        title: 'Panic and overflow guards',
        body: 'Flags naked unwrap() calls, unchecked arithmetic and gas-heavy loops before they become host traps on mainnet.',
      },
    ],
    cta: { label: 'Run the simulator', href: '#scanner' },
    visual: (
      <div className="text-xs">
        <div className="px-4 h-10 flex items-center border-b border-white/10 text-slate-500">engine.pass</div>
        <Row k="ast.parse" v="14 fns · 6 keys" />
        <Row k="rule.require_auth" v="1 violation" tone="text-accent" />
        <Row k="rule.unwrap" v="2 violations" tone="text-amber-400" />
        <Row k="rule.overflow" v="pass" tone="text-emerald-400" />
        <Row k="model.crosscheck" v="3 / 3 agree" />
        <Row k="patch.generate" v="3 diffs" />
      </div>
    ),
  },
  {
    id: 'storage',
    label: 'Storage & TTL',
    heading: 'Protocol 22 storage rent, accounted for',
    points: [
      {
        title: 'TTL boundary telemetry',
        body: 'Computes live time-to-live for persistent and instance entries so nothing is silently evicted.',
      },
      {
        title: 'extend_ttl() recommendations',
        body: 'Pinpoints the writes that need a bump and suggests thresholds that match your access pattern.',
      },
      {
        title: 'Storage class isolation',
        body: 'Separates persistent, temporary and instance keys and warns when critical state sits in the wrong class.',
      },
    ],
    cta: { label: 'Open the monitor', href: '/monitor' },
    visual: (
      <div className="text-xs">
        <div className="px-4 h-10 flex items-center border-b border-white/10 text-slate-500">ttl.snapshot · ledger 1,284,902</div>
        {[
          { key: 'Balance(from)', pct: 18, tone: 'bg-accent' },
          { key: 'Allowance', pct: 46, tone: 'bg-amber-400' },
          { key: 'Admin', pct: 88, tone: 'bg-emerald-400' },
          { key: 'Metadata', pct: 94, tone: 'bg-emerald-400' },
        ].map((r) => (
          <div key={r.key} className="px-4 py-3 border-t border-white/5 first:border-t-0">
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">{r.key}</span>
              <span className="text-slate-500">{r.pct}% TTL</span>
            </div>
            <div className="h-1 bg-white/10 rounded-sm">
              <div className={`h-1 rounded-sm ${r.tone}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'provenance',
    label: 'Provenance',
    heading: 'Every audit, anchored to the ledger',
    points: [
      {
        title: 'On-chain inscriptions',
        body: 'Risk score, bytecode hash and auditor signature are written to the solace_core contract in persistent storage.',
      },
      {
        title: 'Publicly verifiable',
        body: 'Anyone can query Stellar RPC or Stellar Expert to confirm a contract was audited. No PDFs to trust.',
      },
      {
        title: 'Prepaid, non-expiring credits',
        body: 'Bundles from 30 XLM. Credits stack and never expire, so you audit at your own pace.',
      },
    ],
    cta: { label: 'Browse verified reports', href: '#reports' },
    visual: (
      <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap">
        <span className="text-slate-500">{'// solace_core::anchor_audit'}</span>
        {'\n'}
        <span className="text-slate-300">{'{\n  contract_hash: '}</span>
        <span className="text-emerald-300">{'"e3b0c442…b855"'}</span>
        <span className="text-slate-300">{',\n  risk_score:    '}</span>
        <span className="text-[#f78c6c]">95</span>
        <span className="text-slate-300">{',\n  auditor:       '}</span>
        <span className="text-emerald-300">{'"GBWSB2…FDYPI"'}</span>
        <span className="text-slate-300">{',\n  network:       '}</span>
        <span className="text-emerald-300">{'"testnet"'}</span>
        <span className="text-slate-300">{'\n}'}</span>
        {'\n\n'}
        <span className="text-emerald-400">✓ confirmed</span>
        <span className="text-slate-500">{'  tx 7a8f3d…e21c'}</span>
      </pre>
    ),
  },
  {
    id: 'workflow',
    label: 'Workflow',
    heading: 'Fits the way your team already ships',
    points: [
      {
        title: 'GitHub Action',
        body: 'Audits each pull request touching Soroban crates, posts the risk delta and blocks merges on critical findings.',
      },
      {
        title: 'Non-custodial auth',
        body: 'Sign in with Freighter. Keys never leave the wallet and every inscription is signed by the auditor.',
      },
      {
        title: 'Testnet and mainnet',
        body: 'Switch networks in one click. Reports are scoped per network so staging never pollutes production.',
      },
    ],
    cta: { label: 'Open Audit Studio', href: '#audit' },
    visual: (
      <div className="text-xs">
        <div className="px-4 h-10 flex items-center justify-between border-b border-white/10 text-slate-500">
          <span>PR #142 · feat: add batch transfer</span>
          <span className="text-accent">changes requested</span>
        </div>
        <div className="p-4 font-sans text-[13px] text-slate-300 leading-relaxed">
          <p className="font-mono text-xs text-slate-500 mb-3">solace-bot commented</p>
          <p className="mb-3">
            Risk score rose <span className="text-accent font-mono">+27</span> (55 → 82). One critical finding blocks merge.
          </p>
        </div>
        <Row k="contracts/token/src/lib.rs:88" v="CRIT require_auth" tone="text-accent" />
        <Row k="contracts/token/src/lib.rs:91" v="HIGH unwrap" tone="text-amber-400" />
        <Row k="suggested patches" v="2 attached" />
        <Row k="signed by" v="GBWSB2…FDYPI" />
      </div>
    ),
  },
];

export default function FeaturesSection() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tab = TABS[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setActive((a) => (a + 1) % TABS.length);
    if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + TABS.length) % TABS.length);
  };

  return (
    <section id="features" className="w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10">
      <div className={container}>
        <SectionHeading
          eyebrow="Platform"
          title="Security tooling that understands Soroban"
          description="Generic linters miss what makes Stellar contracts different. Solace is built around auth invariants, storage rent and ledger provenance."
        />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Solace capabilities"
          onKeyDown={onKeyDown}
          className="flex gap-6 sm:gap-8 border-b border-slate-200 dark:border-white/10 overflow-x-auto"
        >
          {TABS.map((t, i) => {
            const selected = i === active;
            return (
              <button
                key={t.id}
                id={`${baseId}-tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={`relative shrink-0 pb-4 text-sm sm:text-[15px] transition-colors cursor-pointer ${
                  selected
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="font-mono text-xs mr-2 text-slate-400">0{i + 1}</span>
                {t.label}
                {selected && (
                  <motion.span
                    layoutId="features-tab-underline"
                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            id={`${baseId}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pt-10 sm:pt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16"
          >
            <div className="lg:col-span-5">
              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white mb-8">
                {tab.heading}
              </h3>
              <ul className="divide-y divide-slate-200 dark:divide-white/10 border-y border-slate-200 dark:border-white/10">
                {tab.points.map((p) => (
                  <li key={p.title} className="py-5">
                    <h4 className="text-[15px] font-medium text-slate-900 dark:text-white mb-1.5">{p.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{p.body}</p>
                  </li>
                ))}
              </ul>
              <a href={tab.cta.href} className={`${btn.link} mt-6`}>
                {tab.cta.label}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="lg:col-span-7">
              <div className={`${codePanel} overflow-hidden min-h-[280px]`}>{tab.visual}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
