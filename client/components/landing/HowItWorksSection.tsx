'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeading, btn, container } from './primitives';
import { Depth, EASE_OUT, TiltCard } from './motion';

const STEPS = [
  {
    n: '01',
    title: 'Ingest and parse',
    body: 'Paste Rust source or a deployed contract ID. Solace fetches WASM from Stellar RPC when needed, hashes the bytecode and builds a syntax tree of every entrypoint and storage key.',
    code: 'parse  token.rs\n→ 14 entrypoints\n→ sha256 e3b0c442…b855',
  },
  {
    n: '02',
    title: 'Scan and remediate',
    body: 'Deterministic rules check auth, TTL and panic invariants. Multiple models cross-check the findings and draft line-attributed patches you can apply directly.',
    code: 'rule   require_auth  ✗ L3\nmodel  3/3 agree\npatch  3 diffs ready',
  },
  {
    n: '03',
    title: 'Anchor on-chain',
    body: 'Sign with Freighter to write the score, hash and signature to solace_core. One prepaid credit is consumed and the record becomes publicly verifiable.',
    code: 'anchor solace_core\n→ credit 1 / 9 used\n→ tx 7a8f3d… confirmed',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10">
      <div className={container}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <SectionHeading
            eyebrow="How it works"
            title="From source to signed record in under 30 seconds"
            className="mb-0 sm:mb-0"
          />
          <a href="#audit" className={`${btn.secondary} shrink-0 self-start lg:self-auto`}>
            Start an audit
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <ol className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: EASE_OUT, when: 'beforeChildren', staggerChildren: 0.22 } },
              }}
              className="group flex"
            >
              <TiltCard className="flex-1" max={7}>
              <div className="flex flex-col h-full p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] transition-colors group-hover:border-slate-300 dark:group-hover:border-white/20 [transform-style:preserve-3d]">
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{s.body}</p>
              <Depth z={40} className="mt-8">
              <div className="p-4 rounded-md bg-slate-50 dark:bg-[#0e0e0e] border border-slate-200 dark:border-white/10 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400 transition-colors group-hover:border-slate-300 dark:group-hover:border-white/20">
                {s.code.split('\n').map((line) => (
                  <motion.div
                    key={line}
                    variants={{ hidden: { opacity: 0, x: -4 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } } }}
                    className="whitespace-pre-wrap"
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
              </Depth>
              </div>
              </TiltCard>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
