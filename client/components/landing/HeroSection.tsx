'use client';
import React, { useRef, useState } from 'react';
import { ArrowRight, Check, GitPullRequestArrow, ShieldCheck, Wallet } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import PricingModal from '../pricing/PricingModal';
import { btn, container } from './primitives';
import AuditStage from './AuditStage';
import { CountUp, EASE_OUT, SplitWords, useActive, useParallax, usePointerDepth } from './motion';

const METRICS = [
  { value: '< 0.4s', label: 'AST scan latency' },
  { value: '6', label: 'Invariant classes checked' },
  { value: 'SHA-256', label: 'Bytecode seal per audit' },
  { value: '30 XLM', label: 'Starter bundle, never expires' },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: EASE_OUT },
});

export default function HeroSection() {
  const { walletKey, connect, connecting } = useWallet();
  const [showPricing, setShowPricing] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (_) {}
  };

  return (
    <section className="relative w-full overflow-hidden border-b border-slate-200 dark:border-white/10">
      <div
        className="absolute inset-0 grid-lines pointer-events-none [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <div className={`relative ${container} pt-16 sm:pt-24 lg:pt-28`}>
        {/* Copy */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.button
            {...fade(0)}
            type="button"
            onClick={() => setShowPricing(true)}
            className="group inline-flex items-center gap-3 mb-8 pl-1 pr-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur text-xs text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer"
          >
            <span className="px-2 py-0.5 rounded-full bg-accent text-slate-950 font-mono text-[10px] uppercase tracking-wider">
              New
            </span>
            <span>Multi-model analysis now cross-checks every finding</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.button>

          <h1 className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[5rem] font-medium tracking-tightest text-slate-900 dark:text-white">
            <SplitWords text="Security audits for Soroban, sealed on-chain." delay={0.05} />
          </h1>

          <motion.p
            {...fade(0.45)}
            className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl"
          >
            A team of analysis agents catches authorization gaps, storage-rent eviction and host panics in
            your Stellar contracts, then anchors a verifiable audit record to the ledger.
          </motion.p>

          <motion.div {...fade(0.55)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="#audit" className={`${btn.primary} group`}>
              Audit a contract
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a href="#scanner" className={btn.secondary}>
              Try the simulator
            </a>
            {!walletKey && (
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className={`${btn.link} ml-1 disabled:opacity-50`}
              >
                <Wallet className="w-4 h-4" />
                {connecting ? 'Connecting…' : 'Connect Freighter'}
              </button>
            )}
          </motion.div>
        </div>

        <HeroStage />

        {/* Metrics strip */}
        <dl className="relative mt-4 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 border-t border-slate-200 dark:border-white/10">
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className={`py-6 sm:py-8 pr-4 ${i % 2 === 1 ? 'pl-4 sm:pl-6 border-l border-slate-200 dark:border-white/10' : ''} ${
                i === 2 ? 'lg:pl-6 lg:border-l border-slate-200 dark:border-white/10' : ''
              } ${i >= 2 ? 'border-t lg:border-t-0 border-slate-200 dark:border-white/10' : ''}`}
            >
              <dt className="eyebrow">{m.label}</dt>
              <dd className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                <CountUp value={m.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {showPricing && <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3D stage                                                            */
/* ------------------------------------------------------------------ */

/**
 * The audit console sits on a tilted plane that flattens as it scrolls
 * into view, leans toward the cursor, and is orbited by agent cards
 * floating at different depths.
 */
function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { x, y } = usePointerDepth(stageRef, { global: true });
  // Only run the idle bobbing while the stage is on screen and the tab is visible.
  const onScreen = useActive(stageRef);

  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'start 0.25'] });
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [26, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [60, 0]);

  const rotateX = useTransform<number, number>([scrollTilt, y], ([t, py]) => (reduce ? 0 : t - py * 6));
  const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.5, ease: EASE_OUT }}
      className="relative mt-14 sm:mt-20 [perspective:1800px]"
    >
      {/* Horizon glow + receding floor grid */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-10 h-[70%]">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[80%] h-[60%] rounded-[50%] bg-accent opacity-[0.18] dark:opacity-25 blur-[90px]" />
        <div className="absolute inset-x-[-20%] bottom-0 h-full [perspective:600px]">
          <div className="absolute inset-0 origin-bottom [transform:rotateX(68deg)] grid-lines [mask-image:linear-gradient(to_top,#000_10%,transparent_80%)]" />
        </div>
      </div>

      <motion.div
        style={{ rotateX, rotateY, scale: reduce ? 1 : scale, y: reduce ? 0 : lift, transformStyle: 'preserve-3d' }}
        className="relative mx-auto max-w-3xl origin-[50%_80%] will-change-transform"
      >
        {/* Back plate: gives the console physical thickness */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-lg bg-black/40 dark:bg-black/60 blur-2xl"
          style={{ transform: 'translateZ(-80px) translateY(30px)' }}
        />
        <div className="relative shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)] rounded-lg ring-1 ring-white/5" style={{ transform: 'translateZ(0)' }}>
          <AuditStage />
        </div>

        <FloatingCard x={x} y={y} z={110} depth={22} className="-left-44 top-10" delay={1.1} bob={0} active={onScreen}>
          <AgentCard />
        </FloatingCard>
        <FloatingCard x={x} y={y} z={150} depth={32} className="-right-48 top-[38%]" delay={1.3} bob={1.2} active={onScreen}>
          <PatchCard />
        </FloatingCard>
        <FloatingCard x={x} y={y} z={80} depth={16} className="-left-36 bottom-6" delay={1.5} bob={2.1} active={onScreen}>
          <AnchorCard />
        </FloatingCard>
      </motion.div>
    </motion.div>
  );
}

function FloatingCard({
  children,
  className,
  x,
  y,
  z,
  depth,
  delay,
  bob,
  active,
}: {
  children: React.ReactNode;
  className: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  z: number;
  depth: number;
  delay: number;
  bob: number;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const px = useParallax(x, depth);
  const py = useParallax(y, depth * 0.6);
  return (
    <motion.div
      aria-hidden
      className={`absolute hidden xl:block ${className}`}
      style={{ x: px, y: py, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
        animate={
          reduce || !active
            ? { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }
            : { opacity: 1, scale: 1, filter: 'blur(0px)', y: [0, -8, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay, ease: EASE_OUT },
          scale: { duration: 0.8, delay, ease: EASE_OUT },
          filter: { duration: 0.8, delay, ease: EASE_OUT },
          y: { duration: 6, delay: delay + bob, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ translateZ: z }}
        className="w-64 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5 text-left shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function AgentCard() {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-accent text-slate-950">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-900 dark:text-white leading-tight">Auth Sentinel</p>
          <p className="text-[11px] text-slate-500 font-mono">agent · assigned</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-current animate-ping-soft" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-current" />
          </span>
          Working
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Tracing every entrypoint in <span className="font-mono text-slate-900 dark:text-slate-200">transfer()</span> for{' '}
        <span className="font-mono text-slate-900 dark:text-slate-200">require_auth</span> coverage.
      </p>
    </>
  );
}

function PatchCard() {
  return (
    <>
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900 dark:text-white">
        <GitPullRequestArrow className="w-4 h-4 text-emerald-500" />
        Patch proposed
        <span className="ml-auto font-mono text-[11px] text-slate-500">3/3 models</span>
      </div>
      <div className="mt-3 rounded-md bg-[#121212] border border-white/10 font-mono text-[11px] leading-5 overflow-hidden">
        <div className="px-2.5 text-slate-500">  pub fn transfer(…) {'{'}</div>
        <div className="px-2.5 bg-emerald-500/10 text-emerald-300">+   from.require_auth();</div>
        <div className="px-2.5 bg-accent/15 text-[#fdda24]">-   let bal = read(…).unwrap();</div>
        <div className="px-2.5 bg-emerald-500/10 text-emerald-300">+   let bal = read(…)?;</div>
      </div>
    </>
  );
}

function AnchorCard() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500">
        <Check className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-900 dark:text-white leading-tight">Sealed on ledger</p>
        <p className="text-[11px] text-slate-500 font-mono truncate">#51,203,118 · risk 82</p>
      </div>
    </div>
  );
}
