import React from 'react';
import { container } from './primitives';

/**
 * Ecosystem strip: the stack Solace is built on and verifies against.
 * Rendered as mono wordmarks rather than borrowed logos.
 */
const STACK = ['Stellar', 'Soroban', 'Freighter', 'Stellar RPC', 'Stellar Expert', 'Rust · WASM'];

export default function StatsSection() {
  return (
    <section className="w-full border-b border-slate-200 dark:border-white/10">
      <div className={`${container} py-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12`}>
        <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0 lg:max-w-[14rem]">
          Built natively for the Stellar smart contract stack.
        </p>
        <ul className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-6">
          {STACK.map((name) => (
            <li
              key={name}
              className="font-mono text-sm sm:text-[15px] tracking-tight text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
