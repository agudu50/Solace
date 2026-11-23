'use client';
import React, { useRef } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { Check, GitPullRequestArrow, ShieldCheck } from 'lucide-react';
import { EASE_OUT, useParallax, usePointerDepth } from '../landing/motion';

/**
 * Decorative 3D side panel for auth screens: a stack of audit cards floating
 * at different depths over a receding grid floor, leaning toward the cursor.
 */
export default function AuthShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y } = usePointerDepth(ref, { global: true });
  const rotateY = useTransform(x, [-0.5, 0.5], [-14, 6]);
  const rotateX = useTransform(y, [-0.5, 0.5], [16, 4]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative h-full min-h-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] text-slate-300"
    >
      {/* Glow + receding floor */}
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] rounded-[50%] bg-accent opacity-25 blur-[100px]" />
      <div className="absolute inset-x-[-30%] bottom-0 h-[55%] [perspective:500px]">
        <div className="absolute inset-0 origin-bottom [transform:rotateX(70deg)] grid-lines [mask-image:linear-gradient(to_top,#000_10%,transparent_85%)] opacity-80" />
      </div>

      {/* Copy */}
      <div className="relative z-10 p-8 xl:p-10">
        <p className="eyebrow inline-flex items-center gap-2 !text-slate-400">
          <span className="w-1.5 h-1.5 rounded-[1px] bg-accent" />
          Solace protocol
        </p>
        <h2 className="mt-4 text-3xl xl:text-4xl font-medium tracking-tightest leading-[1.08] text-white max-w-sm">
          Every audit, sealed on-chain.
        </h2>
        <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
          Sign in to run multi-model Soroban audits and anchor verifiable records to the Stellar ledger.
        </p>
      </div>

      {/* 3D card stack */}
      <div className="absolute inset-x-0 bottom-16 top-[38%] [perspective:1400px]">
        <motion.div
          style={{
            rotateX: reduce ? 10 : rotateX,
            rotateY: reduce ? -4 : rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="absolute left-1/2 top-1/2 w-[300px] h-[190px] -ml-[150px] -mt-[95px]"
        >
          <Layer x={x} y={y} z={-90} depth={8} offset={[-70, -70]} delay={0.5}>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <GitPullRequestArrow className="w-3.5 h-3.5 text-emerald-400" />
              Patch proposed · 3/3 models
            </div>
            <div className="mt-3 rounded-md bg-black/40 border border-white/5 font-mono text-[11px] leading-5 overflow-hidden">
              <div className="px-2.5 bg-emerald-500/10 text-emerald-300">+ from.require_auth();</div>
              <div className="px-2.5 bg-accent/15 text-[#fdda24]">- read(…).unwrap();</div>
            </div>
          </Layer>

          <Layer x={x} y={y} z={0} depth={16} offset={[0, 0]} delay={0.35} main>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-white">
                <span className="grid place-items-center w-7 h-7 rounded-md bg-accent text-slate-950">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                token_vault.rs
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">Action req.</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
              {[
                ['Risk', '82'],
                ['Issues', '3'],
                ['Consensus', '98%'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
                  <p className="mt-1 text-lg font-medium tabular-nums text-white">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                transition={{ duration: 1.4, delay: 0.9, ease: EASE_OUT }}
              />
            </div>
          </Layer>

          <Layer x={x} y={y} z={110} depth={28} offset={[90, 105]} delay={0.7} small>
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white leading-tight">Sealed on ledger</p>
                <p className="font-mono text-[10px] text-slate-500">#51,203,118</p>
              </div>
            </div>
          </Layer>
        </motion.div>
      </div>

      <p className="absolute bottom-6 inset-x-0 text-center font-mono text-[10px] uppercase tracking-wider text-slate-600">
        Zero key exposure · Ed25519 proof of ownership
      </p>
    </div>
  );
}

function Layer({
  children,
  x,
  y,
  z,
  depth,
  offset,
  delay,
  main = false,
  small = false,
}: {
  children: React.ReactNode;
  x: MotionValue<number>;
  y: MotionValue<number>;
  z: number;
  depth: number;
  offset: [number, number];
  delay: number;
  main?: boolean;
  small?: boolean;
}) {
  const reduce = useReducedMotion();
  const px = useParallax(x, depth);
  const py = useParallax(y, depth * 0.6);
  return (
    <motion.div
      className="absolute inset-0"
      style={{ x: px, y: py, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        initial={{ opacity: 0, z: z - 120 }}
        animate={reduce ? { opacity: 1, z } : { opacity: 1, z, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.8, delay, ease: EASE_OUT },
          z: { duration: 1.1, delay, ease: EASE_OUT },
          y: { duration: 6, delay: delay + 1, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ left: offset[0], top: offset[1] }}
        className={`absolute rounded-lg border bg-[#161616]/95 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ${
          main ? 'inset-0 border-white/15' : small ? 'w-52 border-white/10' : 'w-64 border-white/10'
        }`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
