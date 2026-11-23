'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Bug, Fingerprint, GitPullRequestArrow, Hourglass, ShieldCheck, Stamp, type LucideIcon } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { SectionHeading, container } from './primitives';
import { EASE_OUT, useActive, usePointerDepth } from './motion';

/**
 * "Agents as teammates": each analysis pass is a named specialist.
 * They sit on a 3D ring that turns to the selected agent, auto-advances
 * while on screen, and leans toward the cursor.
 */

interface Agent {
  name: string;
  role: string;
  icon: LucideIcon;
  summary: string;
  log: string[];
  tone: string;
}

const AGENTS: Agent[] = [
  {
    name: 'Bytecode Verifier',
    role: 'ingest',
    icon: Fingerprint,
    summary: 'Pulls deployed WASM from Stellar RPC and fingerprints it, so every finding maps to the exact bytes on-chain.',
    log: ['fetch  CDLZ…4XQ2', 'sha256 e3b0c4…b855', 'match  source ✓'],
    tone: 'text-sky-400',
  },
  {
    name: 'Auth Sentinel',
    role: 'invariants',
    icon: ShieldCheck,
    summary: 'Walks every entrypoint for require_auth() coverage, caller spoofing and privilege escalation paths.',
    log: ['scan   14 entrypoints', 'miss   transfer() L3', 'flag   CRITICAL'],
    tone: 'text-[#fdda24]',
  },
  {
    name: 'Panic Hunter',
    role: 'runtime',
    icon: Bug,
    summary: 'Finds naked unwrap(), unchecked arithmetic and unbounded loops before they trap the host on mainnet.',
    log: ['unwrap 2 sites', 'i128   overflow L5', 'loop   bounded ✓'],
    tone: 'text-amber-400',
  },
  {
    name: 'Rent Keeper',
    role: 'storage',
    icon: Hourglass,
    summary: 'Audits persistent and instance keys for missing extend_ttl() so balances are never silently evicted.',
    log: ['keys   9 persistent', 'ttl    3 unbumped', 'risk   eviction'],
    tone: 'text-violet-400',
  },
  {
    name: 'Patch Smith',
    role: 'remediation',
    icon: GitPullRequestArrow,
    summary: 'Several models cross-check each finding, then draft line-attributed Rust diffs you can apply directly.',
    log: ['models 3/3 agree', 'diff   +4 −2', 'tests  passing'],
    tone: 'text-emerald-400',
  },
  {
    name: 'Ledger Notary',
    role: 'provenance',
    icon: Stamp,
    summary: 'Signs the score, hash and report digest with Freighter and anchors them to solace_core for anyone to verify.',
    log: ['sign   freighter', 'write  solace_core', 'tx     7a8f3d… ✓'],
    tone: 'text-slate-200',
  },
];

const STEP = 360 / AGENTS.length;
const RADIUS = 300;
const AUTO_MS = 3600;

export default function AgentsSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const onScreen = useActive(sectionRef);
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);

  // `turn` is cumulative so the ring always takes the shortest way round.
  const [turn, setTurn] = useState(-1 * STEP);
  const target = useMotionValue(turn);
  const rot = useSpring(target, { stiffness: 60, damping: 16, mass: 0.9 });

  useEffect(() => {
    target.set(turn);
  }, [turn, target]);

  const go = (next: number) => {
    const n = ((next % AGENTS.length) + AGENTS.length) % AGENTS.length;
    let delta = n - active;
    if (delta > AGENTS.length / 2) delta -= AGENTS.length;
    if (delta < -AGENTS.length / 2) delta += AGENTS.length;
    setActive(n);
    setTurn((t) => t - delta * STEP);
  };

  useEffect(() => {
    if (reduce || paused || !onScreen) return;
    const id = setTimeout(() => go(active + 1), AUTO_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, onScreen, reduce]);

  const { x, y } = usePointerDepth(stageRef);
  const tiltX = useTransform(y, [-0.5, 0.5], [-4, -14]);
  const tiltZ = useTransform(x, [-0.5, 0.5], [3, -3]);

  const agent = AGENTS[active];

  return (
    <section
      id="agents"
      ref={sectionRef}
      className="relative w-full py-20 sm:py-28 border-b border-slate-200 dark:border-white/10 overflow-hidden"
    >
      <div className={container}>
        <SectionHeading
          eyebrow="Agents"
          title="A security team that never clocks out"
          description="Every audit is split across six specialist agents. Each owns one class of Soroban risk, reports what it found, and hands off to the next."
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* Roster */}
          <ul className="lg:col-span-5 border-y border-slate-200 dark:border-white/10 divide-y divide-slate-200 dark:divide-white/10 order-2 lg:order-1">
            {AGENTS.map((a, i) => {
              const selected = i === active;
              const Icon = a.icon;
              return (
                <li key={a.name}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => go(i)}
                    className="relative w-full flex items-start gap-4 py-4 text-left cursor-pointer group"
                  >
                    <span
                      className={`mt-0.5 grid place-items-center w-8 h-8 shrink-0 rounded-md border transition-colors ${
                        selected
                          ? 'bg-accent border-accent text-white'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={`text-[15px] font-medium transition-colors ${
                            selected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        >
                          {a.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{a.role}</span>
                      </span>
                      <AnimatePresence initial={false}>
                        {selected && (
                          <motion.span
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: EASE_OUT }}
                            className="block overflow-hidden"
                          >
                            <span className="block pt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {a.summary}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    {selected && (
                      <span className="absolute left-0 right-0 -bottom-px h-px bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <span
                          key={`${active}-${paused}`}
                          style={{
                            ['--progress-duration' as string]: `${AUTO_MS}ms`,
                            animationPlayState: paused || !onScreen ? 'paused' : 'running',
                          }}
                          className={`absolute inset-0 origin-left bg-accent ${reduce ? '' : 'animate-grow-x'}`}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 3D ring */}
          <div
            ref={stageRef}
            className="lg:col-span-7 order-1 lg:order-2 relative h-[380px] sm:h-[460px] [perspective:1400px]"
            aria-live="polite"
          >
            <span className="sr-only">
              {agent.name}: {agent.summary}
            </span>
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[50%] rounded-[50%] bg-accent opacity-[0.12] dark:opacity-20 blur-[80px]" />
              {/* Orbit track */}
              <div className="absolute left-1/2 top-[58%] w-[640px] h-[640px] [transform:translate(-50%,-50%)_rotateX(78deg)] rounded-full border border-slate-300/60 dark:border-white/10" />
            </div>

            <motion.div
              aria-hidden
              style={{ rotateX: reduce ? -8 : tiltX, rotateZ: reduce ? 0 : tiltZ, transformStyle: 'preserve-3d' }}
              className="absolute inset-0 scale-[0.55] sm:scale-75 lg:scale-90 xl:scale-100"
            >
              <motion.div
                style={{ rotateY: rot, transformStyle: 'preserve-3d' }}
                className="absolute left-1/2 top-1/2 w-0 h-0"
              >
                {AGENTS.map((a, i) => (
                  <RingCard key={a.name} agent={a} index={i} rot={rot} selected={i === active} onPick={() => go(i)} />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RingCard({
  agent,
  index,
  rot,
  selected,
  onPick,
}: {
  agent: Agent;
  index: number;
  rot: MotionValue<number>;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = agent.icon;
  const angle = index * STEP;
  // 1 when facing the viewer, 0 at the back of the ring.
  const facing = useTransform(rot, (r) => (Math.cos(((angle + r) * Math.PI) / 180) + 1) / 2);
  const opacity = useTransform(facing, (f) => 0.12 + 0.88 * f * f);
  const brightness = useTransform(facing, (f) => `brightness(${0.55 + 0.45 * f})`);

  return (
    <div
      className="absolute -left-[120px] -top-[105px] w-[240px]"
      style={{ transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)` }}
    >
    <motion.div onClick={onPick} style={{ opacity, filter: brightness }} className="cursor-pointer">
      <div
        className={`rounded-xl border bg-[#141414] text-slate-300 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] transition-colors duration-500 ${
          selected ? 'border-accent/60' : 'border-white/10'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`grid place-items-center w-8 h-8 rounded-md bg-white/5 border border-white/10 ${agent.tone}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">{agent.name}</p>
            <p className="text-[11px] font-mono text-slate-500">@{agent.role}</p>
          </div>
          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${selected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        </div>
        <div className="mt-4 rounded-md bg-black/40 border border-white/5 px-3 py-2 font-mono text-[11px] leading-5">
          {agent.log.map((line, i) => (
            <motion.div
              key={line}
              initial={false}
              animate={{ opacity: selected ? 1 : 0.45, x: selected ? 0 : -2 }}
              transition={{ duration: 0.4, delay: selected ? 0.25 + i * 0.12 : 0, ease: EASE_OUT }}
              className="whitespace-pre text-slate-400"
            >
              <span className="text-slate-600">› </span>
              {line}
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>{selected ? 'Working on token.rs' : 'Standing by'}</span>
          <span className="font-mono">0{index + 1}</span>
        </div>
      </div>
    </motion.div>
    </div>
  );
}
