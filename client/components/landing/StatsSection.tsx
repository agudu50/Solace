import React from 'react';
import { container } from './primitives';

/**
 * Ecosystem marquee: the stack Solace is built on and verifies against,
 * rendered as mono wordmarks. Loops infinitely, pauses on hover and is static
 * for reduced-motion users.
 */
const STACK = [
  'Stellar',
  'Soroban',
  'Freighter',
  'Stellar RPC',
  'Stellar Expert',
  'Rust · WASM',
  'Protocol 22',
  'Horizon',
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {STACK.map((name) => (
        <li
          key={name}
          className="flex items-center gap-3 px-8 sm:px-10 h-16 border-r border-slate-200 dark:border-white/10 font-mono text-sm sm:text-[15px] tracking-tight whitespace-nowrap text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-[1px] bg-current opacity-60" aria-hidden />
          {name}
        </li>
      ))}
    </ul>
  );
}

export default function StatsSection() {
  return (
    <section className="w-full border-b border-slate-200 dark:border-white/10" aria-label="Built on the Stellar stack">
      <div className={`${container} pt-10 pb-4`}>
        <p className="eyebrow">Built natively for the Stellar smart contract stack</p>
      </div>
      <div className="group relative overflow-hidden border-t border-slate-200 dark:border-white/10">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Track />
          <Track hidden />
        </div>
      </div>
    </section>
  );
}
