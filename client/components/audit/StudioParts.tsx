'use client';
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Coins, type LucideIcon } from 'lucide-react';
import { Depth, EASE_OUT, TiltCard } from '../landing/motion';

/* ------------------------------------------------------------------ */
/* Segmented control with a sliding highlight                          */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
  dark = false,
  label,
}: {
  /** Unique per instance; drives the shared-layout highlight. */
  id: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  dark?: boolean;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`relative inline-flex p-0.5 rounded-md border shrink-0 ${
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'
      }`}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            className={`relative inline-flex items-center gap-1.5 px-2.5 h-7 text-xs rounded-[4px] whitespace-nowrap transition-colors cursor-pointer ${
              selected
                ? dark
                  ? 'text-white'
                  : 'text-slate-900 dark:text-white'
                : dark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className={`absolute inset-0 rounded-[4px] border ${
                  dark ? 'bg-white/10 border-white/10' : 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 shadow-xs'
                }`}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audit pipeline: shown above the editor while an audit runs          */
/* ------------------------------------------------------------------ */

const STAGES = ['Hash bytecode', 'Reserve credit', 'Multi-model analysis', 'Consensus'];

/**
 * Maps the page's coarse `auditStep` text onto four stages. The two server-side
 * stages advance on a timer since the API reports nothing until it returns.
 */
export function useAuditStage(loading: boolean, step: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!loading) return setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, [loading]);

  if (!loading) return -1;
  const s = step.toLowerCase();
  if (s.includes('hash')) return 0;
  if (s.includes('deduct') || s.includes('credit')) return elapsed > 1500 ? 2 : 1;
  return elapsed > 4500 ? 3 : 2;
}

export function AuditPipeline({ stage }: { stage: number }) {
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/10 text-[11px]">
      {STAGES.map((label, i) => {
        const state = i < stage ? 'done' : i === stage ? 'run' : 'wait';
        return (
          <li
            key={label}
            className={`relative flex items-center gap-2 px-3 h-9 border-white/10 ${i % 2 === 1 ? 'border-l' : ''} ${
              i >= 2 ? 'border-t sm:border-t-0' : ''
            } sm:border-l sm:first:border-l-0`}
          >
            <span
              className={`grid place-items-center w-4 h-4 rounded-[4px] border transition-colors duration-300 ${
                state === 'done'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : state === 'run'
                  ? 'border-accent/60 bg-accent/20'
                  : 'border-white/10'
              }`}
            >
              {state === 'done' ? (
                <Check className="w-2.5 h-2.5" />
              ) : state === 'run' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping-soft" />
              ) : null}
            </span>
            <span className={`truncate ${state === 'wait' ? 'text-slate-500' : 'text-slate-200'}`}>{label}</span>
            {state === 'run' && (
              <motion.span
                layoutId="pipeline-run"
                className="absolute inset-x-0 bottom-0 h-px bg-accent"
                transition={{ duration: 0.3, ease: EASE_OUT }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Orbiting rings: idle / working indicator                            */
/* ------------------------------------------------------------------ */

export function Orb({ active, children }: { active: boolean; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const spin = active && !reduce;
  return (
    <div className="relative w-28 h-28 mx-auto [perspective:420px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full border ${active ? 'border-accent/50' : 'border-slate-300 dark:border-white/10'}`}
          style={{ inset: i * 14, transformStyle: 'preserve-3d' }}
          initial={{ rotateX: 62, rotateZ: 0 }}
          animate={spin ? { rotateX: 62, rotateZ: i % 2 ? -360 : 360 } : { rotateX: 62, rotateZ: 0 }}
          transition={spin ? { rotateZ: { duration: 3 + i, repeat: Infinity, ease: 'linear' } } : { duration: 0.6 }}
        >
          {spin && (
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--e-global-color-accent)]" />
          )}
        </motion.div>
      ))}
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Consensus triad: three models converging on one verdict              */
/* ------------------------------------------------------------------ */

export function ConsensusTriad({
  agreement,
  level,
  models,
}: {
  agreement: number;
  level: string;
  models: { name: string; live: boolean; color: string }[];
}) {
  const reduce = useReducedMotion();
  // 240×130 box: three models across the top converge on the verdict below.
  const W = 240;
  const H = 130;
  const pts = [
    { x: 40, y: 34 },
    { x: 120, y: 34 },
    { x: 200, y: 34 },
  ];
  const c = { x: 120, y: 102 };

  return (
    <div className="relative mx-auto w-full max-w-[340px]" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={p.x} y1={p.y} x2={c.x} y2={c.y} className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />
            <motion.line
              x1={p.x}
              y1={p.y}
              x2={c.x}
              y2={c.y}
              stroke={models[i]?.color}
              strokeWidth="1.5"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.15, ease: EASE_OUT }}
            />
            <circle cx={p.x} cy={p.y} r="4" fill={models[i]?.color} />
            {!reduce && (
              <motion.circle
                r="2"
                fill={models[i]?.color}
                initial={{ cx: p.x, cy: p.y, opacity: 0 }}
                animate={{ cx: [p.x, c.x], cy: [p.y, c.y], opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, delay: 1 + i * 0.35, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              />
            )}
          </g>
        ))}
        <motion.circle
          cx={c.x}
          cy={c.y}
          r="24"
          className="fill-white dark:fill-[#1c1c1c]"
          stroke="var(--e-global-color-accent)"
          strokeWidth="1.5"
          initial={{ scale: reduce ? 1 : 0.6, opacity: reduce ? 1 : 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ transformOrigin: `${c.x}px ${c.y}px` }}
          transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
        />
      </svg>

      {/* HTML labels positioned in the same coordinate space keep text crisp */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%` }}
        >
          <p className="text-sm font-medium tabular-nums text-slate-900 dark:text-white leading-none">{agreement}%</p>
          <p className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-slate-500">{level}</p>
        </div>
        {models.map((m, i) => (
          <span
            key={m.name}
            className="absolute -translate-x-1/2 text-center whitespace-nowrap leading-tight"
            style={{ left: `${(pts[i].x / W) * 100}%`, top: 0 }}
          >
            <span className="block text-[11px] text-slate-700 dark:text-slate-300">{m.name}</span>
            <span className={`block font-mono text-[9px] uppercase ${m.live ? 'text-emerald-500' : 'text-amber-500'}`}>
              {m.live ? 'live' : 'preview'}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Credit bundle cards (3D)                                             */
/* ------------------------------------------------------------------ */

export function CreditPackages({ onBuy }: { onBuy: (pkgId: number) => void }) {
  const PKGS = [
    { id: 1, name: 'Starter', price: 30, audits: 3, note: 'Good for MVPs and hackathon builds.' },
    { id: 2, name: 'Growth', price: 60, audits: 6, note: 'Priority Gemini Flash engine.', featured: true },
    { id: 3, name: 'Professional', price: 90, audits: 9, note: 'Auditor multi-sig proof inscriptions.' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PKGS.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 16, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
          style={{ transformPerspective: 900 }}
        >
          <TiltCard max={8} className="h-full">
            <div
              className={`relative h-full flex flex-col rounded-lg border p-5 bg-white dark:bg-[#161616] [transform-style:preserve-3d] ${
                p.featured ? 'border-accent shadow-[0_24px_60px_-30px_rgb(var(--e-global-color-accent-rgb)/0.6)]' : 'border-slate-200 dark:border-white/10'
              }`}
            >
              {p.featured && (
                <span className="absolute -top-2.5 right-4 px-2 h-5 inline-flex items-center rounded-md bg-accent text-white font-mono text-[10px] uppercase tracking-wider">
                  Best value
                </span>
              )}
              <Depth z={20}>
                <p className="eyebrow">{p.name}</p>
                <p className="mt-3 text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                  {p.price} <span className="text-base text-slate-500">XLM</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.audits} audits · never expires
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{p.note}</p>
              </Depth>
              <Depth z={30} className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => onBuy(p.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    p.featured
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Buy {p.name}
                </button>
              </Depth>
            </div>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-1.5 text-lg font-medium tracking-tight tabular-nums ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</dd>
    </div>
  );
}

export function SectionLabel({ icon: Icon, children, aside }: { icon?: LucideIcon; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 dark:text-white">
        {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
        {children}
      </span>
      {aside}
    </div>
  );
}
