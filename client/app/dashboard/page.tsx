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
  Coins,
  PlusCircle,
  History,
  User,
  Mail,
  Link2,
  Sparkles,
} from 'lucide-react';
import { connectWallet, fetchUserCreditBalance, fetchUserCreditHistory } from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';
import PricingModal from '../../components/pricing/PricingModal';
import AmbientBackground3D from '../../components/landing/AmbientBackground3D';
import { motion } from 'framer-motion';
import { Brain, Bot, GitCompare, Terminal } from 'lucide-react';

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
        ? '#64748b'
        : hasAuthVuln
        ? '#ef4444'
        : '#10b981',
      glowColor: !isScanningActive ? '#94a3b8' : hasAuthVuln ? '#ef4444' : '#10b981',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasAuthVuln
        ? 'bg-red-500'
        : 'bg-emerald-500',
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
        ? '#64748b'
        : hasStorageVuln
        ? '#f59e0b'
        : '#06b6d4',
      glowColor: !isScanningActive ? '#94a3b8' : hasStorageVuln ? '#f59e0b' : '#06b6d4',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasStorageVuln
        ? 'bg-amber-500'
        : 'bg-cyan-500',
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
        ? '#64748b'
        : hasPanicVuln
        ? '#ef4444'
        : '#a855f7',
      glowColor: !isScanningActive ? '#94a3b8' : hasPanicVuln ? '#ef4444' : '#a855f7',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasPanicVuln
        ? 'bg-red-500'
        : 'bg-purple-500',
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
        ? '#64748b'
        : hasAdminVuln
        ? '#f43f5e'
        : '#C80552',
      glowColor: !isScanningActive ? '#94a3b8' : hasAdminVuln ? '#f43f5e' : '#C80552',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : hasAdminVuln
        ? 'bg-accent'
        : 'bg-accent',
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
        ? '#64748b'
        : '#f59e0b',
      glowColor: !isScanningActive ? '#94a3b8' : '#f59e0b',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : 'bg-amber-500',
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
        ? '#64748b'
        : '#6366f1',
      glowColor: !isScanningActive ? '#94a3b8' : '#6366f1',
      barGradient: !isScanningActive
        ? 'bg-slate-300 dark:bg-slate-700'
        : 'bg-indigo-500',
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
    <div className="relative w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 pb-24 md:pb-8 transition-colors overflow-x-hidden selection:bg-accent selection:text-white">
      {/* Ambient 3D Motion Background (Shared with Landing Page) */}
      <AmbientBackground3D />

      {/* Background Ambient Glows (Dominant #C80552) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[500px] bg-accent/12 rounded-full blur-[160px]" />
        <div className="absolute top-[280px] left-1/4 w-[350px] h-[350px] bg-accent/8 rounded-full blur-[140px]" />
      </div>

      {/* Main Dashboard Canvas (Optimized for Mobile & Desktop) */}
      <main className="relative z-10 w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          {/* Top Greeting & Operations Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-7 shadow-xl shadow-slate-900/5 dark:shadow-black/40 mb-5 sm:mb-6 transition-all">
            {/* Subtle decorative glow */}
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="max-w-3xl">
                {/* Protocol Status Badges (Landing Page Design) */}
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-[#111726]/90 border border-slate-200/80 dark:border-white/10 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
                    <span className="font-extrabold text-slate-900 dark:text-white">Solace Security Core</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-accent font-bold">Stellar Protocol 22</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" />
                      <span>Multi-LLM Consensus</span>
                    </span>
                    {connectedWallet && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Auditor Active
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2.5 flex-wrap">
                  <span>Welcome Back,</span>
                  {user?.name ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-accent-subtle dark:bg-accent/15 border border-accent/25 text-accent font-black text-xl sm:text-3xl lg:text-4xl shadow-xs">
                      <span>{user.name}</span>
                    </span>
                  ) : connectedWallet ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-accent-subtle dark:bg-accent/15 border border-accent/25 text-accent font-mono text-xl sm:text-3xl lg:text-4xl shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
                      <span>{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-6)}</span>
                    </span>
                  ) : user?.email ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-accent-subtle dark:bg-accent/15 border border-accent/25 text-accent font-black text-xl sm:text-3xl lg:text-4xl shadow-xs">
                      <span>{user.email}</span>
                    </span>
                  ) : (
                    <span className="text-slate-900 dark:text-white">Security Auditor</span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
                  Autonomous AST rule verification, persistent storage rent monitoring, and cryptographic on-chain audit proof inscriptions on the Stellar ledger.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap shrink-0">
                {/* Date / Network Epoch Pill */}
                <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · Stellar Testnet (Protocol 22)
                  </span>
                </div>

                {/* Run Security Audit Action Button (Landing Page signature style) */}
                <Link
                  href="/audit"
                  className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-full text-xs font-extrabold shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 flex items-center gap-2 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
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
              {/* Card 1: Account Identity & Connected Wallet */}
              <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-3.5">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Auditor Account &amp; Identity
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Authentication &amp; Stellar Signer</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" title="Active on Stellar Testnet (Protocol 22)" />
                </div>

                {/* Account Details & Auth Provider Badge */}
                <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 mb-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user?.name || (connectedWallet ? `Auditor ${connectedWallet.slice(0, 6)}` : 'Security Auditor')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 font-medium">
                          <Mail className="w-2.5 h-2.5 shrink-0" />
                          <span>{user?.email || (connectedWallet ? 'Wallet Signer Session' : 'Email Account')}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-accent-subtle text-accent border border-accent/25">
                      {user?.authProvider === 'hybrid' || (user?.email && (connectedWallet || user?.address))
                        ? 'Hybrid (Email + Freighter)'
                        : user?.authProvider === 'wallet' || (connectedWallet && !user?.email)
                        ? 'Stellar Wallet'
                        : 'Email Account'}
                    </span>
                  </div>

                  {/* Dual Architecture Explanation */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">External Blockchain Wallet:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">Testnet XLM (Purchases &amp; Gas)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Internal Audit Credits:</span>
                      <span className="font-mono text-accent font-bold">10 XML = 1 Audit (Non-Expiring)</span>
                    </div>
                  </div>
                </div>

                {connectedWallet || user?.address ? (
                  <>
                    {/* Active Connected Signer Card (Landing Page Rich Gradient) */}
                    <div className="text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden mb-3.5 bg-gradient-to-br from-accent via-[#b00446] to-[#800333] group transition-all">
                      {/* Decorative internal glass orbs */}
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-black/20 rounded-full blur-xl pointer-events-none" />

                      <div className="relative z-10 flex justify-between items-center mb-3">
                        <span className="font-extrabold tracking-wider text-xs uppercase text-rose-100 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-rose-200" />
                          <span>CONNECTED WALLET</span>
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center gap-1 border border-white/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Testnet Active</span>
                        </span>
                      </div>

                      <div className="relative z-10 text-[11px] font-semibold text-rose-200 uppercase tracking-wide">
                        Active Stellar Signer
                      </div>
                      <div className="relative z-10 flex items-center justify-between gap-2 mt-1">
                        <div
                          className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono truncate"
                          title={connectedWallet || user?.address || ''}
                        >
                          {(connectedWallet || user?.address || '').slice(0, 6)}...
                          {(connectedWallet || user?.address || '').slice(-6)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyWallet(connectedWallet || user?.address || '')}
                          className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          title="Copy Wallet Key"
                        >
                          {copiedWallet ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px]">{copiedWallet ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="relative z-10 flex justify-between items-center mt-4 pt-3 border-t border-rose-300/20 text-xs font-mono font-medium text-rose-100">
                        <span className="truncate max-w-[170px]">
                          ID: {(connectedWallet || user?.address || '').slice(0, 10)}...
                        </span>
                        <span>ROLE: SIGNER ACTIVE</span>
                      </div>
                    </div>

                    {/* Sub-Stat: Verified Inscriptions */}
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold block">Verified Inscriptions</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {totalSubmitted > 0 ? `${totalSubmitted} Ledger ${totalSubmitted === 1 ? 'Record' : 'Records'}` : 'Session Active'}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-subtle text-accent border border-accent/20">
                        {totalSubmitted > 0 ? 'Verified' : 'Ready'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-5 rounded-3xl bg-accent-subtle/70 border border-accent/25 flex flex-col justify-between mb-3 text-center space-y-3 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent border border-accent/30 mx-auto flex items-center justify-center shadow-xs">
                      <Link2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        No Stellar Wallet Linked
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Link your Freighter wallet to authorize blockchain transactions, sign ledger proofs, and purchase credit bundles directly.
                      </p>
                    </div>

                    {linkError && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                        {linkError}
                      </div>
                    )}
                    {linkSuccess && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {linkSuccess}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleLinkWallet}
                      disabled={linkingWallet}
                      className="w-full py-2.5 px-4 rounded-full bg-accent hover:bg-accent-hover disabled:bg-slate-300 text-white text-xs font-extrabold transition shadow-md shadow-accent/25 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{linkingWallet ? 'Connecting Freighter...' : 'Link Stellar Wallet (Freighter)'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card 1B: Prepaid Audit Credit Management */}
              <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shadow-xs">
                      <Coins className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Audit Credit Balance</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prepaid Non-Expiring Bundles</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    NEVER EXPIRES
                  </span>
                </div>

                {/* 3-Column Balance Statistics (10 XML = 1 Audit) */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-md text-center mb-3.5 shadow-inner">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Available</div>
                    <div className="text-lg sm:text-2xl font-black font-mono text-accent mt-0.5">
                      {userCredits ? userCredits.availableCredits * 10 : 0} XML
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">
                      {userCredits ? userCredits.availableCredits : 0} Audits
                    </div>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Purchased</div>
                    <div className="text-lg sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {userCredits ? userCredits.totalPurchased * 10 : 0} XML
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">
                      {userCredits ? userCredits.totalPurchased : 0} Audits
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Consumed</div>
                    <div className="text-lg sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {userCredits ? userCredits.totalConsumed * 10 : 0} XML
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">
                      {userCredits ? userCredits.totalConsumed : 0} Audits
                    </div>
                  </div>
                </div>

                {/* Low Credits Alert */}
                {userCredits && userCredits.availableCredits <= 1 && (
                  <div
                    className={`p-3 rounded-2xl text-xs mb-3.5 flex items-start gap-2.5 border backdrop-blur-md ${
                      userCredits.availableCredits === 0
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                        : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                    <div>
                      <div className="font-extrabold">
                        {userCredits.availableCredits === 0 ? 'No Audit Credits Available (0 XML)' : 'Credits Running Low (10 XML Remaining)'}
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-medium">
                        {userCredits.availableCredits === 0
                          ? 'Purchase an audit bundle below to inspect smart contracts on Stellar Soroban (10 XML = 1 Audit).'
                          : 'You only have 10 XML (1 audit) remaining. Stock up on prepaid non-expiring credits at any time.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions & History Toggle */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(true)}
                    className="w-full py-3 px-5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-extrabold transition shadow-lg shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Purchase Audit Bundles (30-90 XLM)</span>
                  </button>

                  {purchaseHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryView(!showHistoryView)}
                      className="w-full py-2 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-accent" />
                        <span>Verified Purchases ({purchaseHistory.length})</span>
                      </span>
                      <span className="text-[10px] text-accent font-bold font-mono">
                        {showHistoryView ? 'Hide Details ▲' : 'View History ▼'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Collapsible Purchase History Details */}
                {showHistoryView && purchaseHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                    {purchaseHistory.map((p, i) => (
                      <div
                        key={p.id || i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            {p.packageName || 'Audit Bundle'} (+{p.credits} Credits)
                          </span>
                          <span className="font-mono text-accent">{p.amountXLM} XLM</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Confirmed'}</span>
                          {p.transactionHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${p.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent font-mono hover:underline flex items-center gap-0.5"
                            >
                              <span>{p.transactionHash.slice(0, 8)}...</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Card 4: Recent Security Audits */}
            <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Security Audits</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Live on-chain inscriptions</p>
                  </div>
                  <Link
                    href="/reports"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition shadow-xs"
                    title="View all verified reports"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="py-8 px-3 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-xs">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                      No Audit Records Yet
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mb-3.5 leading-relaxed font-medium">
                      Run your first contract inspection in Audit Studio to generate cryptographic proofs on Stellar.
                    </p>
                    <Link
                      href="/audit"
                      className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-extrabold transition shadow-md shadow-accent/25 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
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
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-slate-100 dark:border-white/5 hover:border-accent/25 transition cursor-pointer w-full overflow-hidden shadow-xs backdrop-blur-md"
                          title={`View audit for ${name}`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate" title={name}>
                                {name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{dateStr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
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
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  {totalSubmitted > 0 ? `${totalSubmitted} recorded ${totalSubmitted === 1 ? 'audit' : 'audits'}` : '0 recorded audits'}
                </span>
                <Link
                  href="/reports"
                  className="font-extrabold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-xs"
                >
                  <span>Explore all records</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (Center): Card 2 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
            <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex flex-col justify-between h-full">
              <div>
                {/* Header with Title and CTA to Audit Studio */}
                <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4 gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white block leading-tight">
                        Security Threat &amp; Invariant Engine
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Real-time Soroban AST flaw inspection &amp; multi-model consensus
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/audit"
                    className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-extrabold shadow-md shadow-accent/25 transition flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Audit Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Contracts Submitted & Core Metrics Row (Landing Page Style Micro-Cards) */}
                <div className="grid grid-cols-2 gap-3 mb-5 items-stretch">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex flex-col justify-between h-full min-h-[110px] shadow-xs hover:border-accent/30 transition">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold block leading-tight">
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

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex flex-col justify-between h-full min-h-[110px] shadow-xs hover:border-accent/30 transition">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold block leading-tight">
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

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex flex-col justify-between h-full min-h-[110px] shadow-xs hover:border-accent/30 transition">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold block leading-tight">
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

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex flex-col justify-between h-full min-h-[110px] shadow-xs hover:border-accent/30 transition">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold block leading-tight">
                      Multi-LLM Latency
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {isScanningActive ? '1,150ms' : '--'}
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      {isScanningActive ? 'Gemini + GPT-4o + Claude' : 'Consensus Pipeline'}
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
                        ? 'Static AST Threat Detection & Multi-Model Consensus'
                        : 'Standby — Upload or paste a contract in Audit Studio to activate live AST threat analysis'}
                    </p>
                  </div>

                  {/* Row 2: Controls Toolbar (Pre/Post Deploy Toggle & Security Score) */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="bg-slate-100/90 dark:bg-slate-900 p-0.5 rounded-full flex items-center border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('PRE')}
                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
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
                        className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
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

                {/* Modern Smart Contract Risk Bar Graph with Distinct Colors (Landing Page Capsule Styling) */}
                <div className="overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex items-end justify-between h-56 sm:h-60 px-1 sm:px-3 pt-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 min-w-[290px] sm:min-w-0">
                    {/* Y Axis Risk Level Reference */}
                    <div className="flex flex-col justify-between h-full text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200 py-1 pr-1 shrink-0">
                      <span className="text-accent font-black">100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span className="text-red-500 font-black">0%</span>
                    </div>

                    {/* 6 Modern Risk Bars (Color-Coded) */}
                    {riskVectors.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-0"
                        title={`${item.category}: ${isScanningActive ? `${item.score}% Security (${item.threat})` : 'Standby — Scan pending'} — ${item.detail}`}
                      >
                        {/* High-Contrast Security Score Badge */}
                        <span
                          className="text-xs sm:text-sm font-black transition-transform group-hover:scale-110 px-1.5 py-0.5 rounded-lg bg-white dark:bg-[#111726] border shadow-xs tracking-tight select-none"
                          style={{
                            color: item.glowColor,
                            borderColor: `${item.glowColor}60`,
                          }}
                        >
                          {isScanningActive ? `${item.score}%` : '0%'}
                        </span>

                        {/* Modern Capsule Track */}
                        <div
                          className="w-7 sm:w-10 md:w-11 h-40 sm:h-44 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner transition group-hover:scale-[1.03]"
                          style={{ borderColor: `${item.glowColor}50` }}
                        >
                          {/* Track background */}
                          <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/50 pointer-events-none" />

                          {/* Distinct Dynamic Gradient Bar with Glass Reflection */}
                          <div
                            className="w-full rounded-xl transition-all duration-500 relative overflow-hidden shadow-sm"
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
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight">
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
              <div className="pt-3.5 mt-2 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 gap-2">
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
            <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        AI Analyzed Contract
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Multi-LLM Consensus Engine</p>
                    </div>
                  </div>
                  <Link
                    href="/audit"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition shadow-xs"
                    title="Open in Audit Studio"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {!activeAudit ? (
                  <div className="py-8 px-3 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-xs">
                      <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mb-1">
                      No Active Contract Scanned
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mb-3.5 leading-relaxed font-medium">
                      Upload or paste a Soroban contract in Audit Studio to inspect real-time AST threat telemetry.
                    </p>
                    <Link
                      href="/audit"
                      className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-extrabold transition shadow-md shadow-accent/25 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Launch Audit Studio</span>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Contract Identity & Score Highlight Box */}
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 mb-2.5 shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
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

                      {/* Multi-Model Indicator Pills */}
                      <div className="flex items-center gap-1.5 my-2 text-[10px] font-bold flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                          Gemini (Live)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          GPT-4o (Preview)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                          Claude 3.5 (Preview)
                        </span>
                      </div>

                      {/* Score & Verdict Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                            Consensus Score
                          </span>
                          <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                            {activeAudit.riskScore}
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/100</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                            Quarantined Flaws
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-accent">
                            {activeAudit.vulnerabilitiesCount} detected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Security Wave / Sparkline Chart Attached to Card */}
                    <div className="h-16 w-full my-2.5 relative rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/10 p-1.5 overflow-hidden backdrop-blur-xs">
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
                      <div className="absolute top-1.5 right-2 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-accent/20 text-[10px] font-bold text-accent shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                        <span>{activeAudit.riskScore}% Security Curve • 99% Consensus</span>
                      </div>
                    </div>

                    {/* Contract Hash Proof Pill */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-xs flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">SHA256:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate text-xs">
                          {activeAudit.contractHash.slice(0, 10)}...{activeAudit.contractHash.slice(-8)}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 shrink-0">
                        Multi-LLM AST
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
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/audit"
                  className="py-2.5 px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-extrabold transition shadow-md shadow-accent/20 text-center flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Audit Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                {activeAudit ? (
                  <Link
                    href={`/reports?hash=${activeAudit.contractHash}`}
                    className="py-2.5 px-3 rounded-full bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition border border-slate-200/80 dark:border-white/10 text-center hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Report
                  </Link>
                ) : (
                  <Link
                    href="/reports"
                    className="py-2.5 px-3 rounded-full bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition border border-slate-200/80 dark:border-white/10 text-center hover:scale-[1.02] active:scale-[0.98]"
                  >
                    All Reports
                  </Link>
                )}
              </div>
            </div>

            {/* Card 5: Live Threat Shield & AST Defense */}
            <div className="bg-white/85 dark:bg-[#111726]/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-white/10 hover:border-accent/30 transition-all flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        Live Threat Shield
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Real-time AST invariant enforcement
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 transition-all ${
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

                {/* 4 Invariant Security Guards (Landing Page Style Glass Cards) */}
                <div className="space-y-2 mb-3">
                  {/* Guard 1: Authorization Guard */}
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2.5 min-w-0 shadow-xs hover:border-accent/25 transition">
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
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2.5 min-w-0 shadow-xs hover:border-accent/25 transition">
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
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2.5 min-w-0 shadow-xs hover:border-accent/25 transition">
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
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2.5 min-w-0 shadow-xs hover:border-accent/25 transition">
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
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span className="text-slate-700 dark:text-slate-200 font-semibold text-xs">
                    Continuous Multi-LLM AST Verification
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('solace-open-invariants-modal'))}
                    className="font-extrabold text-accent hover:underline flex items-center gap-1 text-xs cursor-pointer"
                    title="View complete Soroban security invariants status modal"
                  >
                    <span>Invariants Matrix</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <Link
                    href="/monitor"
                    className="font-extrabold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-xs"
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
