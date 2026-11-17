'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { friendlyError } from '../lib/errors';

type Tone = 'error' | 'success' | 'info';

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  message?: string;
  detail?: string;
  duration: number;
}

interface ToastApi {
  show: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => number;
  /** Shows any thrown error with a readable title; raw text kept as detail. */
  error: (err: unknown, fallback?: string) => number;
  success: (title: string, message?: string) => number;
  info: (title: string, message?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const EASE = [0.165, 0.84, 0.44, 1] as const;
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const show = useCallback<ToastApi['show']>((t) => {
    const id = nextId.current++;
    setToasts((ts) => {
      // Collapse exact repeats (e.g. a double-clicked button) into one toast.
      const rest = ts.filter((x) => !(x.title === t.title && x.message === t.message));
      return [...rest, { ...t, id, duration: t.duration ?? (t.tone === 'error' ? 6500 : 4000) }].slice(-MAX_VISIBLE);
    });
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      error: (err, fallback) => {
        const f = friendlyError(err, fallback);
        return show({ tone: f.kind === 'info' ? 'info' : 'error', title: f.title, message: f.message, detail: f.detail });
      },
      success: (title, message) => show({ tone: 'success', title, message }),
      info: (title, message) => show({ tone: 'info', title, message }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed z-[100] inset-x-0 bottom-20 md:bottom-auto md:top-20 md:right-4 md:left-auto flex flex-col items-center md:items-end gap-2 px-4 md:px-0 [perspective:1000px]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const TONE: Record<
  Tone,
  {
    icon: typeof Info;
    iconWrap: string;
    bar: string;
    border: string;
    glow: string;
  }
> = {
  error: {
    icon: AlertCircle,
    iconWrap: 'bg-red-500/15 dark:bg-red-950/60 border border-red-500/30 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    border: 'border-red-200/80 dark:border-red-900/50',
    glow: 'dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(239,68,68,0.2)]',
  },
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-emerald-500/15 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    border: 'border-emerald-200/80 dark:border-emerald-900/50',
    glow: 'dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(16,185,129,0.2)]',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-sky-500/15 dark:bg-sky-950/60 border border-sky-500/30 text-sky-600 dark:text-sky-400',
    bar: 'bg-sky-500',
    border: 'border-sky-200/80 dark:border-sky-900/50',
    glow: 'dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(14,165,233,0.2)]',
  },
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(Date.now());
  const toneStyle = TONE[toast.tone];
  const Icon = toneStyle.icon;

  // Auto-dismiss; hovering pauses the countdown and resumes with what's left.
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const id = setTimeout(onClose, remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, onClose]);

  return (
    <motion.div
      layout
      role={toast.tone === 'error' ? 'alert' : 'status'}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, rotateX: -40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ duration: 0.45, ease: EASE }}
      style={{ transformOrigin: '50% 0%' }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border ${toneStyle.border} bg-white dark:bg-[#121318] text-slate-900 dark:text-slate-100 shadow-xl shadow-slate-900/10 ${toneStyle.glow} backdrop-blur-xl transition-colors duration-200`}
    >
      <div className="flex items-start gap-3 p-3.5 pr-10">
        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${toneStyle.iconWrap}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {toast.message}
            </p>
          )}
          {toast.detail && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#090a0f] border border-slate-200/80 dark:border-slate-800/90 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words flex items-center gap-1.5 select-all">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 shrink-0">
                Reason:
              </span>
              <span className="text-slate-800 dark:text-slate-200">{toast.detail}</span>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute top-2.5 right-2.5 grid place-items-center w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Countdown bar: a CSS animation so hover can pause it exactly in place */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${toneStyle.bar} opacity-80`}
        style={{
          animation: reduce ? 'none' : `grow-x ${toast.duration}ms linear reverse forwards`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      />
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
