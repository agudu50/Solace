import React from 'react';
import { Reveal, SplitWords } from './motion';

/**
 * Shared marketing primitives for the landing page.
 * Flat surfaces, hairline borders, mono eyebrow labels, small radii.
 */

export const container = 'w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0e0e0e] disabled:opacity-50 cursor-pointer',
  secondary:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 cursor-pointer',
  link:
    'inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent transition-colors cursor-pointer',
};

/** Hairline card surface. */
export const panel =
  'rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616]';

/** Dark code/terminal surface, identical in both themes. */
export const codePanel =
  'rounded-lg border border-slate-800 dark:border-white/10 bg-[#121212] text-slate-300 font-mono';

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`eyebrow inline-flex items-center gap-2 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-[1px] bg-accent" aria-hidden />
      {children}
    </span>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
  children,
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';
  return (
    <Reveal className={`flex flex-col ${alignment} max-w-3xl mb-12 sm:mb-16 ${className}`}>
      <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
      <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-medium tracking-tightest leading-[1.05] text-slate-900 dark:text-white">
        {typeof title === 'string' ? <SplitWords text={title} inView stagger={0.04} /> : title}
      </h2>
      {description && (
        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
      {children}
    </Reveal>
  );
}
