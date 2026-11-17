'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/** Shared easing: a fast start that settles softly ("out-quart"). */
export const EASE_OUT = [0.165, 0.84, 0.44, 1] as const;

/** Fades content up once as it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </Comp>
  );
}

/**
 * Counts a number up from zero when it scrolls into view.
 * Non-numeric parts of `value` (prefix/suffix) are kept as-is.
 */
export function CountUp({ value, duration = 1.4 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  // Only animate values that lead with a number (e.g. "< 0.4s", "30 XLM"), not labels like "SHA-256".
  const match = value.match(/^([^\dA-Za-z]*)(\d+(?:\.\d+)?)(.*)$/);
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    if (!match) return;
    const [, prefix, num, suffix] = match;
    const target = parseFloat(num);
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    if (reduce) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

/** True while the element is on screen and the tab is visible. Used to pause loops. */
export function useActive<T extends Element>(ref: React.RefObject<T>) {
  const inView = useInView(ref, { margin: '-10% 0px' });
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return inView && visible;
}

/* ------------------------------------------------------------------ */
/* 3D / depth primitives                                               */
/* ------------------------------------------------------------------ */

const SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

/**
 * Headline reveal: each word rises out of a soft blur, staggered.
 * Plain strings only; the accessible name is the full sentence.
 */
export function SplitWords({
  text,
  className = '',
  delay = 0,
  stagger = 0.06,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Trigger on scroll into view instead of on mount. */
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const trigger = inView
    ? { whileInView: 'show', viewport: { once: true, margin: '-60px' } }
    : { animate: 'show' };
  return (
    // The words are the real text (read and copied once). A separate sr-only
    // copy would duplicate the sentence whenever someone selects and copies it.
    <span className={className}>
      <motion.span
        initial={reduce ? false : 'hidden'}
        {...trigger}
        variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        className="inline"
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hidden: { y: '60%', opacity: 0, filter: 'blur(10px)' },
                show: { y: '0%', opacity: 1, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE_OUT } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 && '\u00a0'}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Normalised pointer position (-0.5 … 0.5) over an element, spring-smoothed.
 * Returns zeros (and stays still) for reduced-motion users and coarse pointers.
 */
export function usePointerDepth<T extends HTMLElement>(ref: React.RefObject<T>, { global = false } = {}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  useEffect(() => {
    if (reduce) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;
    const target: HTMLElement | Window = global ? window : el;
    const onMove = (e: Event) => {
      const { clientX, clientY } = e as PointerEvent;
      const r = el.getBoundingClientRect();
      x.set(Math.max(-0.5, Math.min(0.5, (clientX - r.left) / r.width - 0.5)));
      y.set(Math.max(-0.5, Math.min(0.5, (clientY - r.top) / r.height - 0.5)));
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };
    target.addEventListener('pointermove', onMove);
    if (!global) el.addEventListener('pointerleave', onLeave);
    return () => {
      target.removeEventListener('pointermove', onMove);
      if (!global) el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, global, reduce, x, y]);

  return { x: sx, y: sy };
}

/**
 * A card that tilts toward the cursor in 3D with a moving specular glare.
 * Children can lift off the surface with `<Depth z={…}>`.
 */
export function TiltCard({
  children,
  className = '',
  max = 8,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = usePointerDepth(ref);
  const rotateY = useTransform(x, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(y, [-0.5, 0.5], [max, -max]);
  const gx = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const gy = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
  const glareBg = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.10), transparent 60%)`;

  return (
    <div ref={ref} className={`group/tilt [perspective:1000px] ${className}`}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full will-change-transform"
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            style={{ background: glareBg }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay dark:mix-blend-plus-lighter opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          />
        )}
      </motion.div>
    </div>
  );
}

/** Lifts content along Z inside a preserve-3d parent (e.g. TiltCard). */
export function Depth({ z, children, className = '' }: { z: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}

/** Maps a pointer motion value to a parallax offset in px, for layered depth. */
export function useParallax(v: MotionValue<number>, px: number) {
  return useTransform(v, [-0.5, 0.5], [-px, px]);
}
