'use client';
import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '../landing/motion';

/* ------------------------------------------------------------------ */
/* Surfaces: a white tray holding softer inner tiles                    */
/* ------------------------------------------------------------------ */

export function Tray({
  children,
  className = '',
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 + index * 0.06, ease: EASE_OUT }}
      className={`rounded-[18px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-1.5 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/** Inner card. `flat` drops the fill for content that sits directly on the tray. */
export function Tile({ children, className = '', flat = false }: { children: React.ReactNode; className?: string; flat?: boolean }) {
  return (
    <div
      className={`rounded-[14px] ${
        flat ? '' : 'border border-slate-200/70 dark:border-white/[0.07] bg-[#fafaf9] dark:bg-[#1a1a1a]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function TileHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
      <h2 className="text-[15px] font-medium tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {action}
    </div>
  );
}

export function ViewAll({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center h-7 px-3 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

/** Fine vertical hatching, used as a texture on tracks and empty segments. */
export const hatch =
  '[background-image:repeating-linear-gradient(90deg,rgb(148_163_184/0.35)_0_1px,transparent_1px_5px)] dark:[background-image:repeating-linear-gradient(90deg,rgb(255_255_255/0.12)_0_1px,transparent_1px_5px)]';

/* ------------------------------------------------------------------ */
/* Severity bar: proportional blocks                                    */
/* ------------------------------------------------------------------ */

export interface SeverityCounts {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

const SEV_STYLE: Record<keyof SeverityCounts, { label: string; cls: string }> = {
  CRITICAL: { label: 'Critical', cls: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' },
  HIGH: { label: 'High', cls: 'bg-accent text-white' },
  MEDIUM: { label: 'Medium', cls: 'bg-slate-200 text-slate-800 dark:bg-white/15 dark:text-slate-100' },
  LOW: { label: 'Low', cls: `bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300 ${hatch}` },
};

export function SeverityBar({ counts }: { counts: SeverityCounts }) {
  const reduce = useReducedMotion();
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  const total = order.reduce((n, k) => n + counts[k], 0);

  if (total === 0) {
    return (
      <div className={`h-12 rounded-xl border border-dashed border-slate-300 dark:border-white/15 grid place-items-center text-xs text-slate-500 ${hatch}`}>
        No findings in this scope
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 h-12" role="list" aria-label="Findings by severity">
      {order
        .filter((k) => counts[k] > 0)
        .map((k, i) => (
          <motion.div
            key={k}
            role="listitem"
            initial={{ flexGrow: reduce ? counts[k] : 0.0001, opacity: 0 }}
            animate={{ flexGrow: counts[k], opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: EASE_OUT }}
            // 4 blocks × 64px still fits a 320px phone; labels shrink below sm.
            style={{ flexBasis: 0, minWidth: 64 }}
            className={`rounded-xl grid place-items-center px-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap overflow-hidden ${SEV_STYLE[k].cls}`}
          >
            {counts[k]} {SEV_STYLE[k].label}
          </motion.div>
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Score strip: every audit placed on a 0–100 track                     */
/* ------------------------------------------------------------------ */

export function ScoreStrip({ items }: { items: { id: string; score: number; label: string; secure: boolean }[] }) {
  const reduce = useReducedMotion();
  const avg = items.length ? Math.round(items.reduce((n, x) => n + x.score, 0) / items.length) : null;

  return (
    <div>
      <div className={`relative h-14 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.07] ${hatch}`}>
        {/* Bands: risk zones */}
        <div aria-hidden className="absolute inset-y-0 left-[70%] right-0 rounded-r-xl bg-accent/[0.06]" />
        {avg !== null && (
          <motion.div
            initial={{ left: reduce ? `${avg}%` : '0%', opacity: 0 }}
            animate={{ left: `${avg}%`, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_OUT }}
            className="absolute -top-3 -translate-x-1/2 z-10"
          >
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-medium whitespace-nowrap shadow-sm">
              Avg {avg}
            </span>
          </motion.div>
        )}
        {items.map((it, i) => (
          <motion.span
            key={it.id}
            title={`${it.label}: ${it.score}/100`}
            initial={{ left: reduce ? `${it.score}%` : '0%', opacity: 0 }}
            animate={{ left: `${it.score}%`, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.3 + i * 0.05, ease: EASE_OUT }}
            className={`absolute top-1/2 w-2.5 h-2.5 -ml-[5px] rounded-full ring-2 ring-white dark:ring-[#1a1a1a] ${it.secure ? 'bg-emerald-500' : 'bg-accent'}`}
            style={{ marginTop: (i % 3) * 8 - 13 }}
          />
        ))}
        {items.length === 0 && (
          <span className="absolute inset-0 grid place-items-center text-xs text-slate-500">Run an audit to plot scores</span>
        )}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
        {[0, 25, 50, 75, 100].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surface gauge: half donut in accent tints                            */
/* ------------------------------------------------------------------ */

const TINTS = [1, 0.62, 0.38, 0.22, 0.13, 0.07];

export function SurfaceGauge({
  segments,
  centerLabel,
}: {
  segments: { label: string; value: number }[];
  centerLabel: string;
}) {
  const reduce = useReducedMotion();
  const total = segments.reduce((n, s) => n + s.value, 0);
  const R = 80;
  const C = Math.PI * R; // half circumference
  const GAP = 4;
  let start = 0;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[280px] [perspective:600px]">
        <motion.svg
          viewBox="0 0 200 112"
          className="w-full"
          aria-hidden
          initial={{ rotateX: reduce ? 0 : 35, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        >
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" strokeWidth="26" className="stroke-slate-100 dark:stroke-white/[0.06]" />
          {total > 0 &&
            segments.map((s, i) => {
              const len = (s.value / total) * C;
              const seg = Math.max(0, len - (i < segments.length - 1 ? GAP : 0));
              const offset = -start;
              start += len;
              if (s.value === 0) return null;
              return (
                <motion.path
                  key={s.label}
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  strokeWidth="26"
                  style={{ stroke: `rgb(var(--e-global-color-accent-rgb) / ${TINTS[i] ?? 0.07})` }}
                  strokeDashoffset={offset}
                  initial={{ strokeDasharray: reduce ? `${seg} ${C * 2}` : `0 ${C * 2}` }}
                  animate={{ strokeDasharray: `${seg} ${C * 2}` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: EASE_OUT }}
                />
              );
            })}
        </motion.svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-3xl font-medium tabular-nums tracking-tight text-slate-900 dark:text-white leading-none">{total}</p>
          <p className="mt-1 text-xs text-slate-500">{centerLabel}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span
              className="w-3.5 h-3.5 rounded-[4px] shrink-0"
              style={{ background: `rgb(var(--e-global-color-accent-rgb) / ${TINTS[i] ?? 0.07})` }}
            />
            <span className="text-slate-600 dark:text-slate-400 flex-1">{s.label}</span>
            <span className="tabular-nums text-slate-900 dark:text-white">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feed column: items with a coloured leading edge                      */
/* ------------------------------------------------------------------ */

export interface FeedItem {
  id: string;
  title: string;
  meta: React.ReactNode;
  tone: 'ink' | 'accent' | 'amber' | 'emerald' | 'sky' | 'slate';
  href?: string;
}

const EDGE: Record<FeedItem['tone'], string> = {
  ink: 'border-slate-900 dark:border-white',
  accent: 'border-accent',
  amber: 'border-amber-400',
  emerald: 'border-emerald-500',
  sky: 'border-sky-500',
  slate: 'border-slate-300 dark:border-white/20',
};

export function FeedList({ items, empty }: { items: FeedItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="px-4 sm:px-5 py-8 text-xs text-slate-500">{empty}</p>;
  }
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } } }}
      className="px-4 sm:px-5 pb-4 divide-y divide-slate-200/70 dark:divide-white/[0.07]"
    >
      {items.map((it) => {
        const body = (
          <div className={`pl-3 border-l-2 ${EDGE[it.tone]}`}>
            <p className="text-sm text-slate-900 dark:text-white truncate group-hover:text-accent transition-colors">{it.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">{it.meta}</p>
          </div>
        );
        return (
          <motion.li
            key={it.id}
            variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } } }}
            className="py-3"
          >
            {it.href ? (
              <Link href={it.href} className="group block">
                {body}
              </Link>
            ) : (
              body
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
