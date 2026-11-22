'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT } from '../landing/motion';

/**
 * App surface, matching the dashboard: a white tray holding a softer inner
 * card, plus a cursor-following accent spotlight (CSS variables only, no
 * re-renders) and a blur-up entrance.
 */
export function Panel({
  children,
  className = '',
  index = 0,
  as = 'section',
}: {
  children: React.ReactNode;
  className?: string;
  /** Entrance order; staggers the reveal. */
  index?: number;
  as?: 'section' | 'div';
}) {
  const Comp = motion[as];
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  };

  return (
    <Comp
      onPointerMove={onPointerMove}
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ duration: 0.7, delay: 0.08 + index * 0.07, ease: EASE_OUT }}
      className={`group/panel relative rounded-[18px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-1.5 ${className}`}
    >
      <div className="relative h-full flex flex-col rounded-[14px] border border-slate-200/70 dark:border-white/[0.07] bg-[#fafaf9] dark:bg-[#1a1a1a] overflow-hidden transition-colors group-hover/panel:border-slate-300/80 dark:group-hover/panel:border-white/[0.12]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/panel:opacity-100"
          style={{
            background:
              'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(var(--e-global-color-accent-rgb) / 0.06), transparent 45%)',
          }}
        />
        <div className="relative h-full flex flex-col">{children}</div>
      </div>
    </Comp>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-4 sm:px-5 pt-4 sm:pt-5 pb-4">
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{eyebrow}</p>
        <h2 className="mt-0.5 text-[15px] font-medium tracking-tight text-slate-900 dark:text-white leading-snug">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Small status chip with a tone dot. */
export function Chip({
  tone = 'neutral',
  children,
  pulse = false,
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';
  children: React.ReactNode;
  pulse?: boolean;
}) {
  const dot = {
    neutral: 'bg-slate-400',
    ok: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500',
    accent: 'bg-accent',
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] font-mono text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <span className="relative flex w-1.5 h-1.5">
        {pulse && <span className={`absolute inline-flex w-full h-full rounded-full ${dot} animate-ping-soft`} />}
        <span className={`relative w-1.5 h-1.5 rounded-full ${dot}`} />
      </span>
      {children}
    </span>
  );
}
