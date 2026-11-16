'use client';
import React, { useEffect, useId, useState } from 'react';
import { Check, Copy, Wallet } from 'lucide-react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { Depth, EASE_OUT, TiltCard } from '../landing/motion';

/** Circular score meter that sweeps and counts up to `value`. */
export function ScoreRing({
  value,
  size = 72,
  color = 'var(--e-global-color-accent)',
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return setN(value);
    const c = animate(0, value, { duration: 1.2, delay: 0.3, ease: EASE_OUT, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, reduce]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `Score ${value} of 100`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r="27" fill="none" strokeWidth="5" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? value / 100 : 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE_OUT }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-medium tabular-nums text-slate-900 dark:text-white">
        {n}
      </span>
    </div>
  );
}

/** Self-drawing line + area for a series of 0–100 scores (oldest first). */
export function Sparkline({ points, className = '' }: { points: number[]; className?: string }) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const series = points.length >= 2 ? points : [points[0] ?? 0, points[0] ?? 0];
  const W = 200;
  const H = 56;
  const step = W / (series.length - 1);
  const xy = series.map((v, i) => [i * step, H - 4 - (Math.max(0, Math.min(100, v)) / 100) * (H - 8)] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const [lx, ly] = xy[xy.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`w-full h-full overflow-visible ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--e-global-color-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--e-global-color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#spark-${id})`}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--e-global-color-accent)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: EASE_OUT }}
      />
      <motion.circle
        cx={lx}
        cy={ly}
        r="3"
        fill="var(--e-global-color-accent)"
        vectorEffect="non-scaling-stroke"
        initial={{ scale: reduce ? 1 : 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.6 }}
      />
    </svg>
  );
}

/**
 * The connected signer as a physical card: tilts toward the cursor with a
 * moving glare, and its contents float at different depths.
 */
export function WalletCard3D({
  address,
  copied,
  onCopy,
  network,
}: {
  address: string;
  copied: boolean;
  onCopy: () => void;
  network: string;
}) {
  return (
    <TiltCard max={14} className="w-full">
      {/* No overflow-hidden here: it would flatten the 3D context and kill the depth layers. */}
      <div className="relative aspect-[1.7/1] rounded-xl bg-accent text-white shadow-[0_30px_60px_-25px_rgb(var(--e-global-color-accent-rgb)/0.7)] [transform-style:preserve-3d]">
        {/* Surface texture, clipped on its own layer */}
        <div aria-hidden className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_70%)]" />
          <div className="absolute -right-16 -bottom-20 w-56 h-56 rounded-full bg-black/25 blur-2xl" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-5 [transform-style:preserve-3d]">
          <Depth z={30} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-white/80">
              <Wallet className="w-4 h-4" />
              Stellar signer
            </span>
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-white/15 border border-white/20 font-mono text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {network}
            </span>
          </Depth>

          <Depth z={20}>
            <div aria-hidden className="w-10 h-7 rounded-[5px] bg-gradient-to-br from-amber-200 to-amber-400/80 border border-white/30 shadow-inner" />
          </Depth>

          <Depth z={45} className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/70">Public key</p>
              <p className="mt-1 font-mono text-lg sm:text-xl tracking-tight truncate" title={address}>
                {address.slice(0, 6)}…{address.slice(-6)}
              </p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] transition-colors cursor-pointer shrink-0"
              aria-label="Copy wallet address"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </Depth>
        </div>
      </div>
    </TiltCard>
  );
}
