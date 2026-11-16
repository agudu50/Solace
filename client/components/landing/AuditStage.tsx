'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT, useActive } from './motion';

/**
 * Hero product animation: a looping, self-playing audit run.
 * command typed → press → scan sweep → findings → risk score → on-chain anchor.
 * Pauses while offscreen / tab hidden; reduced-motion users get the final frame.
 */

const COMMAND = 'solace audit token.rs --network testnet';
const TX = 'tx 7a8f3d…e21c';
const LINE_H = 21;

const CODE: { text: React.ReactNode; flag?: 'crit' | 'high' | 'med' }[] = [
  { text: <span className="text-slate-500">#[contractimpl]</span> },
  { text: <><span className="text-[#c792ea]">impl</span> Token {'{'}</> },
  { text: <>  <span className="text-[#c792ea]">pub fn</span> <span className="text-white">transfer</span>(env: Env, from: Address, to: Address, amt: i128) {'{'}</>, flag: 'crit' },
  { text: <>    <span className="text-[#c792ea]">let</span> bal = read_balance(&amp;env, &amp;from)<span className="text-[#f78c6c]">.unwrap()</span>;</>, flag: 'high' },
  { text: <>    write_balance(&amp;env, &amp;from, bal - amt);</>, flag: 'med' },
  { text: <>    write_balance(&amp;env, &amp;to, read_balance(&amp;env, &amp;to) + amt);</> },
  { text: <>  {'}'}</> },
  { text: <>{'}'}</> },
];

const FINDINGS = [
  { sev: 'CRIT', label: 'Missing require_auth() on transfer', loc: 'L3', tone: 'text-accent' },
  { sev: 'HIGH', label: 'Host panic via unwrap() on balance read', loc: 'L4', tone: 'text-amber-400' },
  { sev: 'MED', label: 'No extend_ttl() on persistent balance', loc: 'L5', tone: 'text-sky-400' },
];

const FLAG_BG: Record<string, string> = {
  crit: 'bg-accent/15 border-accent',
  high: 'bg-amber-400/10 border-amber-400',
  med: 'bg-sky-400/10 border-sky-400',
};

type Phase = 'typing' | 'scanning' | 'findings' | 'anchoring' | 'anchored';

interface State {
  typed: number;
  pressKey: number;
  phase: Phase;
  scan: number; // index of line under the scan bar, -1 when hidden
  scanned: number; // lines fully scanned
  findings: number;
  risk: number;
  tx: number;
  fading: boolean;
}

const INITIAL: State = {
  typed: 0, pressKey: 0, phase: 'typing', scan: -1, scanned: 0, findings: 0, risk: 0, tx: 0, fading: false,
};
const FINAL: State = {
  typed: COMMAND.length, pressKey: 0, phase: 'anchored', scan: -1, scanned: CODE.length,
  findings: FINDINGS.length, risk: 82, tx: TX.length, fading: false,
};

export default function AuditStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useActive(rootRef);
  const reduce = useReducedMotion();
  const [s, setS] = useState<State>(FINAL);

  useEffect(() => {
    if (reduce || !active) {
      setS(FINAL);
      return;
    }
    let cancelled = false;
    let stopRisk: (() => void) | undefined;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => (cancelled ? reject(new Error('cancelled')) : resolve()), ms),
      );
    const set = (patch: Partial<State>) => !cancelled && setS((prev) => ({ ...prev, ...patch }));

    const run = async () => {
      while (!cancelled) {
        setS(INITIAL);
        await wait(500);
        for (let i = 1; i <= COMMAND.length; i++) {
          set({ typed: i });
          await wait(42);
        }
        await wait(280);
        set({ pressKey: Date.now() });
        await wait(560);

        set({ phase: 'scanning' });
        for (let i = 0; i < CODE.length; i++) {
          set({ scan: i });
          await wait(190);
          set({ scanned: i + 1 });
        }
        set({ scan: -1, phase: 'findings' });

        for (let k = 1; k <= FINDINGS.length; k++) {
          set({ findings: k });
          await wait(240);
        }
        const ctl = animate(0, 82, { duration: 0.9, ease: EASE_OUT, onUpdate: (v) => set({ risk: Math.round(v) }) });
        stopRisk = () => ctl.stop();
        await wait(1000);

        set({ phase: 'anchoring' });
        await wait(1200);
        set({ phase: 'anchored' });
        for (let i = 1; i <= TX.length; i++) {
          set({ tx: i });
          await wait(36);
        }
        await wait(4200);
        set({ fading: true });
        await wait(450);
      }
    };
    run().catch(() => {});
    return () => {
      cancelled = true;
      stopRisk?.();
    };
  }, [active, reduce]);

  const typing = s.typed < COMMAND.length;

  return (
    <div
      ref={rootRef}
      aria-label="Animated example of a Solace audit run"
      role="img"
      className="relative rounded-lg border border-slate-800 dark:border-white/10 bg-[#121212] text-slate-300 font-mono overflow-hidden text-[12.5px] select-none"
    >
      <motion.div animate={{ opacity: s.fading ? 0 : 1 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
        {/* Command bar */}
        <div key={s.pressKey} className={`relative flex items-center gap-2 border-b border-white/10 px-4 h-11 ${s.pressKey ? 'animate-press' : ''}`}>
          {s.pressKey > 0 && <span className="absolute inset-0 bg-white opacity-0 animate-flash pointer-events-none" />}
          <span className="text-slate-500">$</span>
          <span className="whitespace-pre truncate">
            <span className="text-[#fdfd76]">{COMMAND.slice(0, Math.min(s.typed, 6))}</span>
            <span className="text-sky-300">{COMMAND.slice(6, Math.min(s.typed, 12))}</span>
            <span className="text-slate-200">{COMMAND.slice(12, s.typed)}</span>
          </span>
          <span className={`-ml-1 text-slate-500 ${typing ? 'caret' : 'opacity-0'}`}>▍</span>
          <span className="ml-auto shrink-0 text-[11px] text-slate-500 hidden sm:flex items-center gap-2">
            <PhaseDot phase={s.phase} />
            {s.phase === 'typing' ? 'ready' : s.phase === 'scanning' ? 'scanning' : s.phase === 'anchoring' ? 'anchoring' : s.phase === 'anchored' ? 'done' : 'analyzing'}
          </span>
        </div>

        {/* Code with scan sweep */}
        <div className="relative py-3 overflow-x-auto modern-code-scrollbar">
          {s.scan >= 0 && (
            <motion.div
              className="absolute left-0 right-0 h-[21px] bg-white/[0.05] border-y border-white/10 pointer-events-none"
              initial={false}
              animate={{ y: 12 + s.scan * LINE_H }}
              transition={{ duration: 0.18, ease: 'linear' }}
            />
          )}
          {CODE.map((line, i) => {
            const done = i < s.scanned;
            const flagged = done && line.flag;
            return (
              <div
                key={i}
                style={{ height: LINE_H }}
                className={`relative flex items-center pr-4 whitespace-pre border-l-2 transition-[background-color,border-color,opacity] duration-300 ${
                  flagged ? FLAG_BG[line.flag!] : 'border-transparent'
                } ${done || s.phase === 'typing' ? 'opacity-100' : 'opacity-50'}`}
              >
                <span className="w-10 shrink-0 text-right pr-4 text-slate-600">{i + 1}</span>
                <span>{line.text}</span>
              </div>
            );
          })}
        </div>

        {/* Findings */}
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between px-4 h-9 text-[11px] uppercase tracking-wider text-slate-500">
            <span>
              Findings · <span className="tabular-nums text-slate-300">{s.findings}</span>
            </span>
            <span>
              Risk <span className={`tabular-nums ${s.risk > 0 ? 'text-accent' : 'text-slate-300'}`}>{s.risk}</span> / 100
            </span>
          </div>
          <div className="relative h-[108px]">
            <AnimatePresence initial={false}>
              {FINDINGS.slice(0, s.findings).map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                  style={{ top: i * 36 }}
                  className="absolute inset-x-0 flex items-center gap-3 px-4 h-9 border-t border-white/5 text-xs"
                >
                  <span className={`w-10 shrink-0 ${f.tone}`}>{f.sev}</span>
                  <span className="flex-1 truncate text-slate-200 font-sans">{f.label}</span>
                  <span className="text-slate-500">{f.loc}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 h-10 text-[11px] text-slate-500">
          <span className="flex items-center gap-2">
            {s.phase === 'anchored' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">anchored to solace_core</span>
              </>
            ) : s.phase === 'anchoring' ? (
              <>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 animate-ping-soft" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-amber-400" />
                </span>
                signing with Freighter…
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                awaiting audit
              </>
            )}
          </span>
          <span className="truncate tabular-nums">{TX.slice(0, s.tx)}</span>
        </div>
      </motion.div>
    </div>
  );
}

function PhaseDot({ phase }: { phase: Phase }) {
  const busy = phase === 'scanning' || phase === 'findings' || phase === 'anchoring';
  const color = phase === 'anchored' ? 'bg-emerald-400' : busy ? 'bg-amber-400' : 'bg-slate-600';
  return (
    <span className="relative flex w-1.5 h-1.5">
      {busy && <span className={`absolute inline-flex w-full h-full rounded-full ${color} animate-ping-soft`} />}
      <span className={`relative w-1.5 h-1.5 rounded-full ${color}`} />
    </span>
  );
}
