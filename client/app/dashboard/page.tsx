'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bug,
  Calendar,
  ExternalLink,
  FileCode,
  Hourglass,
  KeyRound,
  Link2,
  Mail,
  PlusCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { fetchUserCreditBalance, fetchUserCreditHistory } from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';
import PricingModal from '../../components/pricing/PricingModal';
import { Chip, Panel, PanelHeader } from '../../components/dashboard/Panel';
import RiskChart3D, { type RiskBar } from '../../components/dashboard/RiskChart3D';
import { ScoreRing, Sparkline, WalletCard3D } from '../../components/dashboard/Visuals';
import { CountUp, EASE_OUT, SplitWords } from '../../components/landing/motion';
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
  const [selectedAuditMode, setSelectedAuditMode] = useState<'PRE' | 'POST'>('PRE');
  const [activeAudit, setActiveAudit] = useState<ActiveAuditInfo | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const { walletKey: connectedWallet, network, connect, user, linkWallet, refreshUser } = useWallet();
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
        let history: any[] = [];
        const storedHistory = localStorage.getItem('solace_audit_history');
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            history = parsed;
          }
        }
        setAuditHistory(history);

        const storedActive = localStorage.getItem('solace-active-contract-audit');
        let activeToSet: ActiveAuditInfo | null = null;

        if (storedActive) {
          const parsedActive = JSON.parse(storedActive);
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
  }, []);

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
  /* Derived metrics                                                   */
  /* ---------------------------------------------------------------- */

  const totalSubmitted = auditHistory.length;
  const verifiedSecure = auditHistory.filter((item) => item.isSecure).length;
  const totalFlaws = auditHistory.reduce(
    (acc, item) => acc + (item.vulnerabilities?.length || (item.isSecure ? 0 : 1)),
    0
  );
  const passRate = totalSubmitted > 0 ? Math.round((verifiedSecure / totalSubmitted) * 100) : 0;
  const overallRiskScore = activeAudit
    ? activeAudit.riskScore
    : totalSubmitted > 0
    ? Math.round(auditHistory.reduce((acc, a) => acc + (a.riskScore || 0), 0) / totalSubmitted)
    : 0;

  const vulnerabilities: any[] = (activeAudit as any)?.vulnerabilities || [];
  const hits = (re: RegExp) =>
    vulnerabilities.some((v: any) => re.test((v.title || v.name || v.description || '').toLowerCase()));
  const hasAuthVuln = hits(/auth/);
  const hasStorageVuln = hits(/storage|rent|ttl/);
  const hasPanicVuln = hits(/panic|unwrap|crash/);
  const hasAdminVuln = hits(/admin|governance|privilege/);
  const hasMathVuln = hits(/overflow|underflow|arithmetic/);
  const hasGasVuln = hits(/gas|bytecode|limit/);

  const isScanningActive = Boolean(activeAudit || totalSubmitted > 0);
  const score = (hit: boolean, penalty: number) => (!isScanningActive ? 0 : hit ? Math.max(0, 100 - penalty) : 100);

  const VECTORS = [
    { key: 'auth', label: 'Auth', category: 'Auth hijack', hit: hasAuthVuln, penalty: 45, ok: '#10b981', okLabel: 'Guarded', badLabel: 'Breached', detail: 'require_auth() enforcement on state mutators' },
    { key: 'storage', label: 'Storage', category: 'Storage rent eviction (TTL)', hit: hasStorageVuln, penalty: 35, ok: '#06b6d4', okLabel: 'Protected', badLabel: 'Eviction', detail: 'Persistent vs instance storage and TTL bumps' },
    { key: 'safety', label: 'Safety', category: 'Host panic crash risk', hit: hasPanicVuln, penalty: 40, ok: '#a855f7', okLabel: 'Safe', badLabel: 'Panic', detail: 'No unhandled .unwrap() or indexing panics' },
    { key: 'admin', label: 'Admin', category: 'Admin privilege escalation', hit: hasAdminVuln, penalty: 40, ok: '#C80552', okLabel: 'Enforced', badLabel: 'Escalation', detail: 'Admin governance and caller authentication' },
    { key: 'math', label: 'Math', category: 'Arithmetic overflow / underflow', hit: hasMathVuln, penalty: 30, ok: '#f59e0b', okLabel: 'Safe', badLabel: 'Overflow', detail: 'Checked integer operations' },
    { key: 'code', label: 'Code', category: 'Bytecode and gas exhaustion', hit: hasGasVuln, penalty: 25, ok: '#6366f1', okLabel: 'Safe', badLabel: 'Gas spike', detail: 'Release binary within the 64KB limit' },
  ];

  const riskBars: RiskBar[] = VECTORS.map((v) => ({
    key: v.key,
    label: v.label,
    category: v.category,
    detail: v.detail,
    score: score(v.hit, v.penalty),
    status: !isScanningActive ? 'Standby' : v.hit ? v.badLabel : v.okLabel,
    color: v.hit ? '#ef4444' : v.ok,
  }));

  const GUARDS = [
    { name: 'Authorization guard', icon: KeyRound, hit: hasAuthVuln, ok: 'require_auth() signature enforcement', bad: 'Missing require_auth() enforcement', okLabel: 'Guarded', badLabel: 'Breached' },
    { name: 'Storage rent guardian', icon: Hourglass, hit: hasStorageVuln, ok: 'TTL auto-bump and state isolation', bad: 'Storage TTL exposure, eviction risk', okLabel: 'Protected', badLabel: 'Eviction' },
    { name: 'Panic crash shield', icon: Bug, hit: hasPanicVuln, ok: 'Zero unhandled .unwrap() host panics', bad: 'Host panic vector from .unwrap()', okLabel: 'Safe', badLabel: 'Panic' },
    { name: 'Admin access control', icon: ShieldCheck, hit: hasAdminVuln, ok: 'Role and caller authentication', bad: 'Admin privilege escalation vector', okLabel: 'Enforced', badLabel: 'Escalation' },
  ];
  const passingGuardsCount = isScanningActive ? GUARDS.filter((g) => !g.hit).length : 0;

  const signer = connectedWallet || user?.address || '';
  const displayName =
    user?.name || (connectedWallet ? `${connectedWallet.slice(0, 4)}…${connectedWallet.slice(-4)}` : user?.email || 'auditor');
  const authLabel =
    user?.authProvider === 'hybrid' || (user?.email && signer)
      ? 'Email + Freighter'
      : user?.authProvider === 'wallet' || (connectedWallet && !user?.email)
      ? 'Stellar wallet'
      : 'Email account';
  const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Testnet';

  const available = userCredits?.availableCredits ?? 0;
  const purchased = userCredits?.totalPurchased ?? 0;
  const consumed = userCredits?.totalConsumed ?? 0;
  const usedPct = purchased > 0 ? Math.min(100, Math.round((consumed / purchased) * 100)) : 0;

  // Oldest → newest scores from real history for the trend line.
  const trend = auditHistory
    .slice(0, 12)
    .map((a) => a.riskScore ?? (a.isSecure ? 95 : 55))
    .reverse();
  if (trend.length === 0 && activeAudit) trend.push(activeAudit.riskScore);

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const KPIS = [
    { label: 'Contracts submitted', value: String(totalSubmitted), sub: totalSubmitted ? 'this session' : 'awaiting first contract' },
    { label: 'Verified secure', value: String(verifiedSecure), sub: `${passRate}% pass rate` },
    { label: 'Flaws quarantined', value: String(totalFlaws), sub: totalFlaws ? 'isolated across audits' : 'none found yet' },
    { label: 'Audit credits', value: String(available), sub: `${available * 10} XLM · never expires` },
  ];

  const divider = 'border-slate-200 dark:border-white/10';

  return (
    <div className="relative w-full min-h-screen bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 pb-24 md:pb-10 overflow-x-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] grid-lines pointer-events-none [mask-image:radial-gradient(ellipse_70%_100%_at_50%_0%,#000_30%,transparent_100%)]"
      />

      <main className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="flex flex-wrap items-center gap-2 mb-5"
            >
              <Chip tone="accent" pulse>Security core</Chip>
              <Chip>Protocol 22</Chip>
              <Chip tone={connectedWallet ? 'ok' : 'neutral'}>{connectedWallet ? 'Auditor active' : 'Wallet offline'}</Chip>
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-medium tracking-tightest leading-[1.05] text-slate-900 dark:text-white">
              <SplitWords text={`Welcome back, ${displayName}`} />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl"
            >
              AST invariant checks, storage-rent monitoring and on-chain audit proofs for your Soroban contracts.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-2 shrink-0"
          >
            <span className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] text-xs text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {today} · {networkLabel}
            </span>
            <Link href="/audit" className={`${btn.primary} group`}>
              Run security audit
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* KPI strip */}
        <Panel index={0} className="mt-8 sm:mt-10">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k, i) => (
              <div
                key={k.label}
                className={`px-5 sm:px-6 py-5 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} ${divider}`}
              >
                <dt className="eyebrow">{k.label}</dt>
                <dd className="mt-2 text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
                  <CountUp value={k.value} />
                </dd>
                <dd className="mt-1 text-xs text-slate-500">{k.sub}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Row 1 */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
            {/* Identity */}
            <Panel index={1}>
              <PanelHeader eyebrow="Account" title="Auditor identity" action={<Chip tone={signer ? 'ok' : 'neutral'}>{authLabel}</Chip>} />
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-md border border-slate-200 dark:border-white/10 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {user?.name || (connectedWallet ? `Auditor ${connectedWallet.slice(0, 6)}` : 'Security auditor')}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />
                      {user?.email || (connectedWallet ? 'Wallet signer session' : 'Email account')}
                    </p>
                  </div>
                </div>

                {signer ? (
                  <WalletCard3D address={signer} copied={copiedWallet} onCopy={() => handleCopyWallet(signer)} network={networkLabel} />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/15 p-5 text-center">
                    <span className="mx-auto grid place-items-center w-10 h-10 rounded-md bg-accent-subtle text-accent">
                      <Link2 className="w-5 h-5" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">No Stellar wallet linked</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">Link Freighter to sign ledger proofs and buy credit bundles.</p>
                    <AnimatePresence>
                      {(linkError || linkSuccess) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-2 text-xs ${linkError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        >
                          {linkError || linkSuccess}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <button type="button" onClick={handleLinkWallet} disabled={linkingWallet} className={`${btn.primary} w-full mt-4`}>
                      <Link2 className="w-4 h-4" />
                      {linkingWallet ? 'Connecting Freighter…' : 'Link Freighter wallet'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Ledger records</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {totalSubmitted} {totalSubmitted === 1 ? 'record' : 'records'}
                  </span>
                </div>
              </div>
            </Panel>

            {/* Credits */}
            <Panel index={2}>
              <PanelHeader eyebrow="Credits" title="Prepaid audit balance" action={<Chip tone="ok">Never expires</Chip>} />
              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-medium tracking-tight text-slate-900 dark:text-white">
                      <CountUp value={String(available)} />
                    </p>
                    <p className="text-xs text-slate-500 mt-1">audits available · {available * 10} XLM</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
                    <p>bought {purchased}</p>
                    <p>used {consumed}</p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${usedPct}%` }}
                    transition={{ duration: 1.1, delay: 0.4, ease: EASE_OUT }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">{usedPct}% of purchased credits used</p>

                <AnimatePresence>
                  {userCredits && available <= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 flex items-start gap-2.5 p-3 rounded-md border text-xs ${
                        available === 0
                          ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                          : 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                      {available === 0
                        ? 'No credits left. Buy a bundle to run your next audit (10 XLM = 1 audit).'
                        : 'One audit left. Top up any time; credits never expire.'}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="button" onClick={() => setShowPricingModal(true)} className={`${btn.primary} w-full mt-4`}>
                  <PlusCircle className="w-4 h-4" />
                  Buy audit bundles
                </button>

                {purchaseHistory.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowHistoryView(!showHistoryView)}
                      aria-expanded={showHistoryView}
                      className="mt-3 w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Purchases ({purchaseHistory.length})</span>
                      <motion.span animate={{ rotate: showHistoryView ? 90 : 0 }}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {showHistoryView && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <ul className={`mt-2 max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-white/10 border-y ${divider}`}>
                            {purchaseHistory.map((p, i) => (
                              <li key={p.id || i} className="py-2.5 text-xs flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-slate-900 dark:text-white truncate">
                                    {p.packageName || 'Audit bundle'} · +{p.credits}
                                  </p>
                                  <p className="text-slate-500">{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Confirmed'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-mono text-slate-900 dark:text-white">{p.amountXLM} XLM</p>
                                  {p.transactionHash && (
                                    <a
                                      href={`https://stellar.expert/explorer/testnet/tx/${p.transactionHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-accent hover:underline inline-flex items-center gap-0.5"
                                    >
                                      {p.transactionHash.slice(0, 8)}…
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </Panel>
          </div>

          {/* 3D risk index */}
          <Panel index={3} className="lg:col-span-8">
            <PanelHeader
              eyebrow="Invariant engine"
              title="Smart contract security index"
              action={
                <div className="flex p-0.5 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]" role="tablist" aria-label="Audit mode">
                  {(['PRE', 'POST'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={selectedAuditMode === m}
                      onClick={() => setSelectedAuditMode(m)}
                      className={`relative px-2.5 h-7 text-xs rounded-[4px] transition-colors cursor-pointer ${
                        selectedAuditMode === m ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {selectedAuditMode === m && (
                        <motion.span
                          layoutId="audit-mode"
                          className="absolute inset-0 rounded-[4px] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs"
                          transition={{ duration: 0.3, ease: EASE_OUT }}
                        />
                      )}
                      <span className="relative">{m === 'PRE' ? 'Pre-deploy' : 'Post-deploy'}</span>
                    </button>
                  ))}
                </div>
              }
            />
            <div className="px-5 sm:px-6 -mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>
                Overall score <span className="font-mono text-slate-900 dark:text-white">{isScanningActive ? `${overallRiskScore}/100` : '—'}</span>
              </span>
              <span>
                Consensus latency <span className="font-mono text-slate-900 dark:text-white">{isScanningActive ? '1,150ms' : '—'}</span>
              </span>
              {!isScanningActive && <span>Run an audit in Studio to light up the index.</span>}
            </div>
            <div className="mt-auto">
              <RiskChart3D bars={riskBars} active={isScanningActive} />
            </div>
          </Panel>
        </div>

        {/* Row 2 */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Recent audits */}
          <Panel index={4} className="lg:col-span-4">
            <PanelHeader
              eyebrow="History"
              title="Recent audits"
              action={
                <Link href="/reports" className={btn.link}>
                  All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            {auditHistory.length === 0 ? (
              <EmptyState icon={FileCode} title="No audit records yet" body="Run your first inspection in Audit Studio to create an on-chain proof." />
            ) : (
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
                className={`border-t ${divider} divide-y divide-slate-200 dark:divide-white/10`}
              >
                {auditHistory.slice(0, 5).map((item: any, idx: number) => {
                  const name = item.contract || 'Soroban contract';
                  const s = item.riskScore ?? (item.isSecure ? 95 : 55);
                  return (
                    <motion.li
                      key={item.hash || idx}
                      variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } } }}
                    >
                      <Link
                        href={`/reports?hash=${item.hash}`}
                        className="group flex items-center gap-3 px-5 sm:px-6 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isSecure ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-900 dark:text-white truncate">{name}</p>
                          <p className="text-xs text-slate-500 truncate">{item.date || item.timestamp || 'Recent'}</p>
                        </div>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">{s}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </Panel>

          {/* Latest analysis */}
          <Panel index={5} className="lg:col-span-4">
            <PanelHeader
              eyebrow="Latest analysis"
              title={activeAudit ? activeAudit.contractName : 'No active contract'}
              action={activeAudit && <Chip tone={activeAudit.isSecure ? 'ok' : 'warn'}>{activeAudit.isSecure ? 'Verified' : 'Action req.'}</Chip>}
            />
            {!activeAudit ? (
              <EmptyState icon={Activity} title="Nothing scanned yet" body="Paste or upload a Soroban contract in Audit Studio to see live results here." />
            ) : (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4">
                  <ScoreRing value={activeAudit.riskScore} label={`Consensus score ${activeAudit.riskScore} of 100`} />
                  <dl className="text-xs space-y-1.5 min-w-0">
                    <div className="flex gap-2">
                      <dt className="text-slate-500">File</dt>
                      <dd className="font-mono text-slate-900 dark:text-white truncate">{activeAudit.subtitle}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500">Lines</dt>
                      <dd className="font-mono text-slate-900 dark:text-white">{activeAudit.linesCount}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500">Flaws</dt>
                      <dd className="font-mono text-accent">{activeAudit.vulnerabilitiesCount} detected</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 h-16 relative">
                  <Sparkline points={trend} />
                  <span className="absolute top-0 right-0 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    score trend · {trend.length} {trend.length === 1 ? 'audit' : 'audits'}
                  </span>
                </div>

                <div className={`mt-4 flex items-center justify-between gap-2 text-xs border-t ${divider} pt-3`}>
                  <span className="text-slate-500">SHA-256</span>
                  <span className="font-mono text-slate-900 dark:text-white truncate">
                    {activeAudit.contractHash?.slice(0, 10)}…{activeAudit.contractHash?.slice(-8)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{activeAudit.summary}</p>

                <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
                  <Link href="/audit" className={btn.primary}>
                    Audit Studio
                  </Link>
                  <Link href={`/reports?hash=${activeAudit.contractHash}`} className={btn.secondary}>
                    View report
                  </Link>
                </div>
              </div>
            )}
          </Panel>

          {/* Threat shield */}
          <Panel index={6} className="md:col-span-2 lg:col-span-4">
            <PanelHeader
              eyebrow="Threat shield"
              title="Invariant guards"
              action={
                <Chip tone={!isScanningActive ? 'neutral' : passingGuardsCount === 4 ? 'ok' : passingGuardsCount >= 2 ? 'warn' : 'bad'}>
                  {isScanningActive ? `${passingGuardsCount}/4 active` : 'Standby'}
                </Chip>
              }
            />
            <div className="px-5 sm:px-6 grid grid-cols-4 gap-1.5" aria-hidden>
              {GUARDS.map((g, i) => (
                <motion.span
                  key={g.name}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: EASE_OUT }}
                  className={`h-1.5 rounded-full origin-left ${!isScanningActive ? 'bg-slate-200 dark:bg-white/10' : g.hit ? 'bg-red-500' : 'bg-emerald-500'}`}
                />
              ))}
            </div>
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.5 } } }}
              className={`mt-4 border-t ${divider} divide-y divide-slate-200 dark:divide-white/10`}
            >
              {GUARDS.map((g) => {
                const Icon = g.icon;
                const state = !isScanningActive ? 'Standby' : g.hit ? g.badLabel : g.okLabel;
                return (
                  <motion.li
                    key={g.name}
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } } }}
                    className="flex items-center gap-3 px-5 sm:px-6 py-3"
                  >
                    <span
                      className={`grid place-items-center w-7 h-7 rounded-md border shrink-0 ${
                        !isScanningActive
                          ? 'border-slate-200 dark:border-white/10 text-slate-400'
                          : g.hit
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-900 dark:text-white truncate">{g.name}</p>
                      <p className="text-xs text-slate-500 truncate">{isScanningActive && g.hit ? g.bad : g.ok}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0">{state}</span>
                  </motion.li>
                );
              })}
            </motion.ul>
            <div className={`mt-auto flex items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t ${divider} text-xs`}>
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('solace-open-invariants-modal'))} className={btn.link}>
                Invariants matrix <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <Link href="/monitor" className={btn.link}>
                Monitor <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Panel>
        </div>
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

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 [perspective:400px]">
      <motion.span
        initial={{ rotateX: 70, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: EASE_OUT }}
        className="grid place-items-center w-10 h-10 rounded-md bg-accent-subtle text-accent"
      >
        <Icon className="w-5 h-5" />
      </motion.span>
      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-[16rem] leading-relaxed">{body}</p>
      <Link href="/audit" className={`${btn.secondary} mt-4 h-9`}>
        Open Audit Studio
      </Link>
    </div>
  );
}
