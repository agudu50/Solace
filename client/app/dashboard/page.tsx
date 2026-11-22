'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Check, Coins, Copy, FileCode, Link2, Lock, Plus, ShieldCheck } from 'lucide-react';
import { fetchUserCreditBalance, fetchUserCreditHistory } from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import PricingModal from '../../components/pricing/PricingModal';
import RiskChart3D, { type RiskBar } from '../../components/dashboard/RiskChart3D';
import {
  FeedList,
  ScoreStrip,
  SeverityBar,
  SurfaceGauge,
  Tile,
  TileHeader,
  Tray,
  ViewAll,
  type FeedItem,
  type SeverityCounts,
} from '../../components/dashboard/Overview';
import { Orb, Segmented } from '../../components/audit/StudioParts';
import { CountUp, EASE_OUT, SplitWords, TiltCard } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

interface ActiveAuditInfo {
  contractName: string;
  subtitle: string;
  contractHash: string;
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilitiesCount: number;
  auditType: string;
  timestamp: string;
  date: string;
  linesCount: number;
  vulnerabilities?: any[];
  codeSnippet?: string;
  report?: any;
  anchorResult?: any;
  feeReceipt?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedAuditMode, setSelectedAuditMode] = useState<'ALL' | 'PRE' | 'POST'>('ALL');
  const [activeAudit, setActiveAudit] = useState<ActiveAuditInfo | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const { walletKey: connectedWallet, network, connect, user, linkWallet, refreshUser, sessionLoading } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [linkingWallet, setLinkingWallet] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string>('');
  const [linkSuccess, setLinkSuccess] = useState<string>('');
  const [userCredits, setUserCredits] = useState<{
    availableCredits: number;
    totalPurchased: number;
    totalConsumed: number;
  } | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [showHistoryView, setShowHistoryView] = useState<boolean>(false);

  const isAuth = Boolean(connectedWallet || user);

  useEffect(() => {
    if (!sessionLoading && !isAuth) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [sessionLoading, isAuth, router]);

  const loadCredits = async (address?: string) => {
    const target = address || connectedWallet || user?.address || (user as any)?.id || (user as any)?.email;
    if (!target) {
      setUserCredits(null);
      setPurchaseHistory([]);
      return;
    }
    try {
      const balance = await fetchUserCreditBalance(target);
      setUserCredits(balance);
      const history = await fetchUserCreditHistory(target);
      setPurchaseHistory(history?.purchases || []);
    } catch (_) {}
  };

  useEffect(() => {
    const target = connectedWallet || user?.address || (user as any)?.id || (user as any)?.email;
    if (target) {
      loadCredits(target);
    } else {
      setUserCredits(null);
      setPurchaseHistory([]);
    }
  }, [connectedWallet, user]);

  useEffect(() => {
    const loadAuditData = () => {
      try {
        const activeAddress = connectedWallet || user?.address;
        if (!activeAddress) {
          setAuditHistory([]);
          setActiveAudit(null);
          return;
        }

        let history: any[] = [];
        const storedHistory = localStorage.getItem('solace_audit_history');
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            history = parsed.filter(
              (item: any) =>
                !item.feeReceipt?.payer ||
                item.feeReceipt?.payer === activeAddress ||
                item.wallet === activeAddress
            );
          }
        }
        setAuditHistory(history);

        const storedActive = localStorage.getItem('solace-active-contract-audit');
        let activeToSet: ActiveAuditInfo | null = null;

        if (storedActive) {
          const parsedActive = JSON.parse(storedActive);
          const belongsToUser =
            !parsedActive.feeReceipt?.payer ||
            parsedActive.feeReceipt?.payer === activeAddress ||
            parsedActive.wallet === activeAddress;

          if (belongsToUser) {
            const hasAuditData = Boolean(
              parsedActive.report ||
              (parsedActive.vulnerabilities && parsedActive.vulnerabilities.length > 0) ||
              parsedActive.anchorResult ||
              parsedActive.feeReceipt
            );

            if (hasAuditData || history.length === 0) {
              activeToSet = {
                ...parsedActive,
                vulnerabilities: parsedActive.vulnerabilities || parsedActive.report?.vulnerabilities || [],
              };
            }
          }
        }

        if (!activeToSet && history.length > 0) {
          const first = history[0];
          activeToSet = {
            contractName: first.contract || 'Soroban Smart Contract',
            subtitle: (first.contract || 'contract').toLowerCase().replace(/\s+/g, '_') + '.rs',
            contractHash: first.hash,
            riskScore: first.riskScore ?? (first.isSecure ? 95 : 60),
            isSecure: first.isSecure ?? true,
            summary: first.summary || 'Smart contract AST inspection verified invariants on Stellar Soroban.',
            vulnerabilitiesCount: first.vulnerabilities?.length ?? (first.isSecure ? 0 : 1),
            auditType: first.auditType || 'PRE_DEPLOYMENT',
            timestamp: first.timestamp || 'Live',
            date: first.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            linesCount: first.codeSnippet ? first.codeSnippet.split('\n').length : 36,
            vulnerabilities: first.vulnerabilities || first.report?.vulnerabilities || [],
            codeSnippet: first.codeSnippet,
            report: first.report || null,
            anchorResult: first.anchorResult || null,
            feeReceipt: first.feeReceipt || null,
          };
        }

        setActiveAudit(activeToSet);
      } catch (_) {
        setAuditHistory([]);
        setActiveAudit(null);
      }
    };

    loadAuditData();

    window.addEventListener('storage', loadAuditData);
    window.addEventListener('solace-audit-updated', loadAuditData);
    window.addEventListener('focus', loadAuditData);

    return () => {
      window.removeEventListener('storage', loadAuditData);
      window.removeEventListener('solace-audit-updated', loadAuditData);
      window.removeEventListener('focus', loadAuditData);
    };
  }, [connectedWallet, user]); // re-run once the session is restored

  const handleCopyWallet = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleConnectDashboardWallet = async () => {
    setConnectingWallet(true);
    try {
      await connect();
    } catch (err: any) {
      if (err?.message === 'FREIGHTER_NOT_INSTALLED') {
        window.open('https://www.freighter.app/', '_blank');
      }
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleLinkWallet = async () => {
    setLinkingWallet(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      let key = connectedWallet;
      if (!key) {
        key = await connect();
      }
      if (!key) {
        throw new Error('No Freighter wallet address detected.');
      }
      await linkWallet(key);
      setLinkSuccess(`Wallet ${key.slice(0, 6)}...${key.slice(-6)} linked successfully!`);
      await refreshUser();
      await loadCredits(key);
      setTimeout(() => setLinkSuccess(''), 5000);
    } catch (err: any) {
      if (err?.message?.includes('NETWORK_MISMATCH')) {
        // Network mismatch prompt is opened globally by WalletContext
        return;
      }
      if (err?.message === 'FREIGHTER_NOT_INSTALLED') {
        window.open('https://www.freighter.app/', '_blank');
      } else {
        setLinkError(err?.message || 'Failed to link Stellar wallet.');
        setTimeout(() => setLinkError(''), 6000);
      }
    } finally {
      setLinkingWallet(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Derived data                                                      */
  /* ---------------------------------------------------------------- */

  const toast = useToast();
  const [overviewView, setOverviewView] = useState<'breakdown' | '3d'>('breakdown');

  // Surface wallet-link problems as toasts (consistent with the rest of the app).
  useEffect(() => {
    if (linkError) toast.error(linkError, 'Failed to link Stellar wallet.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkError]);
  useEffect(() => {
    if (linkSuccess) toast.success('Wallet linked', linkSuccess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkSuccess]);

  const totalSubmitted = auditHistory.length;
  const verifiedSecure = auditHistory.filter((a) => a.isSecure).length;
  const passRate = totalSubmitted ? Math.round((verifiedSecure / totalSubmitted) * 100) : 0;
  const preCount = auditHistory.filter((a) => (a.auditType || 'PRE_DEPLOYMENT') !== 'POST_DEPLOYMENT').length;

  const vulnsOf = (a: any): any[] => a.vulnerabilities || a.report?.vulnerabilities || [];

  // Scope for the overview: all audits, or only pre-/post-deployment ones.
  const scoped = auditHistory.filter((a) =>
    selectedAuditMode === 'ALL'
      ? true
      : selectedAuditMode === 'POST'
      ? a.auditType === 'POST_DEPLOYMENT'
      : (a.auditType || 'PRE_DEPLOYMENT') !== 'POST_DEPLOYMENT',
  );

  const severity: SeverityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  scoped.forEach((a) =>
    vulnsOf(a).forEach((v) => {
      const k = String(v.severity || 'LOW').toUpperCase() as keyof SeverityCounts;
      severity[k in severity ? k : 'LOW'] += 1;
    }),
  );
  const openFindings = auditHistory.filter((a) => !a.isSecure).reduce((n, a) => n + (vulnsOf(a).length || 1), 0);
  const scopedAnchored = scoped.filter((a) => a.anchorResult).length;
  const scopedSecure = scoped.filter((a) => a.isSecure).length;

  // Issue surface: every finding classified into a Soroban risk category.
  const CATEGORIES: { label: string; test: RegExp }[] = [
    { label: 'Authorization', test: /auth|signature|caller|privilege|admin|governance/ },
    { label: 'Storage rent (TTL)', test: /storage|rent|ttl|evict/ },
    { label: 'Host panics', test: /panic|unwrap|crash|trap/ },
    { label: 'Arithmetic', test: /overflow|underflow|arithmetic|checked/ },
    { label: 'Gas & bytecode', test: /gas|bytecode|limit|loop/ },
  ];
  const surface = [...CATEGORIES.map((c) => ({ label: c.label, value: 0 })), { label: 'Other', value: 0 }];
  auditHistory.forEach((a) =>
    vulnsOf(a).forEach((v) => {
      const text = `${v.title || ''} ${v.description || ''}`.toLowerCase();
      const idx = CATEGORIES.findIndex((c) => c.test.test(text));
      surface[idx === -1 ? surface.length - 1 : idx].value += 1;
    }),
  );
  const surfaceSorted = surface.filter((s) => s.value > 0 || s.label !== 'Other').sort((a, b) => b.value - a.value);

  // 3D index (kept from the previous dashboard, now a view of the overview card).
  const latestVulns = vulnsOf(activeAudit || {});
  const hit = (re: RegExp) => latestVulns.some((v: any) => re.test(`${v.title || ''} ${v.description || ''}`.toLowerCase()));
  const isScanningActive = Boolean(activeAudit || totalSubmitted > 0);
  const bar = (key: string, label: string, isHit: boolean, penalty: number, ok: string, okLabel: string, badLabel: string): RiskBar => ({
    key,
    label,
    category: label,
    detail: '',
    score: !isScanningActive ? 0 : isHit ? 100 - penalty : 100,
    status: !isScanningActive ? 'Standby' : isHit ? badLabel : okLabel,
    color: isHit ? '#ef4444' : ok,
  });
  const riskBars: RiskBar[] = [
    bar('auth', 'Auth', hit(/auth/), 45, '#10b981', 'Guarded', 'Breached'),
    bar('storage', 'Storage', hit(/storage|rent|ttl/), 35, '#06b6d4', 'Protected', 'Eviction'),
    bar('safety', 'Safety', hit(/panic|unwrap|crash/), 40, '#a855f7', 'Safe', 'Panic'),
    bar('admin', 'Admin', hit(/admin|governance|privilege/), 40, '#C80552', 'Enforced', 'Escalation'),
    bar('math', 'Math', hit(/overflow|underflow|arithmetic/), 30, '#f59e0b', 'Safe', 'Overflow'),
    bar('code', 'Code', hit(/gas|bytecode|limit/), 25, '#6366f1', 'Safe', 'Gas spike'),
  ];

  const available = userCredits?.availableCredits ?? 0;
  const purchased = userCredits?.totalPurchased ?? 0;
  const consumed = userCredits?.totalConsumed ?? 0;
  const usedPct = purchased > 0 ? Math.min(100, Math.round((consumed / purchased) * 100)) : 0;
  const signer = connectedWallet || user?.address || '';
  const displayName = user?.name || (signer ? `${signer.slice(0, 4)}…${signer.slice(-4)}` : user?.email || 'auditor');

  const KPIS = [
    {
      label: 'Contracts audited',
      icon: FileCode,
      value: totalSubmitted,
      foot: `${preCount} pre · ${totalSubmitted - preCount} post`,
      pill: { text: 'All time', tone: 'neutral' as const },
      href: '/reports',
    },
    {
      label: 'Open findings',
      icon: AlertTriangle,
      value: openFindings,
      foot: `${severity.CRITICAL} critical in scope`,
      pill: { text: openFindings ? 'Needs fixes' : 'All clear', tone: openFindings ? ('bad' as const) : ('ok' as const) },
      href: '/reports',
    },
    {
      label: 'Verified secure',
      icon: ShieldCheck,
      value: verifiedSecure,
      foot: `of ${totalSubmitted} audits`,
      pill: { text: `${passRate}% pass rate`, tone: passRate >= 50 ? ('ok' as const) : ('warn' as const) },
      href: '/reports',
    },
    {
      label: 'Audit credits',
      icon: Coins,
      value: available,
      foot: `${available * 10} XLM · never expires`,
      pill: { text: `${usedPct}% used`, tone: available <= 1 ? ('warn' as const) : ('neutral' as const) },
      onClick: () => setShowPricingModal(true),
    },
  ];

  const sevTone = (s?: string): FeedItem['tone'] =>
    s === 'CRITICAL' ? 'ink' : s === 'HIGH' ? 'accent' : s === 'MEDIUM' ? 'amber' : 'sky';
  const worst = (a: any) => {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    return vulnsOf(a).map((v) => String(v.severity).toUpperCase()).sort((x, y) => order.indexOf(x) - order.indexOf(y))[0];
  };
  const hashTag = (h?: string) => (h ? `#${h.slice(0, 6)}` : '#——');

  const recentAudits: FeedItem[] = auditHistory.slice(0, 4).map((a, i) => ({
    id: `${a.hash}-${i}`,
    title: a.contract || 'Soroban contract',
    meta: (
      <>
        {hashTag(a.hash)} · {a.date || 'Recent'} · score <span className="text-slate-900 dark:text-white">{a.riskScore ?? '—'}</span>
      </>
    ),
    tone: a.isSecure ? 'emerald' : sevTone(worst(a)),
    href: `/reports?hash=${a.hash}`,
  }));

  const openIssues: FeedItem[] = auditHistory
    .filter((a) => !a.isSecure)
    .flatMap((a) => vulnsOf(a).map((v: any, j: number) => ({ a, v, j })))
    .sort(
      (x, y) =>
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(String(x.v.severity).toUpperCase()) -
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(String(y.v.severity).toUpperCase()),
    )
    .slice(0, 4)
    .map(({ a, v, j }) => ({
      id: `${a.hash}-v${j}`,
      title: v.title || 'Unnamed finding',
      meta: (
        <>
          {hashTag(a.hash)} · {String(v.severity || 'LOW').toLowerCase()} in{' '}
          <span className="text-slate-900 dark:text-white">{a.contract || 'contract'}</span>
        </>
      ),
      tone: sevTone(String(v.severity).toUpperCase()),
      href: `/reports?hash=${a.hash}`,
    }));

  const when = (d?: string, t?: string) => {
    const ms = Date.parse(`${d || ''} ${t || ''}`.trim()) || Date.parse(d || '');
    return Number.isNaN(ms) ? 0 : ms;
  };
  const activity: (FeedItem & { at: number })[] = [
    ...auditHistory.map((a, i) => ({
      id: `audit-${a.hash}-${i}`,
      title: `Audited ${a.contract || 'a contract'}`,
      meta: <>{a.date ? `${a.date}${a.time ? ` · ${a.time}` : ''}` : 'Recently'} · {a.isSecure ? 'passed' : 'action required'}</>,
      tone: 'slate' as const,
      href: `/reports?hash=${a.hash}`,
      at: when(a.date, a.time) - i, // keep stored (newest-first) order on ties
    })),
    ...auditHistory
      .filter((a) => a.anchorResult)
      .map((a, i) => ({
        id: `anchor-${a.hash}-${i}`,
        title: `Anchored ${a.contract || 'audit'} on-chain`,
        meta: <>{a.date || 'Recently'} · Stellar testnet</>,
        tone: 'emerald' as const,
        href: `/reports?hash=${a.hash}`,
        at: when(a.date, a.time) + 1,
      })),
    ...purchaseHistory.map((p, i) => ({
      id: `buy-${p.id || p.transactionHash || i}`,
      title: `Bought ${p.packageName || 'credit bundle'} (+${p.credits})`,
      meta: <>{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Confirmed'} · {p.amountXLM} XLM</>,
      tone: 'accent' as const,
      at: p.timestamp ? Date.parse(p.timestamp) : 0,
    })),
  ]
    .sort((x, y) => y.at - x.at)
    .slice(0, 4);

  const scoreItems = scoped.slice(0, 24).map((a, i) => ({
    id: `${a.hash}-${i}`,
    score: Math.max(0, Math.min(100, a.riskScore ?? 0)),
    label: a.contract || 'contract',
    secure: Boolean(a.isSecure),
  }));

  /* ---------------------------------------------------------------- */
  /* Auth gates                                                        */
  /* ---------------------------------------------------------------- */

  if (sessionLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] grid place-items-center p-6 bg-[#f7f7f6] dark:bg-[#0e0e0e]">
        <div className="text-center">
          <Orb active>
            <ShieldCheck className="w-5 h-5 text-accent" />
          </Orb>
          <p className="mt-6 font-mono text-xs text-slate-500 tracking-wider">Verifying auditor credentials…</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] grid place-items-center p-6 bg-[#f7f7f6] dark:bg-[#0e0e0e] text-center">
        <div className="w-full max-w-md rounded-[18px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] p-8">
          <span className="mx-auto grid place-items-center w-11 h-11 rounded-xl bg-accent-subtle text-accent">
            <Lock className="w-5 h-5" />
          </span>
          <h2 className="mt-5 text-xl font-medium tracking-tight text-slate-900 dark:text-white">Auditor access restricted</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Please log in or connect your Stellar auditor wallet to access the security dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login?redirect=/dashboard" className={btn.primary}>
              Sign in / connect wallet
            </Link>
            <Link href="/" className={btn.secondary}>
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative w-full min-h-screen bg-[#f2f2f0] dark:bg-[#0b0b0b] text-slate-800 dark:text-slate-100 pb-24 md:pb-10 overflow-x-hidden">
      <main className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-2">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-slate-900 dark:text-white">
              <SplitWords text={`Welcome back, ${displayName}`} />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-1.5 text-sm text-slate-500 max-w-lg"
            >
              Track how your Soroban contracts are trending, what still needs fixing, and what is sealed on-chain.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
            className="flex items-center gap-2 shrink-0"
          >
            <Link
              href="/audit"
              aria-label="Run a new audit"
              title="Run a new audit"
              className="grid place-items-center w-11 h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-[1.04] active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </Link>
            <span className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-xs text-slate-500">
              Network
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </span>
            </span>
            {signer ? (
              <button
                type="button"
                onClick={() => handleCopyWallet(signer)}
                title="Copy wallet address"
                className="inline-flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-xs hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer"
              >
                <Identicon seed={signer} />
                <span className="font-mono text-slate-900 dark:text-white hidden sm:inline">
                  {signer.slice(0, 4)}…{signer.slice(-4)}
                </span>
                {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            ) : (
              <button type="button" onClick={handleLinkWallet} disabled={linkingWallet} className={`${btn.primary} h-11 rounded-xl`}>
                <Link2 className="w-4 h-4" />
                {linkingWallet ? 'Linking…' : 'Link wallet'}
              </button>
            )}
          </motion.div>
        </div>

        {/* KPI tray */}
        <Tray index={0}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {KPIS.map((k, i) => {
              const Icon = k.icon;
              const inner = (
                <Tile className="h-full p-4 sm:p-5 transition-colors group-hover:border-slate-300 dark:group-hover:border-white/15">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-slate-700 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{k.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <p className="mt-6 sm:mt-8 text-4xl sm:text-[44px] font-medium tracking-tight tabular-nums text-slate-900 dark:text-white leading-none">
                    <CountUp value={String(k.value)} />
                  </p>
                  <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-white/[0.07] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 truncate">{k.foot}</span>
                    <Pill tone={k.pill.tone}>{k.pill.text}</Pill>
                  </div>
                </Tile>
              );
              return (
                <TiltCard key={k.label} max={4} glare={false} className="h-full">
                  {k.href ? (
                    <Link href={k.href} className="group block h-full" aria-label={k.label}>
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" onClick={k.onClick} className="group block w-full h-full text-left cursor-pointer" aria-label={`${k.label}: buy more`}>
                      {inner}
                    </button>
                  )}
                </TiltCard>
              );
            })}
          </div>
        </Tray>

        {/* Overview + surface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <Tray index={1} className="lg:col-span-8">
            <Tile flat className="h-full flex flex-col">
              <TileHeader
                title="Finding overview"
                action={
                  <div className="flex items-center gap-2">
                    <Segmented
                      id="overview-view"
                      label="Overview view"
                      value={overviewView}
                      onChange={setOverviewView}
                      options={[
                        { value: 'breakdown', label: 'Breakdown' },
                        { value: '3d', label: '3D index' },
                      ]}
                    />
                    <Segmented
                      id="overview-scope"
                      label="Audit scope"
                      value={selectedAuditMode}
                      onChange={setSelectedAuditMode}
                      options={[
                        { value: 'ALL', label: 'All' },
                        { value: 'PRE', label: 'Pre' },
                        { value: 'POST', label: 'Post' },
                      ]}
                    />
                  </div>
                }
              />
              <AnimatePresence mode="wait">
                {overviewView === 'breakdown' ? (
                  <motion.div
                    key="breakdown"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="px-4 sm:px-5 pb-5 pt-5 space-y-6"
                  >
                    <section>
                      <p className="mb-2.5 text-xs text-slate-500">Severity</p>
                      <SeverityBar counts={severity} />
                    </section>
                    <section>
                      <p className="mb-2.5 text-xs text-slate-500">State</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { n: scopedSecure, label: 'Verified secure' },
                          { n: scoped.length - scopedSecure, label: 'Action required' },
                          { n: scopedAnchored, label: 'Anchored on-chain' },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] grid place-items-center px-2 text-xs text-slate-700 dark:text-slate-300 text-center"
                          >
                            <span>
                              <span className="font-medium text-slate-900 dark:text-white tabular-nums">{s.n}</span> {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section>
                      <p className="mb-4 text-xs text-slate-500">Risk score distribution</p>
                      <ScoreStrip items={scoreItems} />
                    </section>
                  </motion.div>
                ) : (
                  <motion.div
                    key="3d"
                    initial={{ opacity: 0, rotateX: 12 }}
                    animate={{ opacity: 1, rotateX: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    style={{ transformPerspective: 1200 }}
                    className="pt-2"
                  >
                    <RiskChart3D bars={riskBars} active={isScanningActive} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Tile>
          </Tray>

          <Tray index={2} className="lg:col-span-4">
            <Tile className="h-full flex flex-col">
              <TileHeader title="Issue surface" action={<ViewAll href="/reports" label="Details" />} />
              <div className="px-4 sm:px-5 pt-5 pb-5 flex-1">
                <SurfaceGauge segments={surfaceSorted} centerLabel="Findings" />
              </div>
            </Tile>
          </Tray>
        </div>

        {/* Lists */}
        <Tray index={3}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            {[
              { title: 'Recent audits', items: recentAudits, empty: 'No audits yet. Run one in Audit Studio.', href: '/reports' },
              { title: 'Open issues', items: openIssues, empty: 'Nothing open. Every audited contract passes.', href: '/reports' },
              { title: 'Recent activity', items: activity, empty: 'Activity from audits, anchors and purchases shows up here.', href: '/reports' },
            ].map((col) => (
              <Tile key={col.title} className="flex flex-col">
                <TileHeader title={col.title} action={<ViewAll href={col.href} />} />
                <div className="pt-2">
                  <FeedList items={col.items} empty={col.empty} />
                </div>
              </Tile>
            ))}
          </div>
        </Tray>
      </main>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          loadCredits();
        }}
      />
    </div>
  );
}

function Pill({ tone, children }: { tone: 'neutral' | 'ok' | 'warn' | 'bad'; children: React.ReactNode }) {
  const cls = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
    ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    bad: 'bg-accent/10 text-accent',
  }[tone];
  return <span className={`shrink-0 inline-flex items-center h-5 px-2 rounded-md text-[10px] font-medium whitespace-nowrap ${cls}`}>{children}</span>;
}

/** Deterministic 4×4 avatar from a wallet address. */
function Identicon({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells = Array.from({ length: 8 }, (_, i) => (h >> i) & 1);
  return (
    <span aria-hidden className="grid grid-cols-4 gap-px w-8 h-8 p-1 rounded-lg bg-accent-subtle">
      {Array.from({ length: 16 }, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const on = cells[row * 2 + (col < 2 ? col : 3 - col)]; // mirrored
        return <span key={i} className={`rounded-[2px] ${on ? 'bg-accent' : 'bg-transparent'}`} />;
      })}
    </span>
  );
}
