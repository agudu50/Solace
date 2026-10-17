'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Shield,
  FileCheck,
  FileCode,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Lock,
  Database,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Wallet,
  Copy,
  Check,
} from 'lucide-react';
import { connectWallet } from '../utils/solaceService';
import WalletGate from '../components/auth/WalletGate';
import { useWallet } from '../context/WalletContext';

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
  const { walletKey: connectedWallet, network, connect } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);

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

  // Real Dynamic Metrics
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

  // Real Dynamic Invariant Threat Evaluations
  const vulnerabilities: any[] = (activeAudit as any)?.vulnerabilities || [];
  const hasAuthVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().includes('auth')
  );
  const hasStorageVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/storage|rent|ttl/)
  );
  const hasPanicVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/panic|unwrap|crash/)
  );
  const hasAdminVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/admin|governance|privilege/)
  );
  const hasMathVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/overflow|underflow|arithmetic/)
  );
  const hasGasVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/gas|bytecode|limit/)
  );

  const isScanningActive = Boolean(activeAudit || totalSubmitted > 0);

  const calcScore = (hasVuln: boolean, penalty: number = 30) => {
    if (!isScanningActive) return 0;
    return hasVuln ? Math.max(0, 100 - penalty) : 100;
  };

  const riskVectors = [
    {
      category: 'Auth Hijack Vulnerability',
      shortName: 'Auth',
      score: calcScore(hasAuthVuln, 45),
      threat: !isScanningActive ? 'Awaiting Scan' : hasAuthVuln ? '45% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasAuthVuln ? 'Breached' : 'Guarded',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : hasAuthVuln
        ? 'linear-gradient(to top, #991b1b 0%, #ef4444 50%, #f87171 100%)'
        : 'linear-gradient(to top, #047857 0%, #10b981 50%, #34d399 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : hasAuthVuln ? '#ef4444' : '#10b981',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasAuthVuln
        ? 'bg-gradient-to-t from-red-600 via-rose-500 to-red-400'
        : 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasAuthVuln
        ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800'
        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : hasAuthVuln ? 'border-red-500/40' : 'border-emerald-500/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : hasAuthVuln ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400',
      detail: 'require_auth() signature enforcement on state mutators',
    },
    {
      category: 'Storage Rent Eviction (TTL)',
      shortName: 'Storage',
      score: calcScore(hasStorageVuln, 35),
      threat: !isScanningActive ? 'Awaiting Scan' : hasStorageVuln ? '35% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasStorageVuln ? 'Eviction Risk' : 'Protected',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : hasStorageVuln
        ? 'linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fbbf24 100%)'
        : 'linear-gradient(to top, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : hasStorageVuln ? '#f59e0b' : '#06b6d4',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasStorageVuln
        ? 'bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400'
        : 'bg-gradient-to-t from-blue-600 via-cyan-500 to-sky-400',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasStorageVuln
        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
        : 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : hasStorageVuln ? 'border-amber-500/40' : 'border-cyan-500/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : hasStorageVuln ? 'text-amber-500' : 'text-cyan-600 dark:text-cyan-400',
      detail: 'Persistent vs Instance storage isolation & TTL bump automation',
    },
    {
      category: 'Host Panic Crash Risk',
      shortName: 'Safety',
      score: calcScore(hasPanicVuln, 40),
      threat: !isScanningActive ? 'Awaiting Scan' : hasPanicVuln ? '40% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasPanicVuln ? 'Host Panic' : 'Safe',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : hasPanicVuln
        ? 'linear-gradient(to top, #991b1b 0%, #ef4444 50%, #f87171 100%)'
        : 'linear-gradient(to top, #6d28d9 0%, #a855f7 50%, #d946ef 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : hasPanicVuln ? '#ef4444' : '#a855f7',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasPanicVuln
        ? 'bg-gradient-to-t from-red-600 via-rose-500 to-red-400'
        : 'bg-gradient-to-t from-violet-600 via-purple-500 to-fuchsia-400',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasPanicVuln
        ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800'
        : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : hasPanicVuln ? 'border-red-500/40' : 'border-purple-500/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : hasPanicVuln ? 'text-red-500' : 'text-purple-600 dark:text-purple-400',
      detail: 'Elimination of unhandled .unwrap() panics and array indexing crash vectors',
    },
    {
      category: 'Admin Privilege Escalation',
      shortName: 'Admin',
      score: calcScore(hasAdminVuln, 40),
      threat: !isScanningActive ? 'Awaiting Scan' : hasAdminVuln ? '40% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasAdminVuln ? 'Escalation' : 'Guarded',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : hasAdminVuln
        ? 'linear-gradient(to top, #881337 0%, #f43f5e 50%, #fda4af 100%)'
        : 'linear-gradient(to top, #9f1239 0%, #C80552 50%, #fb7185 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : hasAdminVuln ? '#f43f5e' : '#C80552',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasAdminVuln
        ? 'bg-gradient-to-t from-rose-600 via-red-500 to-rose-400'
        : 'bg-gradient-to-t from-rose-600 via-[#E0105E] to-[#FF4D88]',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasAdminVuln
        ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
        : 'text-accent bg-accent-subtle border-accent/30',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : hasAdminVuln ? 'border-rose-500/40' : 'border-accent/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : hasAdminVuln ? 'text-rose-500' : 'text-accent',
      detail: 'Multi-sig admin governance and caller address authentication',
    },
    {
      category: 'Arithmetic Overflow / Underflow',
      shortName: 'Math',
      score: calcScore(hasMathVuln, 30),
      threat: !isScanningActive ? 'Awaiting Scan' : hasMathVuln ? '30% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasMathVuln ? 'Overflow' : 'Safe',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : 'linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fcd34d 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : '#f59e0b',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : 'bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : 'border-amber-500/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400',
      detail: 'Checked integer operations preventing wrap-around arithmetic exploits',
    },
    {
      category: 'Bytecode & Gas Spike Exhaustion',
      shortName: 'Code',
      score: calcScore(hasGasVuln, 25),
      threat: !isScanningActive ? 'Awaiting Scan' : hasGasVuln ? '25% Threat' : '0% Threat',
      status: !isScanningActive ? 'Standby' : hasGasVuln ? 'Gas Spike' : 'Safe',
      gradientStyle: !isScanningActive
        ? 'linear-gradient(to top, #64748b 0%, #94a3b8 100%)'
        : 'linear-gradient(to top, #3730a3 0%, #6366f1 50%, #818cf8 100%)',
      glowColor: !isScanningActive ? '#94a3b8' : '#6366f1',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : 'bg-gradient-to-t from-indigo-600 via-blue-500 to-indigo-400',
      statusColor: !isScanningActive
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800',
      borderColor: !isScanningActive ? 'border-slate-300 dark:border-slate-700' : 'border-indigo-500/40',
      scoreColor: !isScanningActive ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-600 dark:text-indigo-400',
      detail: 'Optimized Soroban release binary complying with 64KB limits',
    },
  ];

  // Dynamic calculation of active guards for Live Threat Shield
  const passingGuardsCount = isScanningActive
    ? [!hasAuthVuln, !hasStorageVuln, !hasPanicVuln, !hasAdminVuln].filter(Boolean).length
    : 0;

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      <WalletGate
        pageTitle="Security Dashboard"
        description="Connect your authorized Stellar / Soroban auditor wallet to view real-time security scores, AST invariant checks, and ledger state."
      >
        {/* Main Dashboard Canvas (Optimized for Mobile & Desktop) */}
        <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          {/* Top Greeting & Operations Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-7 shadow-sm mb-4 sm:mb-6 transition-colors">
            {/* Subtle decorative glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="max-w-3xl">
                {/* Simplified Status Badge */}
                <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-accent-subtle text-accent border border-accent/20 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
                    <span className="font-bold">Shield Engine Active</span>
                    <span className="text-accent/30 font-normal">|</span>
                    <span className="text-slate-700 dark:text-slate-300 font-normal">Soroban Protocol 22</span>
                    {connectedWallet && (
                      <>
                        <span className="text-accent/30 font-normal">|</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Auditor Session
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2.5 flex-wrap">
                  <span>Welcome Back,</span>
                  {connectedWallet ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-accent-subtle dark:bg-accent/15 border border-accent/25 text-accent font-mono text-base sm:text-2xl lg:text-3xl shadow-xs">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0" />
                      <span>{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-6)}</span>
                    </span>
                  ) : (
                    <span className="text-slate-900 dark:text-white">Security Auditor</span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-2xl leading-relaxed">
                  Autonomous AST rule verification, persistent storage rent monitoring, and cryptographic on-chain audit proof inscriptions on the Stellar ledger.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap shrink-0">
                {/* Date / Network Epoch Pill */}
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                  </span>
                </div>

                {/* Run Security Audit Action Button (Brand accent, never black) */}
                <Link
                  href="/audit"
                  className="bg-accent hover:bg-accent-hover text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold shadow-md shadow-accent/25 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Run Security Audit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 3-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* ================= COLUMN 1 (Left): Card 1 & Card 4 ================= */}
            <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
              {/* Card 1: Connected Wallet & Target Score / Ledger State */}
              <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {connectedWallet ? 'Connected Auditor Wallet' : 'Auditor Wallet & State'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Target Score &amp; Ledger State</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${network === 'mainnet' ? 'bg-emerald-500' : 'bg-accent'} animate-pulse`} title={`Active on Stellar ${network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet'}`} />
                </div>

                {connectedWallet ? (
                  <>
                    {/* Card Widget */}
                    <div
                      className="text-white rounded-2xl p-5 shadow-md relative overflow-hidden mb-3"
                      style={{ background: 'linear-gradient(135deg, #B50449 0%, #600226 100%)' }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold tracking-wider text-xs uppercase text-rose-100 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-rose-200" />
                          <span>CONNECTED WALLET</span>
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{network === 'mainnet' ? 'Mainnet Active' : 'Testnet Active'}</span>
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-rose-200 uppercase tracking-wide">
                        Active Connected Signer
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono truncate" title={connectedWallet}>
                          {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-6)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyWallet(connectedWallet)}
                          className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                          title="Copy Wallet Key"
                        >
                          {copiedWallet ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px]">{copiedWallet ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-300/20 text-xs font-mono font-medium text-rose-100">
                        <span className="truncate max-w-[170px]">ID: {connectedWallet.slice(0, 10)}...</span>
                        <span>ROLE: SIGNER ACTIVE</span>
                      </div>
                    </div>

                    {/* Sub-Stat: Verified Inscriptions */}
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold block">Verified Inscriptions</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {totalSubmitted > 0 ? `${totalSubmitted} Ledger ${totalSubmitted === 1 ? 'Record' : 'Records'}` : 'Session Active'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-subtle text-accent border border-accent/20">
                        {totalSubmitted > 0 ? 'Verified' : 'Ready'}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

            {/* Card 4: Recent Security Audits */}
            <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between overflow-hidden transition-colors">
              <div>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security Audits</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Live on-chain inscriptions</p>
                  </div>
                  <Link
                    href="/reports"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition"
                    title="View all verified reports"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="py-8 px-3 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-xs">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                      No Audit Records Yet
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mb-3.5 leading-relaxed">
                      Run your first contract inspection in Audit Studio to generate cryptographic proofs on Stellar.
                    </p>
                    <Link
                      href="/audit"
                      className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Start Security Audit</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {auditHistory.slice(0, 4).map((item: any, idx: number) => {
                      const name = item.contract || 'Soroban Contract';
                      const initials = name
                        .split(' ')
                        .slice(0, 2)
                        .map((w: string) => w[0])
                        .join('')
                        .toUpperCase();
                      const scoreVal = item.riskScore ?? (item.isSecure ? 95 : 55);
                      const dateStr = item.date || item.timestamp || 'Recent';

                      return (
                        <Link
                          key={item.hash || idx}
                          href={`/reports?hash=${item.hash}`}
                          className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 transition cursor-pointer w-full overflow-hidden"
                          title={`View audit for ${name}`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={name}>
                                {name}
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{dateStr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full inline-block ${
                              item.isSecure
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                            }`}>
                              • {item.isSecure ? 'VERIFIED' : 'ACTION REQ'}
                            </span>
                            <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                              Score: {scoreVal}/100
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View all reports footer link to ensure balanced height */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-semibold">
                  {totalSubmitted > 0 ? `${totalSubmitted} recorded ${totalSubmitted === 1 ? 'audit' : 'audits'}` : '0 recorded audits'}
                </span>
                <Link
                  href="/reports"
                  className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-[11px] sm:text-xs"
                >
                  <span>Explore all records</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (Center): Card 2 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
            <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-full transition-colors">
              <div>
                {/* Header with Title and CTA to Audit Studio */}
                <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        Security Threat &amp; Invariant Engine
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Real-time Soroban AST flaw inspection &amp; verification
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/audit"
                    className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 transition flex items-center gap-1"
                  >
                    <span>Audit Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Contracts Submitted & Core Metrics Row (Spacious 2-column layout, full visibility, no truncation) */}
                <div className="grid grid-cols-2 gap-2.5 mb-5 items-stretch">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Contracts Submitted
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {totalSubmitted}
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      {totalSubmitted > 0 ? `+${totalSubmitted} verified this session` : 'Awaiting first contract'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Verified Secure
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {verifiedSecure}
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      {totalSubmitted > 0 ? `${passRate}% pass rate` : '0% pass rate'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Flaws Quarantined
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {totalFlaws}
                      </div>
                    </div>
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-bold block leading-tight">
                      {totalFlaws > 0 ? `${totalFlaws} flaws isolated` : '0 flaws isolated'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Avg AI Latency
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {isScanningActive ? '840ms' : '--'}
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      {isScanningActive ? 'Dual Flash Engine' : 'Dual Flash Engine'}
                    </span>
                  </div>
                </div>

                {/* Smart Contract Risk Header & Filter Toggle (Spacious, Fully Contained Layout) */}
                <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  {/* Row 1: Title and Subtitle with 100% width */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${isScanningActive ? 'bg-accent animate-pulse' : 'bg-slate-400'}`} />
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Smart Contract Security Risk Index
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5 ml-4.5">
                      {isScanningActive
                        ? 'Static AST Threat Detection & On-Chain Rent Exposure'
                        : 'Standby — Upload or paste a contract in Audit Studio to activate live AST threat analysis'}
                    </p>
                  </div>

                  {/* Row 2: Controls Toolbar (Pre/Post Deploy Toggle & Security Score) */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="bg-slate-100/90 dark:bg-slate-900 p-0.5 rounded-full flex items-center border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('PRE')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
                          selectedAuditMode === 'PRE'
                            ? 'bg-accent text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Pre-Deploy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('POST')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
                          selectedAuditMode === 'POST'
                            ? 'bg-accent text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Post-Deploy
                      </button>
                    </div>

                    <div className={`text-xs font-extrabold px-3 py-1 rounded-full whitespace-nowrap shrink-0 transition-all ${
                      isScanningActive
                        ? 'bg-accent text-white shadow-md shadow-accent/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {isScanningActive ? `+${overallRiskScore}% Security Score` : 'Standby'}
                    </div>
                  </div>
                </div>

                {/* Modern Smart Contract Risk Bar Graph with Distinct Colors (Mobile Responsive Container) */}
                <div className="overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex items-end justify-between h-56 sm:h-60 px-1 sm:px-3 pt-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 min-w-[290px] sm:min-w-0">
                    {/* Y Axis Risk Level Reference */}
                    <div className="flex flex-col justify-between h-full text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 py-1 pr-1 shrink-0">
                      <span className="text-accent">100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span className="text-red-500">0%</span>
                    </div>

                    {/* 6 Modern Risk Bars (Color-Coded) */}
                    {riskVectors.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-0"
                        title={`${item.category}: ${isScanningActive ? `${item.score}% Security (${item.threat})` : 'Standby — Scan pending'} — ${item.detail}`}
                      >
                        {/* High-Contrast Security Score Badge (Crystal Clear on Mobile) */}
                        <span
                          className="text-xs sm:text-sm font-black transition-transform group-hover:scale-110 px-1.5 py-0.5 rounded-lg bg-white dark:bg-[#111726] border shadow-xs tracking-tight select-none"
                          style={{
                            color: item.glowColor,
                            borderColor: `${item.glowColor}60`,
                          }}
                        >
                          {isScanningActive ? `${item.score}%` : '0%'}
                        </span>

                        {/* Modern Capsule Track (Explicit h-40 on mobile, h-44 on desktop) */}
                        <div
                          className="w-7 sm:w-10 md:w-11 h-40 sm:h-44 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner transition group-hover:scale-[1.02]"
                          style={{ borderColor: `${item.glowColor}50` }}
                        >
                          {/* Subtle grid pattern background in track */}
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.05)_50%,transparent_75%)] bg-[length:6px_6px]" />

                          {/* Distinct Dynamic Gradient Bar with Glass Reflection */}
                          <div
                            className="w-full rounded-lg sm:rounded-xl transition-all duration-500 relative overflow-hidden shadow-sm"
                            style={{
                              height: isScanningActive ? `${Math.max(item.score, 4)}%` : '0%',
                              background: item.gradientStyle,
                              boxShadow: isScanningActive ? `0 2px 10px ${item.glowColor}40` : 'none',
                            }}
                          >
                            {/* Glass top reflection */}
                            {isScanningActive && (
                              <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                            )}
                          </div>
                        </div>

                        {/* Bar Name and Risk Status Tag */}
                        <div className="text-center w-full">
                          <span className="text-xs sm:text-xs font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight">
                            {item.shortName}
                          </span>
                          <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border inline-block mt-0.5 truncate max-w-[54px] sm:max-w-none ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend & Risk Verification Action */}
              <div className="pt-3.5 mt-2 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: isScanningActive ? (hasAuthVuln ? '#ef4444' : '#10b981') : '#94a3b8' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isScanningActive ? (hasAuthVuln ? 'Auth Alert' : 'Auth Guarded') : 'Auth'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: isScanningActive ? (hasStorageVuln ? '#f59e0b' : '#06b6d4') : '#94a3b8' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isScanningActive ? (hasStorageVuln ? 'Rent Risk' : 'Storage Protected') : 'Storage'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: isScanningActive ? (hasAdminVuln ? '#f43f5e' : '#C80552') : '#94a3b8' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isScanningActive ? (hasAdminVuln ? 'Escalation Alert' : 'Admin Enforced') : 'Admin'}
                    </span>
                  </div>
                </div>
                <Link
                  href="/audit"
                  className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent underline underline-offset-2 flex items-center gap-1 text-xs"
                >
                  <span>Verify Contract in Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3 (Right): Card 3 & Card 5 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
            {/* Card 3: AI Analyzed Smart Contract (Auto-updates when audited/loaded) */}
            <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors">
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        AI Analyzed Contract
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Dual Flash AST Engine</p>
                    </div>
                  </div>
                  <Link
                    href="/audit"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition"
                    title="Open in Audit Studio"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!activeAudit ? (
                  <div className="py-8 px-3 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-xs">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                      No Active Contract Scanned
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mb-3.5 leading-relaxed">
                      Upload or paste a Soroban contract in Audit Studio to inspect real-time AST threat telemetry.
                    </p>
                    <Link
                      href="/audit"
                      className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Launch Audit Studio</span>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Contract Identity & Score Highlight Box */}
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {activeAudit.contractName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                            activeAudit.isSecure
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                              : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {activeAudit.isSecure ? 'VERIFIED' : 'ACTION REQ'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium mb-2">
                        <span className="truncate">{activeAudit.subtitle}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                          {activeAudit.linesCount} lines
                        </span>
                      </div>

                      {/* Score & Verdict Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                            Security Score
                          </span>
                          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                            {activeAudit.riskScore}
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/100</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                            Quarantined Flaws
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-accent">
                            {activeAudit.vulnerabilitiesCount} detected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Security Wave / Sparkline Chart Attached to Card */}
                    <div className="h-16 w-full my-2.5 relative rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/60 p-1.5 overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="analyzedWaveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C80552" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#C80552" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25 L200,60 L0,60 Z"
                          fill="url(#analyzedWaveGradient)"
                        />
                        <path
                          d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25"
                          fill="none"
                          stroke="#C80552"
                          strokeWidth="2.5"
                        />
                      </svg>
                      <div className="absolute top-1.5 right-2 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-accent/20 text-[10px] font-bold text-accent shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                        <span>{activeAudit.riskScore}% Security Curve</span>
                      </div>
                    </div>

                    {/* Contract Hash Proof Pill */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">SHA256:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate text-xs">
                          {activeAudit.contractHash.slice(0, 10)}...{activeAudit.contractHash.slice(-8)}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 shrink-0">
                        Live AST
                      </span>
                    </div>

                    {/* AI Summary snippet */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {activeAudit.summary}
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons: Audit in Studio & View Full Report */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/audit"
                  className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/20 text-center flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Audit Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                {activeAudit ? (
                  <Link
                    href={`/reports?hash=${activeAudit.contractHash}`}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition border border-slate-200/60 dark:border-slate-700 text-center hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Report
                  </Link>
                ) : (
                  <Link
                    href="/reports"
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition border border-slate-200/60 dark:border-slate-700 text-center hover:scale-[1.02] active:scale-[0.98]"
                  >
                    All Reports
                  </Link>
                )}
              </div>
            </div>

            {/* Card 5: Live Threat Shield & AST Defense */}
            <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        Live Threat Shield
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Real-time AST invariant enforcement
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 transition-all ${
                    !isScanningActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      : passingGuardsCount === 4
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : passingGuardsCount >= 2
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  }`}>
                    {isScanningActive ? `${passingGuardsCount} / 4 Active Guards` : '0 Active Guards (Standby)'}
                  </span>
                </div>

                {/* 4 Invariant Security Guards */}
                <div className="space-y-2 mb-3">
                  {/* Guard 1: Authorization Guard */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !isScanningActive ? 'bg-slate-400' : hasAuthVuln ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">
                          Authorization Guard
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate" title={isScanningActive && hasAuthVuln ? 'Missing require_auth() signature enforcement' : 'require_auth() signature enforcement'}>
                          {isScanningActive && hasAuthVuln
                            ? 'Missing require_auth() signature enforcement'
                            : 'require_auth() signature enforcement'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ml-1 ${
                      !isScanningActive
                        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : hasAuthVuln
                        ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800'
                        : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {!isScanningActive ? 'Standby' : hasAuthVuln ? 'Breached' : 'Guarded'}
                    </span>
                  </div>

                  {/* Guard 2: Storage Rent Guardian */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !isScanningActive ? 'bg-slate-400' : hasStorageVuln ? 'bg-amber-500' : 'bg-cyan-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">
                          Storage Rent Guardian
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate" title={isScanningActive && hasStorageVuln ? 'Instance storage TTL exposure & eviction risk' : 'TTL auto-bump & state isolation'}>
                          {isScanningActive && hasStorageVuln
                            ? 'Instance storage TTL exposure & eviction risk'
                            : 'TTL auto-bump & state isolation'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ml-1 ${
                      !isScanningActive
                        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : hasStorageVuln
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                        : 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800'
                    }`}>
                      {!isScanningActive ? 'Standby' : hasStorageVuln ? 'Eviction Risk' : 'Protected'}
                    </span>
                  </div>

                  {/* Guard 3: Panic Crash Shield */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !isScanningActive ? 'bg-slate-400' : hasPanicVuln ? 'bg-red-500' : 'bg-purple-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">
                          Panic Crash Shield
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate" title={isScanningActive && hasPanicVuln ? 'Host panic vector from unhandled .unwrap()' : 'Zero unhandled .unwrap() host panics'}>
                          {isScanningActive && hasPanicVuln
                            ? 'Host panic vector from unhandled .unwrap()'
                            : 'Zero unhandled .unwrap() host panics'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ml-1 ${
                      !isScanningActive
                        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : hasPanicVuln
                        ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800'
                        : 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
                    }`}>
                      {!isScanningActive ? 'Standby' : hasPanicVuln ? 'Host Panic' : 'Safe'}
                    </span>
                  </div>

                  {/* Guard 4: Admin Access Control */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        !isScanningActive ? 'bg-slate-400' : hasAdminVuln ? 'bg-red-500' : 'bg-accent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">
                          Admin Access Control
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate" title={isScanningActive && hasAdminVuln ? 'Admin privilege escalation vector' : 'Multi-sig role & caller authentication'}>
                          {isScanningActive && hasAdminVuln
                            ? 'Admin privilege escalation vector'
                            : 'Multi-sig role & caller authentication'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ml-1 ${
                      !isScanningActive
                        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : hasAdminVuln
                        ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
                        : 'text-accent bg-accent-subtle border-accent/20'
                    }`}>
                      {!isScanningActive ? 'Standby' : hasAdminVuln ? 'Escalation' : 'Enforced'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engine Status Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span className="text-slate-700 dark:text-slate-200 font-semibold text-xs">
                    Continuous AST Verification
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('solace-open-invariants-modal'))}
                    className="font-bold text-accent hover:underline flex items-center gap-1 text-xs cursor-pointer"
                    title="View complete Soroban security invariants status modal"
                  >
                    <span>Invariants Matrix</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <Link
                    href="/monitor"
                    className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-xs"
                  >
                    <span>Monitor</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </WalletGate>
    </div>
  );
}
