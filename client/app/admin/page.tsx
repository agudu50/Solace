'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  Check,
  FileCode,
  Gauge,
  Lock,
  LogOut,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  User as UserIcon,
  Users,
  Wrench,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import {
  adjustCreditsAdmin,
  fetchAdminAudits,
  fetchAdminLogs,
  fetchAdminPurchases,
  fetchAdminStats,
  fetchAdminUsers,
  fetchCurrentUserSession,
  updateUserRoleAdmin,
  updateUserStatusAdmin,
  type AuthUser,
} from '../../utils/solaceService';
import {
  fetchAdminIssues,
  fetchAdminMetrics,
  fetchAdminPresence,
  updateAdminIssue,
  type Issue,
  type IssueStatus,
  type Metrics,
  type Presence,
} from '../../utils/opsService';
import { Tile, TileHeader, Tray } from '../../components/dashboard/Overview';
import { Orb, Segmented } from '../../components/audit/StudioParts';
import { CountUp, EASE_OUT } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

type Tab = 'overview' | 'issues' | 'users' | 'credits' | 'audits' | 'logs';

const LIVE_MS = 10_000;
const ISSUES_MS = 30_000;
const STELLAR_KEY = /^G[A-Z0-9]{55}$/;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function ago(input?: string | number | null) {
  if (!input) return '—';
  const ms = typeof input === 'number' ? input : Date.parse(input);
  if (Number.isNaN(ms)) return '—';
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function duration(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

const short = (w?: string | null) => (w ? `${w.slice(0, 5)}…${w.slice(-4)}` : '');

function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' | 'info'; children: React.ReactNode }) {
  const cls = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
    ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    bad: 'bg-red-500/10 text-red-600 dark:text-red-400',
    accent: 'bg-accent/10 text-accent',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  }[tone];
  return <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-md text-[10px] font-medium whitespace-nowrap ${cls}`}>{children}</span>;
}

const SEVERITY_TONE: Record<Issue['severity'], 'neutral' | 'warn' | 'bad' | 'accent'> = {
  low: 'neutral',
  medium: 'warn',
  high: 'accent',
  critical: 'bad',
};
const STATUS_LABEL: Record<IssueStatus, string> = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' };
const STATUS_TONE: Record<IssueStatus, 'bad' | 'info' | 'ok'> = { open: 'bad', in_progress: 'info', resolved: 'ok' };

const ENDPOINT_DICTIONARY: Record<string, { name: string; category: string; description: string }> = {
  '/api/admin/presence': {
    name: 'Admin Heartbeat Presence',
    category: 'Console Telemetry',
    description: 'Real-time operator presence & console sync',
  },
  '/api/admin/metrics': {
    name: 'Platform Performance Metrics',
    category: 'Monitoring',
    description: 'Requests per minute, latency and error rates',
  },
  '/api/admin/issues': {
    name: 'System Issues & Incident Log',
    category: 'System Health',
    description: 'Error diagnostics, bug reports and alerts',
  },
  '/api/admin/users': {
    name: 'Auditor & Wallet Management',
    category: 'Governance',
    description: 'Account directory, roles and status',
  },
  '/api/admin/stats': {
    name: 'Platform Analytics & Growth',
    category: 'Analytics',
    description: 'Global audit volume, protocol 22 stats and credits',
  },
  '/api/credits/balance': {
    name: 'Prepaid Audit Credits Balance',
    category: 'Auditor Billing',
    description: 'Wallet prepaid audit credits verification',
  },
  '/api/credits/consume': {
    name: 'Audit Credit Deduction',
    category: 'Auditor Billing',
    description: 'Consuming non-expiring audit credit upon AST scan',
  },
  '/api/credits/purchase': {
    name: 'Credit Bundle Purchase',
    category: 'Auditor Billing',
    description: 'XLM transfer processing on Stellar network',
  },
  '/api/contract/fee': {
    name: 'Soroban Network Fee Estimator',
    category: 'Stellar RPC',
    description: 'Gas budget, CPU instructions & ledger storage fees',
  },
  '/api/contract/record': {
    name: 'Stellar Ledger Audit Anchoring',
    category: 'Stellar Soroban',
    description: 'Cryptographically anchoring audit receipt on-chain',
  },
  '/api/auth/me': {
    name: 'Auditor Session & Profile',
    category: 'Authentication',
    description: 'Validating authenticated wallet session',
  },
  '/api/auth/challenge': {
    name: 'Cryptographic Auth Challenge',
    category: 'Authentication',
    description: 'Issuing 256-bit nonce for Ed25519 signature',
  },
  '/api/auth/verify': {
    name: 'Wallet Signature Verification',
    category: 'Authentication',
    description: 'Verifying Freighter Ed25519 cryptographic signature',
  },
  '/api/audit/run': {
    name: 'Dual Flash AST Engine',
    category: 'Security AST',
    description: 'Multi-LLM consensus audit inspection on Soroban code',
  },
};

function getEndpointInfo(route: string) {
  for (const [key, info] of Object.entries(ENDPOINT_DICTIONARY)) {
    if (route === key || route.startsWith(key)) {
      return info;
    }
  }
  const clean = route.replace(/^\/api\//, '').replace(/\/:\w+/g, '');
  const readable = clean
    .split('/')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/[-_]/g, ' '))
    .join(' · ');
  return {
    name: readable || route,
    category: 'API Service',
    description: route,
  };
}

function formatIssueHuman(title: string): { title: string; subtitle?: string; technical: string } {
  if (title.includes('/api/contract/record') || title.toLowerCase().includes('contract/record failed')) {
    return {
      title: 'Stellar Ledger Anchoring Failure (HTTP 500)',
      subtitle: 'The Soroban testnet smart contract rejected the transaction or the RPC node timed out.',
      technical: 'POST /api/contract/record',
    };
  }
  if (title.includes('/api/auth/challenge')) {
    return {
      title: 'Wallet Authentication Challenge Error',
      subtitle: 'Failed to issue cryptographic challenge nonce for Freighter wallet.',
      technical: 'POST /api/auth/challenge',
    };
  }
  if (title.includes('/api/credits')) {
    return {
      title: 'Credit Accounting Service Error',
      subtitle: 'Failed to verify or deduct audit credits.',
      technical: title,
    };
  }
  if (title.startsWith('POST ') || title.startsWith('GET ') || title.startsWith('PUT ')) {
    const parts = title.split(' ');
    const method = parts[0];
    const path = parts[1] || '';
    const status = parts[parts.length - 1] || '';
    return {
      title: `${getEndpointInfo(path).name} Error ${status}`,
      subtitle: `The server encountered an error while processing the request.`,
      technical: title,
    };
  }
  return { title, technical: title };
}

const input =
  'w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0e0e] px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminConsolePage() {
  const { disconnect } = useWallet();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [me, setMe] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveAt, setLiveAt] = useState<number>(0);
  const [, tick] = useState(0);

  // Credit grant form (also opened from the Users tab)
  const [grantWallet, setGrantWallet] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const sessionUser = await fetchCurrentUserSession();
      if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'super_admin')) {
        setAuthorized(false);
        return;
      }
      setMe(sessionUser);
      setAuthorized(true);
      const [s, u, a, p, l, i, pr, m] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminAudits().catch(() => []),
        fetchAdminPurchases().catch(() => []),
        fetchAdminLogs().catch(() => []),
        fetchAdminIssues().catch(() => []),
        fetchAdminPresence().catch(() => null),
        fetchAdminMetrics().catch(() => null),
      ]);
      setStats(s);
      setUsers(u || []);
      setAudits(a || []);
      setLedger(p || []);
      setLogs(l || []);
      setIssues(i || []);
      setPresence(pr);
      setMetrics(m);
      setLiveAt(Date.now());
    } catch (err) {
      toast.error(err, 'Failed to load the admin console.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Live polling (paused while the tab is hidden)
  useEffect(() => {
    if (!authorized) return;
    const live = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const [pr, m] = await Promise.all([fetchAdminPresence().catch(() => null), fetchAdminMetrics().catch(() => null)]);
      if (pr) setPresence(pr);
      if (m) setMetrics(m);
      setLiveAt(Date.now());
    }, LIVE_MS);
    const slow = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const i = await fetchAdminIssues().catch(() => null);
      if (i) setIssues(i);
    }, ISSUES_MS);
    const clock = setInterval(() => tick((n) => n + 1), 5000); // keep "x ago" labels fresh
    return () => {
      clearInterval(live);
      clearInterval(slow);
      clearInterval(clock);
    };
  }, [authorized]);

  const openIssues = issues.filter((i) => i.status === 'open').length;
  const inProgress = issues.filter((i) => i.status === 'in_progress').length;
  const isSuper = me?.role === 'super_admin';

  const giveCreditsTo = (wallet: string) => {
    setGrantWallet(wallet);
    setTab('credits');
    setTimeout(() => amountRef.current?.focus(), 350);
  };

  /* -------------------------- gates -------------------------- */

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] grid place-items-center bg-[#f2f2f0] dark:bg-[#0b0b0b]">
        <div className="text-center">
          <Orb active>
            <ShieldCheck className="w-5 h-5 text-accent" />
          </Orb>
          <p className="mt-6 font-mono text-xs text-slate-500 tracking-wider">Verifying administrator session…</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[calc(100vh-65px)] grid place-items-center p-6 bg-[#f2f2f0] dark:bg-[#0b0b0b] text-center">
        <div className="w-full max-w-md rounded-[18px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] p-8">
          <span className="mx-auto grid place-items-center w-11 h-11 rounded-xl bg-red-500/10 text-red-500">
            <Lock className="w-5 h-5" />
          </span>
          <h1 className="mt-5 text-xl font-medium tracking-tight text-slate-900 dark:text-white">Administrators only</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            This console needs an administrator session. Your current account isn&apos;t authorised to manage the platform.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/admin/login" className={btn.primary}>
              <ShieldCheck className="w-4 h-4" />
              Go to admin sign-in
            </Link>
            <Link href="/" className={btn.secondary}>
              Return to Solace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------- render -------------------------- */

  const TABS: { value: Tab; label: React.ReactNode }[] = [
    { value: 'overview', label: <><Gauge className="w-3.5 h-3.5" />Overview</> },
    {
      value: 'issues',
      label: (
        <>
          <Wrench className="w-3.5 h-3.5" />
          Issues
          {openIssues > 0 && <span className="ml-0.5 px-1.5 rounded bg-red-500 text-white text-[10px] leading-4">{openIssues}</span>}
        </>
      ),
    },
    { value: 'users', label: <><Users className="w-3.5 h-3.5" />Users</> },
    { value: 'credits', label: <><Coins className="w-3.5 h-3.5" />Credits</> },
    { value: 'audits', label: <><FileCode className="w-3.5 h-3.5" />Audits</> },
    { value: 'logs', label: <><ScrollText className="w-3.5 h-3.5" />Activity log</> },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#f2f2f0] dark:bg-[#0b0b0b] text-slate-800 dark:text-slate-100 pb-24 md:pb-10">
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill tone="accent">
                <ShieldCheck className="w-3 h-3" />
                {isSuper ? 'Super admin' : 'Admin'}
              </Pill>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 animate-ping-soft" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                Live · updated {ago(liveAt)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-slate-900 dark:text-white">Admin console</h1>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as <span className="font-mono text-slate-700 dark:text-slate-300">{me?.address ? short(me.address) : me?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadAll} disabled={refreshing} className={`${btn.secondary} h-10`}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button type="button" onClick={disconnect} className={`${btn.secondary} h-10`}>
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <Segmented id="admin-tab" label="Admin sections" value={tab} onChange={setTab} options={TABS} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="space-y-3 sm:space-y-4"
          >
            {tab === 'overview' && (
              <OverviewTab
                stats={stats}
                users={users}
                presence={presence}
                metrics={metrics}
                issues={issues}
                openIssues={openIssues}
                inProgress={inProgress}
                onOpenIssues={() => setTab('issues')}
              />
            )}
            {tab === 'issues' && <IssuesTab issues={issues} setIssues={setIssues} />}
            {tab === 'users' && (
              <UsersTab users={users} isSuper={isSuper} meAddress={me?.address || undefined} onGiveCredits={giveCreditsTo} onChanged={loadAll} />
            )}
            {tab === 'credits' && (
              <CreditsTab
                wallet={grantWallet}
                setWallet={setGrantWallet}
                amountRef={amountRef}
                ledger={ledger}
                users={users}
                onDone={loadAll}
              />
            )}
            {tab === 'audits' && <AuditsTab audits={audits} />}
            {tab === 'logs' && <LogsTab logs={logs} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({
  stats,
  users,
  presence,
  metrics,
  issues,
  openIssues,
  inProgress,
  onOpenIssues,
}: {
  stats: any;
  users: any[];
  presence: Presence | null;
  metrics: Metrics | null;
  issues: Issue[];
  openIssues: number;
  inProgress: number;
  onOpenIssues: () => void;
}) {
  const credits = stats?.credits || {};
  const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
  const suspended = users.filter((u) => u.status !== 'active').length;

  const KPIS = [
    {
      label: 'Online now',
      icon: Activity,
      value: presence?.online ?? 0,
      foot: presence ? `${presence.signedIn} signed in · ${presence.anonymous} visitors` : 'Waiting for heartbeats',
      live: true,
    },
    { label: 'Registered users', icon: Users, value: users.length, foot: `${admins} admins · ${suspended} suspended` },
    { label: 'Open issues', icon: Wrench, value: openIssues, foot: `${inProgress} in progress`, warn: openIssues > 0 },
    {
      label: 'Credits outstanding',
      icon: Coins,
      value: credits.activeOutstanding ?? 0,
      foot: `${credits.totalIssued ?? 0} issued · ${credits.totalConsumed ?? 0} used`,
    },
  ];

  const maxRpm = Math.max(1, ...(metrics?.perMinute.map((m) => m.requests) || [1]));
  const errorPct = metrics ? (metrics.errorRate * 100).toFixed(metrics.errorRate < 0.01 ? 2 : 1) : '0';

  return (
    <>
      <Tray>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <Tile key={k.label} className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{k.label}</span>
                  {k.live && (
                    <span className="relative flex w-2 h-2" aria-hidden>
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 animate-ping-soft" />
                      <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
                <p className={`mt-6 text-4xl font-medium tracking-tight tabular-nums leading-none ${k.warn ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                  {/* "Online now" updates every 10s; CountUp would restart from 0 each time */}
                  {k.live ? k.value : <CountUp value={String(k.value)} />}
                </p>
                <p className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.07] text-[11px] text-slate-500 truncate">{k.foot}</p>
              </Tile>
            );
          })}
        </div>
      </Tray>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Live visitors */}
        <Tray className="lg:col-span-5">
          <Tile className="h-full flex flex-col">
            <TileHeader title="Who's on Solace" action={<Pill tone="ok">{presence?.online ?? 0} online</Pill>} />
            <div className="px-4 sm:px-5 pt-4 pb-5 space-y-5 flex-1">
              <div>
                <p className="mb-2 text-xs text-slate-500">By page</p>
                {presence && presence.byPage.length > 0 ? (
                  <ul className="space-y-1.5">
                    {presence.byPage.slice(0, 6).map((p) => (
                      <li key={p.path} className="flex items-center gap-3 text-xs">
                        <span className="w-24 shrink-0 font-mono text-slate-600 dark:text-slate-400 truncate">{p.path}</span>
                        <span className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                          <motion.span
                            className="block h-full rounded-full bg-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${(p.count / presence.online) * 100}%` }}
                            transition={{ duration: 0.6, ease: EASE_OUT }}
                          />
                        </span>
                        <span className="w-5 text-right tabular-nums text-slate-900 dark:text-white">{p.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">Nobody else is online right now.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Visitors</p>
                <ul className="divide-y divide-slate-200/70 dark:divide-white/[0.07] max-h-64 overflow-y-auto modern-code-scrollbar">
                  {(presence?.visitors || []).slice(0, 25).map((v) => (
                    <li key={v.id} className="py-2 flex items-center gap-3 text-xs">
                      <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-500 shrink-0">
                        <UserIcon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 dark:text-white truncate">
                          {v.wallet ? <span className="font-mono">{short(v.wallet)}</span> : v.email || 'Anonymous visitor'}
                          {v.role && v.role !== 'user' && <span className="ml-1.5"><Pill tone="accent">{v.role}</Pill></span>}
                        </p>
                        <p className="text-slate-500 truncate">
                          on <span className="font-mono">{v.path}</span> · {duration(v.sessionSeconds)} session
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{v.lastSeenSecondsAgo}s</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Tile>
        </Tray>

        {/* System health */}
        <Tray className="lg:col-span-7">
          <Tile className="h-full flex flex-col">
            <TileHeader
              title="System health"
              action={
                <Pill tone={!metrics ? 'neutral' : metrics.errorRate > 0.05 ? 'bad' : metrics.errorRate > 0.01 ? 'warn' : 'ok'}>
                  {!metrics ? 'No data' : metrics.errorRate > 0.05 ? 'Degraded' : 'Healthy'}
                </Pill>
              }
            />
            <div className="px-4 sm:px-5 pt-4 pb-5 space-y-5">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Requests (15m)', metrics?.requests ?? 0],
                  ['Server errors', `${metrics?.errors5xx ?? 0} · ${errorPct}%`],
                  ['Latency p50 / p95', metrics ? `${metrics.latency.p50} / ${metrics.latency.p95} ms` : '—'],
                  ['API uptime', metrics ? duration(metrics.uptimeSeconds) : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl bg-white dark:bg-[#141414] border border-slate-200/70 dark:border-white/[0.07] p-3">
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="mt-1 text-base font-medium tabular-nums text-slate-900 dark:text-white truncate">{v}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="mb-2 text-xs text-slate-500">Requests per minute · last 15 minutes</p>
                <div className="flex items-end gap-1 h-24" role="img" aria-label="Requests per minute, last 15 minutes">
                  {(metrics?.perMinute || Array.from({ length: 15 }, () => ({ requests: 0, errors: 0 }))).map((m, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end" title={`${m.requests} requests, ${m.errors} errors`}>
                      <motion.div
                        className="w-full rounded-t-[4px] bg-slate-300 dark:bg-white/20 relative overflow-hidden"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(2, (m.requests / maxRpm) * 100)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.02, ease: EASE_OUT }}
                      >
                        {m.errors > 0 && (
                          <span className="absolute inset-x-0 bottom-0 bg-red-500" style={{ height: `${(m.errors / Math.max(1, m.requests)) * 100}%` }} />
                        )}
                      </motion.div>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>15m ago</span>
                  <span>now</span>
                </div>
              </div>

              {metrics && metrics.topRoutes.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Busiest endpoints & services</p>
                    <span className="text-[11px] text-slate-500 font-mono">Last 15 minutes</span>
                  </div>
                  <ul className="divide-y divide-slate-200/70 dark:divide-white/[0.07] text-xs">
                    {metrics.topRoutes.map((r) => {
                      const info = getEndpointInfo(r.route);
                      return (
                        <li key={r.route} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {info.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">
                                {info.category}
                              </span>
                            </div>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={r.route}>
                              {r.route}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded text-xs">
                              {r.count} req
                            </span>
                            <span className="tabular-nums text-slate-500 w-16 text-right font-mono text-xs">
                              {r.avgMs} ms
                            </span>
                            {r.errors > 0 ? (
                              <Pill tone="bad">{r.errors} err</Pill>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium w-11 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                100%
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </Tile>
        </Tray>
      </div>

      {/* Issues preview */}
      <Tray>
        <Tile>
          <TileHeader
            title="Needs attention"
            action={
              <button type="button" onClick={onOpenIssues} className={`${btn.secondary} h-8 px-3 text-xs rounded-full`}>
                Open issues
              </button>
            }
          />
          <ul className="px-4 sm:px-5 pb-4 pt-2 divide-y divide-slate-200/70 dark:divide-white/[0.07]">
            {issues.filter((i) => i.status !== 'resolved').slice(0, 4).map((i) => {
              const formatted = formatIssueHuman(i.title);
              return (
                <li key={i.id} className="py-3 flex items-start gap-3">
                  <Pill tone={SEVERITY_TONE[i.severity]}>{i.severity}</Pill>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {formatted.title}
                    </p>
                    {formatted.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {formatted.subtitle}
                      </p>
                    )}
                    <span className="inline-block mt-1 font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
                      {formatted.technical}
                    </span>
                  </div>
                  {i.occurrences > 1 && <span className="text-[11px] text-slate-500 shrink-0">×{i.occurrences}</span>}
                  <span className="text-[11px] text-slate-500 shrink-0">{ago(i.last_seen_at)}</span>
                </li>
              );
            })}
            {issues.filter((i) => i.status !== 'resolved').length === 0 && (
              <li className="py-6 flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Nothing needs attention. All issues are resolved.
              </li>
            )}
          </ul>
        </Tile>
      </Tray>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Issues                                                              */
/* ------------------------------------------------------------------ */

function IssuesTab({ issues, setIssues }: { issues: Issue[]; setIssues: React.Dispatch<React.SetStateAction<Issue[]>> }) {
  const toast = useToast();
  const [filter, setFilter] = useState<IssueStatus | 'all'>('open');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const counts = {
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  const shown = issues.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      (!q || `${i.title} ${i.description || ''} ${i.page || ''} ${i.wallet_address || ''} ${i.email || ''}`.toLowerCase().includes(q.toLowerCase())),
  );

  const move = async (issue: Issue, status: IssueStatus) => {
    const note = notes[issue.id]?.trim();
    if (status === 'resolved' && (!note || note.length < 3)) {
      toast.show({ tone: 'error', title: 'Add a resolution note', message: 'Say briefly what fixed it before resolving.' });
      setExpanded(issue.id);
      return;
    }
    setBusy(issue.id);
    try {
      const updated = await updateAdminIssue(issue.id, status, note || undefined);
      setIssues((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      toast.success(status === 'resolved' ? 'Issue resolved' : `Marked ${STATUS_LABEL[status].toLowerCase()}`, updated.title);
      if (status === 'resolved') setExpanded(null);
    } catch (err) {
      toast.error(err, 'Could not update the issue.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Tray>
      <Tile>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
          <h2 className="text-[15px] font-medium tracking-tight text-slate-900 dark:text-white flex-1">Issues queue</h2>
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search issues" aria-label="Search issues" className={`${input} h-9 pl-9`} />
          </div>
          <Segmented
            id="issue-filter"
            label="Issue status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: `Open ${counts.open}` },
              { value: 'in_progress', label: `In progress ${counts.in_progress}` },
              { value: 'resolved', label: `Resolved ${counts.resolved}` },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>

        <ul className="mt-3 divide-y divide-slate-200/70 dark:divide-white/[0.07]">
          {shown.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-slate-500">
              {filter === 'open' ? 'No open issues. Nice.' : 'Nothing matches this filter.'}
            </li>
          )}
          {shown.map((i) => {
            const isOpen = expanded === i.id;
            return (
              <li key={i.id} className={isOpen ? 'bg-white/60 dark:bg-white/[0.02]' : ''}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-4 sm:px-5 py-3.5 flex items-start gap-3 hover:bg-white/70 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      i.status === 'resolved' ? 'bg-emerald-500' : i.status === 'in_progress' ? 'bg-sky-500' : i.severity === 'critical' ? 'bg-red-500' : 'bg-accent'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatIssueHuman(i.title).title}</p>
                    {formatIssueHuman(i.title).subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatIssueHuman(i.title).subtitle}</p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <Pill tone={i.source === 'system' ? 'info' : 'neutral'}>{i.source === 'system' ? 'System' : 'User report'}</Pill>
                      <Pill tone={SEVERITY_TONE[i.severity]}>{i.severity}</Pill>
                      <Pill tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Pill>
                      {i.occurrences > 1 && <span>×{i.occurrences} occurrences</span>}
                      <span className="font-mono bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                        {formatIssueHuman(i.title).technical}
                      </span>
                      <span>· last {ago(i.last_seen_at)}</span>
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 sm:pl-10 space-y-4">
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <dt className="text-slate-500">Reported by</dt>
                            <dd className="mt-0.5 text-slate-900 dark:text-white truncate font-mono">
                              {i.wallet_address ? short(i.wallet_address) : i.email || (i.source === 'system' ? 'Server' : 'Anonymous')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">First seen</dt>
                            <dd className="mt-0.5 text-slate-900 dark:text-white">{new Date(i.created_at).toLocaleString()}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Type</dt>
                            <dd className="mt-0.5 text-slate-900 dark:text-white">{i.kind.replace('_', ' ')}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">ID</dt>
                            <dd className="mt-0.5 text-slate-900 dark:text-white font-mono truncate">{i.id}</dd>
                          </div>
                        </dl>
                        {i.description && (
                          <pre className="whitespace-pre-wrap break-words rounded-lg bg-white dark:bg-[#0e0e0e] border border-slate-200/70 dark:border-white/[0.07] p-3 text-xs text-slate-700 dark:text-slate-300 font-sans">
                            {i.description}
                          </pre>
                        )}
                        {i.status === 'resolved' ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
                            <p className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">Resolved</span>
                              {i.resolved_by && <> by <span className="font-mono">{short(i.resolved_by) || i.resolved_by}</span></>}
                              {i.resolution_note && <> · {i.resolution_note}</>}
                            </p>
                            <button type="button" disabled={busy === i.id} onClick={() => move(i, 'open')} className={`${btn.secondary} h-8 px-3 text-xs`}>
                              Reopen
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label htmlFor={`note-${i.id}`} className="block text-xs text-slate-500">
                              Resolution note
                            </label>
                            <textarea
                              id={`note-${i.id}`}
                              rows={2}
                              value={notes[i.id] || ''}
                              onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                              placeholder="What fixed it? (required to resolve)"
                              className={`${input} h-auto py-2 resize-none`}
                            />
                            <div className="flex flex-wrap gap-2 justify-end">
                              {i.status === 'open' && (
                                <button type="button" disabled={busy === i.id} onClick={() => move(i, 'in_progress')} className={`${btn.secondary} h-8 px-3 text-xs`}>
                                  Start working on it
                                </button>
                              )}
                              <button type="button" disabled={busy === i.id} onClick={() => move(i, 'resolved')} className={`${btn.primary} h-8 px-3 text-xs`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Mark resolved
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Tile>
    </Tray>
  );
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

function UsersTab({
  users,
  isSuper,
  meAddress,
  onGiveCredits,
  onChanged,
}: {
  users: any[];
  isSuper: boolean;
  meAddress?: string;
  onGiveCredits: (wallet: string) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const shown = users.filter((u) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return [u.wallet_address, u.email, u.name, u.role, u.status].some((v) => (v || '').toLowerCase().includes(t));
  });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      onChanged();
    } catch (err) {
      toast.error(err, 'Action failed.');
    }
  };

  return (
    <Tray>
      <Tile>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
          <h2 className="text-[15px] font-medium tracking-tight text-slate-900 dark:text-white flex-1">
            Users <span className="text-slate-500 font-normal">· {users.length}</span>
          </h2>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wallet, email, name, role" aria-label="Search users" className={`${input} h-9 pl-9`} />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-200/70 dark:border-white/[0.07]">
                <th className="px-4 sm:px-5 py-2.5 font-normal">User</th>
                <th className="px-3 py-2.5 font-normal">Role</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
                <th className="px-3 py-2.5 font-normal text-right">Credits</th>
                <th className="px-3 py-2.5 font-normal">Last sign-in</th>
                <th className="px-4 sm:px-5 py-2.5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.07]">
              {shown.map((u) => {
                const self = !!meAddress && u.wallet_address === meAddress;
                const isAdminRole = u.role === 'admin' || u.role === 'super_admin';
                return (
                  <tr key={u.id || u.wallet_address || u.email} className="hover:bg-white/70 dark:hover:bg-white/[0.02]">
                    <td className="px-4 sm:px-5 py-3">
                      <p className="text-sm text-slate-900 dark:text-white">{u.name || (u.wallet_address ? 'Wallet user' : u.email)}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-slate-500">
                        {u.wallet_address ? (
                          <>
                            <span className="font-mono">{short(u.wallet_address)}</span>
                            <button
                              type="button"
                              aria-label="Copy wallet"
                              onClick={() => {
                                navigator.clipboard.writeText(u.wallet_address);
                                setCopied(u.wallet_address);
                                setTimeout(() => setCopied(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {copied === u.wallet_address ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </>
                        ) : (
                          <span>No wallet linked</span>
                        )}
                        {u.email && u.wallet_address && <span>· {u.email}</span>}
                        {self && <Pill tone="accent">You</Pill>}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={isAdminRole ? 'accent' : 'neutral'}>{u.role.replace('_', ' ')}</Pill>
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={u.status === 'active' ? 'ok' : 'bad'}>{u.status}</Pill>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-sm text-slate-900 dark:text-white">{u.credit_balance ?? 0}</td>
                    <td className="px-3 py-3 text-slate-500">{ago(u.last_login_at)}</td>
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {u.wallet_address && (
                          <button type="button" onClick={() => onGiveCredits(u.wallet_address)} className={`${btn.secondary} h-7 px-2.5 text-[11px]`}>
                            <Coins className="w-3 h-3" />
                            Give credits
                          </button>
                        )}
                        {u.wallet_address && !self && (
                          <button
                            type="button"
                            onClick={() =>
                              run(
                                () => updateUserStatusAdmin(u.wallet_address, u.status === 'active' ? 'suspended' : 'active', 'Admin console'),
                                u.status === 'active' ? 'User suspended' : 'User reactivated',
                              )
                            }
                            className={`${btn.secondary} h-7 px-2.5 text-[11px] ${u.status === 'active' ? 'hover:!text-red-500' : ''}`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                        {isSuper && u.wallet_address && !self && u.role !== 'super_admin' && (
                          <button
                            type="button"
                            onClick={() =>
                              run(
                                () => updateUserRoleAdmin(u.wallet_address, u.role === 'admin' ? 'user' : 'admin', 'Admin console'),
                                u.role === 'admin' ? 'Admin rights removed' : 'Promoted to admin',
                              )
                            }
                            className={`${btn.secondary} h-7 px-2.5 text-[11px]`}
                          >
                            {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    No users match “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Tile>
    </Tray>
  );
}

/* ------------------------------------------------------------------ */
/* Credits                                                             */
/* ------------------------------------------------------------------ */

function CreditsTab({
  wallet,
  setWallet,
  amountRef,
  ledger,
  users,
  onDone,
}: {
  wallet: string;
  setWallet: (w: string) => void;
  amountRef: React.RefObject<HTMLInputElement>;
  ledger: any[];
  users: any[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState(3);
  const [mode, setMode] = useState<'grant' | 'deduct'>('grant');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const normalized = wallet.trim().toUpperCase();
  const validKey = STELLAR_KEY.test(normalized);
  const existing = useMemo(() => users.find((u) => u.wallet_address === normalized), [users, normalized]);
  const delta = mode === 'grant' ? amount : -amount;
  const canSubmit = validKey && amount > 0 && reason.trim().length >= 3 && !(mode === 'deduct' && !existing);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res: any = await adjustCreditsAdmin(normalized, delta, reason.trim());
      toast.success(
        `${mode === 'grant' ? 'Granted' : 'Deducted'} ${amount} credit${amount === 1 ? '' : 's'}`,
        `${short(normalized)} now has ${res?.newBalance ?? '?'}${res?.accountCreated ? ' · new account created' : ''}.`,
      );
      setReason('');
      onDone();
    } catch (err) {
      toast.error(err, 'Credit adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
      <Tray className="lg:col-span-5">
        <Tile>
          <TileHeader title="Give or deduct credits" />
          <form onSubmit={submit} className="px-4 sm:px-5 pt-4 pb-5 space-y-4" noValidate>
            <Segmented
              id="credit-mode"
              label="Adjustment type"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'grant', label: <><PlusCircle className="w-3.5 h-3.5" />Grant</> },
                { value: 'deduct', label: <><MinusCircle className="w-3.5 h-3.5" />Deduct</> },
              ]}
            />
            <div>
              <label htmlFor="grant-wallet" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stellar wallet
              </label>
              <input
                id="grant-wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="G…  (56 characters)"
                spellCheck={false}
                autoComplete="off"
                className={`${input} font-mono text-xs ${touched && !validKey ? '!border-red-400' : ''}`}
                aria-invalid={touched && !validKey}
              />
              <p className="mt-1.5 text-[11px] min-h-4">
                {!wallet ? (
                  <span className="text-slate-500">Paste any Stellar public key.</span>
                ) : !validKey ? (
                  <span className="text-red-500">Not a valid Stellar public key.</span>
                ) : existing ? (
                  <span className="text-slate-500">
                    {existing.name || existing.email || 'Registered wallet'} · balance{' '}
                    <span className="text-slate-900 dark:text-white tabular-nums">{existing.credit_balance ?? 0}</span>
                  </span>
                ) : mode === 'deduct' ? (
                  <span className="text-red-500">This wallet has no account, so there is nothing to deduct.</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">New wallet: an account will be created with these credits.</span>
                )}
              </p>
            </div>

            <div>
              <label htmlFor="grant-amount" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Credits <span className="text-slate-400 font-normal">(1 credit = 1 audit = 10 XLM)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="grant-amount"
                  ref={amountRef}
                  type="number"
                  min={1}
                  max={1000}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Math.min(1000, parseInt(e.target.value || '0', 10))))}
                  className="w-24 shrink-0 h-10 rounded-md border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-[#0e0e0e] px-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 tabular-nums shadow-xs"
                />
                {[1, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(n)}
                    className={`flex-1 h-10 rounded-md border-2 text-sm font-bold transition-all cursor-pointer ${
                      amount === n
                        ? 'border-accent bg-accent text-slate-950 shadow-sm scale-[1.02]'
                        : 'border-slate-300 dark:border-white/15 bg-white/70 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="grant-reason" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reason <span className="text-slate-400 font-normal">(saved in the activity log)</span>
              </label>
              <input
                id="grant-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Hackathon sponsor grant"
                maxLength={200}
                className={`${input} ${touched && reason.trim().length < 3 ? '!border-red-400' : ''}`}
              />
            </div>

            <button type="submit" disabled={submitting || (touched && !canSubmit)} className={`${btn.primary} w-full`}>
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              {mode === 'grant' ? `Grant ${amount || 0} credit${amount === 1 ? '' : 's'}` : `Deduct ${amount || 0} credit${amount === 1 ? '' : 's'}`}
            </button>
          </form>
        </Tile>
      </Tray>

      <Tray className="lg:col-span-7">
        <Tile className="h-full">
          <TileHeader title="Credit ledger" action={<Pill>{ledger.length} entries</Pill>} />
          <ul className="mt-2 divide-y divide-slate-200/70 dark:divide-white/[0.07] max-h-[520px] overflow-y-auto modern-code-scrollbar">
            {ledger.length === 0 && <li className="px-5 py-12 text-center text-sm text-slate-500">No purchases or adjustments yet.</li>}
            {ledger.map((p, i) => {
              const adj = p.type === 'ADMIN_ADJUSTMENT';
              const amt = Number(p.amount) || 0;
              return (
                <li key={p.id || i} className="px-4 sm:px-5 py-3 flex items-center gap-3 text-xs">
                  <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${adj ? 'bg-accent text-slate-950 font-bold' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {adj ? <Wrench className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-900 dark:text-white truncate">
                      {adj ? 'Admin adjustment' : `Purchase${p.package_id ? ` · ${p.package_id}` : ''}`}
                      <span className="ml-2 font-mono text-xs text-slate-500">{short(p.wallet_address)}</span>
                    </p>
                    <p className="text-slate-500 truncate">
                      {p.reason || (p.tx_hash ? `tx ${p.tx_hash.slice(0, 10)}…` : '—')} · {ago(p.created_at)}
                    </p>
                  </div>
                  <span className={`tabular-nums text-sm ${amt < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {amt > 0 ? '+' : ''}
                    {amt}
                  </span>
                </li>
              );
            })}
          </ul>
        </Tile>
      </Tray>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audits & logs                                                       */
/* ------------------------------------------------------------------ */

function AuditsTab({ audits }: { audits: any[] }) {
  return (
    <Tray>
      <Tile>
        <TileHeader title="Platform audits" action={<Pill>{audits.length} latest</Pill>} />
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-200/70 dark:border-white/[0.07]">
                <th className="px-4 sm:px-5 py-2.5 font-normal">Contract</th>
                <th className="px-3 py-2.5 font-normal">Auditor</th>
                <th className="px-3 py-2.5 font-normal text-right">Score</th>
                <th className="px-3 py-2.5 font-normal">Verdict</th>
                <th className="px-4 sm:px-5 py-2.5 font-normal">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.07]">
              {audits.map((a, i) => (
                <tr key={a.id || i}>
                  <td className="px-4 sm:px-5 py-3">
                    <p className="text-sm text-slate-900 dark:text-white">{a.contract_name || 'Soroban contract'}</p>
                    <p className="font-mono text-slate-500 truncate max-w-[16rem]">{a.contract_hash}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-400">{short(a.wallet_address) || '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-slate-900 dark:text-white">{a.risk_score ?? '—'}</td>
                  <td className="px-3 py-3">
                    <Pill tone={a.is_secure ? 'ok' : 'bad'}>{a.is_secure ? 'Secure' : 'Action required'}</Pill>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-slate-500">{ago(a.created_at)}</td>
                </tr>
              ))}
              {audits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No audits recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Tile>
    </Tray>
  );
}

function LogsTab({ logs }: { logs: any[] }) {
  const tone = (a: string) =>
    /CREDIT/.test(a) ? 'accent' : /RESOLVED/.test(a) ? 'ok' : /SUSPEND|REVOK|ROLE/.test(a) ? 'warn' : 'neutral';
  return (
    <Tray>
      <Tile>
        <TileHeader title="Admin activity log" action={<Pill>{logs.length} entries</Pill>} />
        <ul className="mt-2 divide-y divide-slate-200/70 dark:divide-white/[0.07]">
          {logs.length === 0 && <li className="px-5 py-12 text-center text-sm text-slate-500">No admin actions recorded yet.</li>}
          {logs.map((l, i) => {
            let details = l.details;
            if (typeof details === 'string') {
              try {
                details = JSON.parse(details);
              } catch (_) {}
            }
            const summary =
              details && typeof details === 'object'
                ? Object.entries(details)
                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' · ')
                : String(details || '');
            return (
              <li key={l.id || i} className="px-4 sm:px-5 py-3 flex items-start gap-3 text-xs">
                <span className="mt-0.5">
                  <Pill tone={tone(l.action || '') as any}>{(l.action || 'ACTION').replace(/_/g, ' ').toLowerCase()}</Pill>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 dark:text-white">
                    <span className="font-mono">{short(l.actor_wallet) || l.actor_wallet || 'admin'}</span>
                    <span className="text-slate-500"> → </span>
                    <span className="font-mono">{l.target?.startsWith?.('G') ? short(l.target) : l.target}</span>
                  </p>
                  {summary && <p className="mt-0.5 text-slate-500 break-words">{summary}</p>}
                </div>
                <span className="text-slate-500 shrink-0">{ago(l.created_at)}</span>
              </li>
            );
          })}
        </ul>
      </Tile>
    </Tray>
  );
}
