'use client';
import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { EASE_OUT, usePointerDepth } from '../landing/motion';

interface DeckItem {
  hash: string;
  contract: string;
  riskScore: number;
  isSecure: boolean;
  date?: string;
}

/**
 * The latest reports as a fanned 3D stack. The stack leans toward the cursor;
 * hovering a card lifts it out of the deck, clicking opens that report.
 */
export default function ReportDeck3D({ items, onOpen }: { items: DeckItem[]; onOpen: (hash: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y } = usePointerDepth(ref);
  const rotateY = useTransform(x, [-0.5, 0.5], [-22, -6]);
  const rotateX = useTransform(y, [-0.5, 0.5], [18, 6]);
  const [hover, setHover] = useState<number | null>(null);
  const deck = items.slice(0, 3);

  if (deck.length === 0) return null;

  return (
    <div ref={ref} className="relative h-[230px] w-[340px] [perspective:1200px]">
      <motion.div
        style={{ rotateX: reduce ? 12 : rotateX, rotateY: reduce ? -14 : rotateY, transformStyle: 'preserve-3d' }}
        className="absolute inset-0"
      >
        {deck.map((r, i) => {
          // Index 0 (newest) sits at the front of the stack.
          const lift = hover === i ? 40 : 0;
          return (
            <motion.button
              key={r.hash}
              type="button"
              onClick={() => onOpen(r.hash)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`Open report for ${r.contract}`}
              initial={{ opacity: 0, z: -200, y: 30 }}
              animate={{ opacity: 1, z: -i * 70 + lift, y: i * -26 - (hover === i ? 10 : 0), x: i * 26 }}
              transition={{ duration: hover === null ? 0.9 : 0.35, delay: hover === null ? 0.2 + i * 0.1 : 0, ease: EASE_OUT }}
              style={{ zIndex: 10 - i }}
              className="absolute left-6 top-14 w-[260px] text-left rounded-lg border border-white/10 bg-[#161616] text-slate-300 p-4 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white truncate">{r.contract}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.isSecure ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
              <p className="mt-1 font-mono text-[10px] text-slate-500 truncate">{r.hash}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Score</p>
                  <p className="text-xl font-medium tabular-nums text-white leading-none mt-1">{r.riskScore}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{r.date}</span>
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={`h-full ${r.riskScore > 50 ? 'bg-red-500' : 'bg-accent'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, r.riskScore)}%` }}
                  transition={{ duration: 1.1, delay: 0.6 + i * 0.1, ease: EASE_OUT }}
                />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
