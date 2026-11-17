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
}

const BAR = 30; // footprint (px)
const GAP = 22;
const MAX_H = 230;

/**
 * Isometric 3D bar chart: CSS prisms standing on a tilted grid floor.
 * Bars rise on mount / when scores change, the scene leans toward the
 * cursor, and hovering a bar or its legend entry highlights both.
 */
export default function RiskChart3D({ bars, active }: { bars: RiskBar[]; active: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y } = usePointerDepth(stageRef);
  // Camera faces the chart head-on: the floor tips back (rotateX) so bars rise
  // straight up the screen. The cursor only turns the floor in its own plane
  // (rotateZ, applied first), a turntable spin that keeps the bars vertical.
  const rotateX = useTransform(y, [-0.5, 0.5], [78, 70]);
  const rotateZ = useTransform(x, [-0.5, 0.5], [10, -10]);
  const [hover, setHover] = useState<string | null>(null);

  const floorW = bars.length * BAR + (bars.length - 1) * GAP + 64;
  const floorD = BAR + 96;

  return (
    <div>
      <div
        ref={stageRef}
        className="relative h-[320px] sm:h-[370px] [perspective:1100px] [perspective-origin:50%_30%] overflow-hidden"
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
            />
          ))}
        </motion.div>
      </div>

      {/* Legend: the accessible, readable counterpart of the scene */}
      <ul className="grid grid-cols-3 sm:grid-cols-6 border-t border-slate-200 dark:border-white/10">
        {bars.map((b, i) => (
          <li
            key={b.key}
            onPointerEnter={() => setHover(b.key)}
            onPointerLeave={() => setHover(null)}
            title={`${b.category}: ${b.detail}`}
            className={`px-3 py-3 transition-opacity ${i % 3 !== 0 ? 'border-l' : ''} ${
              i >= 3 ? 'border-t sm:border-t-0' : ''
            } sm:border-l sm:first:border-l-0 border-slate-200 dark:border-white/10 ${
              hover && hover !== b.key ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[2px]" style={{ background: active ? b.color : '#a3a3a1' }} />
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{b.label}</span>
            </div>
            <div className="mt-1 text-lg font-medium tabular-nums tracking-tight text-slate-900 dark:text-white">
              {active ? `${b.score}%` : '—'}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 truncate">{b.status}</div>
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
}: {
  bar: RiskBar;
  active: boolean;
  left: number;
  top: number;
  delay: number;
  dim: boolean;
  onHover: (h: boolean) => void;
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
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className="absolute transition-opacity duration-300"
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
