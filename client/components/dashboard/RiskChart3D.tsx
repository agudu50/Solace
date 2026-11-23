'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { EASE_OUT, usePointerDepth } from '../landing/motion';

export interface RiskBar {
  key: string;
  label: string;
  category: string;
  detail: string;
  score: number; // 0–100, higher is safer
  status: string;
  color: string; // hex
  whatChecks?: string;
  whyText?: string;
  penalty?: number;
}

const BAR = 30; // footprint (px)
const GAP = 22;
const MAX_H = 230;

/**
 * Isometric 3D bar chart: CSS prisms standing on a tilted grid floor.
 * Bars rise on mount / when scores change, the scene leans toward the
 * cursor, and hovering a bar or its legend entry highlights both.
 */
export default function RiskChart3D({
  bars,
  active,
  onSelectBar,
}: {
  bars: RiskBar[];
  active: boolean;
  onSelectBar?: (bar: RiskBar) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y } = usePointerDepth(stageRef);
  const rotateX = useTransform(y, [-0.5, 0.5], [78, 70]);
  const rotateZ = useTransform(x, [-0.5, 0.5], [10, -10]);
  const [hover, setHover] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const floorW = bars.length * BAR + (bars.length - 1) * GAP + 64;
  const floorD = BAR + 96;

  // Selected or hovered bar for detailed inspection
  const selectedBar = bars.find((b) => b.key === hover) || bars.find((b) => b.score < 100) || bars[0];

  return (
    <div className="space-y-3">
      {/* Index Scoring Guide & Status Strip */}
      <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">Invariant Health Scale:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% Guarded (Safe)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            75%–99% Warning
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            &lt;75% Breached (Critical)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-accent hover:underline cursor-pointer font-medium flex items-center gap-1"
        >
          {showGuide ? 'Hide explanation' : 'Why these percentages?'}
        </button>
      </div>

      {/* Expandable Explanation Panel */}
      {showGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 sm:px-5 py-3 mx-4 sm:mx-5 rounded-xl bg-accent-subtle/40 border border-accent/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed"
        >
          <p className="font-semibold text-slate-900 dark:text-white">
            How to read the 3D Invariant Index:
          </p>
          <p>
            • <strong>100% is safe</strong>: Each of the 6 core Soroban invariant dimensions begins at 100%. If AST analysis discovers no flaws in that vector, the score stays at 100% (Guarded).
          </p>
          <p>
            • <strong>Lower scores indicate danger</strong>: When invariant vulnerabilities are found (such as missing <code>require_auth()</code> or rent eviction hazards), specific risk penalties are deducted.
          </p>
          <p>
            • <strong>Scores below 75% are bad/breached</strong>: Any dimension scoring under 75% represents a critical security invariant failure that can lead to contract drain, state erasure, or runtime host aborts.
          </p>
          <p className="pt-1 text-[11px] text-accent font-medium">
            💡 Click any bar or legend item to open the full explanation modal with Soroban Rust fix patterns.
          </p>
        </motion.div>
      )}

      {/* 3D Stage */}
      <div
        ref={stageRef}
        className="relative h-[300px] sm:h-[350px] [perspective:1100px] [perspective-origin:50%_30%] overflow-hidden"
        role="img"
        aria-label={
          active
            ? `Security scores: ${bars.map((b) => `${b.label} ${b.score}%`).join(', ')}`
            : 'Security scores pending: no contract scanned yet'
        }
      >
        <motion.div
          style={{
            rotateX: reduce ? 74 : rotateX,
            rotateZ: reduce ? 0 : rotateZ,
            width: floorW,
            height: floorD,
            marginLeft: -floorW / 2,
            marginTop: -floorD / 2,
            transformStyle: 'preserve-3d',
          }}
          className="absolute left-1/2 top-[84%] scale-[0.75] sm:scale-100"
        >
          {/* Floor */}
          <div className="absolute inset-0 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] grid-lines [background-size:16px_16px]" />

          {bars.map((b, i) => (
            <Prism
              key={b.key}
              bar={b}
              active={active}
              left={32 + i * (BAR + GAP)}
              top={(floorD - BAR) / 2}
              delay={0.25 + i * 0.08}
              dim={hover !== null && hover !== b.key}
              onHover={(h) => setHover(h ? b.key : null)}
              onClick={() => onSelectBar?.(b)}
            />
          ))}
        </motion.div>
      </div>

      {/* Interactive Selected Vector Detail Card */}
      {selectedBar && active && (
        <div className="mx-4 sm:mx-5 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-[#fafaf9] dark:bg-[#161616] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedBar.color }} />
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {selectedBar.category} ({selectedBar.label}): {selectedBar.score}%
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedBar.score >= 100
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : selectedBar.score >= 75
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {selectedBar.status} · {selectedBar.score >= 100 ? 'Safe' : 'Action Required'}
              </span>
            </div>
            {selectedBar.whatChecks && (
              <p className="text-slate-600 dark:text-slate-400 leading-normal">
                <strong>Checks:</strong> {selectedBar.whatChecks}
              </p>
            )}
            {selectedBar.whyText && (
              <p className="text-slate-700 dark:text-slate-300 leading-normal">
                <strong>Why this score:</strong> {selectedBar.whyText}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSelectBar?.(selectedBar)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-accent text-slate-950 font-medium text-xs hover:bg-accent-hover transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Learn what this means</span>
            <span aria-hidden>&rarr;</span>
          </button>
        </div>
      )}

      {/* Legend: the accessible, readable counterpart of the scene */}
      <ul className="grid grid-cols-3 sm:grid-cols-6 border-t border-slate-200 dark:border-white/10">
        {bars.map((b, i) => (
          <li
            key={b.key}
            onClick={() => {
              setHover(b.key);
              onSelectBar?.(b);
            }}
            onPointerEnter={() => setHover(b.key)}
            onPointerLeave={() => setHover(null)}
            title={`Click to inspect ${b.category} details`}
            className={`px-3 py-3 transition-all cursor-pointer ${i % 3 !== 0 ? 'border-l' : ''} ${
              i >= 3 ? 'border-t sm:border-t-0' : ''
            } sm:border-l sm:first:border-l-0 border-slate-200 dark:border-white/10 hover:bg-slate-100/50 dark:hover:bg-white/[0.04] ${
              hover && hover !== b.key ? 'opacity-40' : 'opacity-100'
            } ${hover === b.key ? 'bg-slate-100/80 dark:bg-white/[0.06]' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[2px]" style={{ background: active ? b.color : '#a3a3a1' }} />
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">{b.label}</span>
            </div>
            <div className="mt-1 text-lg font-medium tabular-nums tracking-tight text-slate-900 dark:text-white">
              {active ? `${b.score}%` : '—'}
            </div>
            <div
              className={`font-mono text-[10px] uppercase tracking-wider truncate font-semibold ${
                !active
                  ? 'text-slate-500'
                  : b.score >= 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : b.score >= 75
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {b.status}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Prism({
  bar,
  active,
  left,
  top,
  delay,
  dim,
  onHover,
  onClick,
}: {
  bar: RiskBar;
  active: boolean;
  left: number;
  top: number;
  delay: number;
  dim: boolean;
  onHover: (h: boolean) => void;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  const target = active ? Math.max(6, (bar.score / 100) * MAX_H) : 6;
  const h = useMotionValue(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      h.set(target);
      return;
    }
    const c = animate(h, target, { duration: 1.1, delay, ease: EASE_OUT });
    return () => c.stop();
  }, [target, delay, reduce, h]);

  const color = active ? bar.color : '#a3a3a1';
  const topT = useMotionTemplate`translateZ(${h}px)`;

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className="absolute transition-opacity duration-300 cursor-pointer"
      style={{ left, top, width: BAR, height: BAR, transformStyle: 'preserve-3d', opacity: dim ? 0.35 : 1 }}
    >
      {/* Ground shadow */}
      <div className="absolute -inset-2 rounded-sm blur-md" style={{ background: color, opacity: active ? 0.25 : 0.1 }} />
      {/* Front (south) and back */}
      <Face h={h} color={color} shade={0.72} side="front" />
      <Face h={h} color={color} shade={0.6} side="back" />
      {/* East and west */}
      <Face h={h} color={color} shade={0.5} side="right" />
      <Face h={h} color={color} shade={0.82} side="left" />
      {/* Top cap */}
      <motion.div
        className="absolute inset-0 border border-white/30"
        style={{ transform: topT, background: color, boxShadow: active ? `0 0 24px ${color}` : 'none' }}
      />
    </div>
  );
}

function Face({
  h,
  color,
  shade,
  side,
}: {
  h: MotionValue<number>;
  color: string;
  shade: number;
  side: 'front' | 'back' | 'right' | 'left';
}) {
  const vertical = side === 'front' || side === 'back';
  const style: Record<string, unknown> = {
    background: `linear-gradient(to top, ${color}, ${color}cc)`,
    filter: `brightness(${shade})`,
  };
  if (vertical) {
    Object.assign(style, {
      left: 0,
      width: BAR,
      height: h,
      top: side === 'front' ? '100%' : 0,
      transformOrigin: 'top',
      transform: 'rotateX(90deg)',
    });
  } else {
    Object.assign(style, {
      top: 0,
      height: BAR,
      width: h,
      left: side === 'right' ? '100%' : 0,
      transformOrigin: 'left',
      transform: 'rotateY(-90deg)',
    });
  }
  return <motion.div aria-hidden className="absolute" style={style as any} />;
}
