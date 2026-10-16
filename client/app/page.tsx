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
} from 'lucide-react';

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
}

export default function DashboardPage() {
  const [selectedAuditMode, setSelectedAuditMode] = useState<'PRE' | 'POST'>('PRE');

  const defaultActiveAudit: ActiveAuditInfo = {
    contractName: 'Solace Core Security Contract',
    subtitle: 'contract/src/lib.rs',
    contractHash: '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a',
    riskScore: 85,
    isSecure: true,
    summary: 'Autonomous Solace Dual Flash AST inspection verified require_auth() invariants and persistent rent protection.',
    vulnerabilitiesCount: 0,
    auditType: 'PRE_DEPLOYMENT',
    timestamp: '12:20 PM',
    date: '15 Oct 2026',
    linesCount: 36,
  };

  const [activeAudit, setActiveAudit] = useState<ActiveAuditInfo>(defaultActiveAudit);

  useEffect(() => {
    const loadActiveAudit = () => {
      try {
        const stored = localStorage.getItem('solace-active-contract-audit');
        if (stored) {
          const parsed = JSON.parse(stored);
          setActiveAudit((prev) => ({ ...prev, ...parsed }));
        }
      } catch (_) {}
    };

    loadActiveAudit();

    window.addEventListener('storage', loadActiveAudit);
    window.addEventListener('solace-audit-updated', loadActiveAudit);
    window.addEventListener('focus', loadActiveAudit);

    return () => {
      window.removeEventListener('storage', loadActiveAudit);
      window.removeEventListener('solace-audit-updated', loadActiveAudit);
      window.removeEventListener('focus', loadActiveAudit);
    };
  }, []);

  const riskVectors = [
    {
      category: 'Auth Hijack Vulnerability',
      shortName: 'Auth',
      score: selectedAuditMode === 'PRE' ? 100 : 100,
      threat: '0% Threat',
      status: 'Guarded',
      gradientStyle: 'linear-gradient(to top, #047857 0%, #10b981 50%, #34d399 100%)',
      glowColor: '#10b981',
      barGradient: 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400',
      statusColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      borderColor: 'border-emerald-500/40',
      scoreColor: 'text-emerald-600 dark:text-emerald-400',
      detail: 'require_auth() signature enforcement on state mutators',
    },
    {
      category: 'Storage Rent Eviction (TTL)',
      shortName: 'Storage',
      score: selectedAuditMode === 'PRE' ? 97 : 99,
      threat: selectedAuditMode === 'PRE' ? '3% Threat' : '1% Threat',
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)',
      glowColor: '#06b6d4',
      barGradient: 'bg-gradient-to-t from-blue-600 via-cyan-500 to-sky-400',
      statusColor: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800',
      borderColor: 'border-cyan-500/40',
      scoreColor: 'text-cyan-600 dark:text-cyan-400',
      detail: 'Persistent vs Instance storage isolation & TTL bump automation',
    },
    {
      category: 'Host Panic Crash Risk',
      shortName: 'Safety',
      score: selectedAuditMode === 'PRE' ? 94 : 96,
      threat: selectedAuditMode === 'PRE' ? '6% Threat' : '4% Threat',
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #6d28d9 0%, #a855f7 50%, #d946ef 100%)',
      glowColor: '#a855f7',
      barGradient: 'bg-gradient-to-t from-violet-600 via-purple-500 to-fuchsia-400',
      statusColor: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800',
      borderColor: 'border-purple-500/40',
      scoreColor: 'text-purple-600 dark:text-purple-400',
      detail: 'Elimination of unhandled .unwrap() panics and array indexing crash vectors',
    },
    {
      category: 'Admin Privilege Escalation',
      shortName: 'Admin',
      score: selectedAuditMode === 'PRE' ? 100 : 98,
      threat: selectedAuditMode === 'PRE' ? '0% Threat' : '2% Threat',
      status: 'Guarded',
      gradientStyle: 'linear-gradient(to top, #9f1239 0%, #C80552 50%, #fb7185 100%)',
      glowColor: '#C80552',
      barGradient: 'bg-gradient-to-t from-rose-600 via-[#E0105E] to-[#FF4D88]',
      statusColor: 'text-accent bg-accent-subtle border-accent/30',
      borderColor: 'border-accent/40',
      scoreColor: 'text-accent',
      detail: 'Multi-sig admin governance and caller address authentication',
    },
    {
      category: 'Arithmetic Overflow / Underflow',
      shortName: 'Math',
      score: selectedAuditMode === 'PRE' ? 98 : 100,
      threat: selectedAuditMode === 'PRE' ? '2% Threat' : '0% Threat',
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fcd34d 100%)',
      glowColor: '#f59e0b',
      barGradient: 'bg-gradient-to-t from-amber-600 via-orange-500 to-amber-400',
      statusColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
      borderColor: 'border-amber-500/40',
      scoreColor: 'text-amber-600 dark:text-amber-400',
      detail: 'Checked integer operations preventing wrap-around arithmetic exploits',
    },
    {
      category: 'Bytecode & Gas Spike Exhaustion',
      shortName: 'Code',
      score: selectedAuditMode === 'PRE' ? 96 : 97,
      threat: selectedAuditMode === 'PRE' ? '4% Threat' : '3% Threat',
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #3730a3 0%, #6366f1 50%, #818cf8 100%)',
      glowColor: '#6366f1',
      barGradient: 'bg-gradient-to-t from-indigo-600 via-blue-500 to-indigo-400',
      statusColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800',
      borderColor: 'border-indigo-500/40',
      scoreColor: 'text-indigo-600 dark:text-indigo-400',
      detail: 'Optimized Soroban release binary complying with 64KB limits',
    },
  ];

  const recentAudits = [
    {
      name: 'Solace Core Contract',
      subtitle: 'contract/src/lib.rs',
      date: '15 Oct 2026',
      time: '12:20 PM',
      status: 'Successful',
      hash: '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a',
      score: '85/100',
      initials: 'SC',
      bgColor: 'bg-accent-subtle text-accent border border-accent-subtle',
      isSecure: true,
    },
    {
      name: 'Vault Lending Pool Protocol',
      subtitle: 'vault_protocol.rs',
      date: '15 Oct 2026',
      time: '11:45 AM',
      status: 'Successful',
      hash: '8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4',
      score: '92/100',
      initials: 'VP',
      bgColor: 'bg-blue-100 text-blue-800',
      isSecure: true,
    },
    {
      name: 'Liquidity Distributor Vault',
      subtitle: 'distributor.rs',
      date: '14 Oct 2026',
      time: '10:15 AM',
      status: 'Action Required',
      hash: '11173fe05370006e4579671e6c8a34c55e4428cbfd9fa342bdb4eeb7ab70e8e9',
      score: '48/100',
      initials: 'LD',
      bgColor: 'bg-red-100 text-red-800',
      isSecure: false,
    },
    {
      name: 'AMM Liquidity Pool',
      subtitle: 'liquidity_pool.rs',
      date: '14 Oct 2026',
      time: '09:30 AM',
      status: 'Successful',
      hash: '3f7a18b2c90e45d120a4b7c89f01e23a456789b0c1d2e3f4a5b6c7d8e9f0a1b2',
      score: '95/100',
      initials: 'AL',
      bgColor: 'bg-purple-100 text-purple-800',
      isSecure: true,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      {/* Main Dashboard Canvas */}
      <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Greeting & Operations Banner (Item 5: Enhanced) */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm mb-6 transition-colors">
          {/* Subtle decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="max-w-3xl">
              {/* Status pill & Network tags */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block" />
                  SHIELD ENGINE ACTIVE
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  Stellar Soroban v22 Protocol
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome Back, Security Auditor
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-2xl leading-relaxed">
                Autonomous AST rule verification, persistent storage rent monitoring, and cryptographic on-chain audit proof inscriptions on the Stellar ledger.
              </p>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap shrink-0">
              {/* Date / Testnet Epoch Pill */}
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>15 Oct, 2026 · Testnet Epoch 542</span>
              </div>

              {/* Run Security Audit Action Button (Brand accent, never black) */}
              <Link
                href="/audit"
                className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md shadow-accent/25 transition flex items-center gap-2 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Run Security Audit</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3-Column Dashboard Layout (matching the exact UI idea from the reference image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ================= COLUMN 1 (Left): Card 1 & Card 4 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: Contract Security / Target Score & Ledger State */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Contract Security</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Target Score &amp; Ledger State</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" title="Active on Stellar Testnet" />
              </div>

              {/* Card Widget */}
              <div
                className="text-white rounded-2xl p-5 shadow-md relative overflow-hidden mb-3"
                style={{ background: 'linear-gradient(135deg, #B50449 0%, #600226 100%)' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold tracking-wider text-xs uppercase text-rose-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-200" />
                    <span>SOLACE CORE</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Testnet Active
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-rose-200 uppercase tracking-wide">
                  Deployed Instance ID
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  CBXV73...NKDQ
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-300/20 text-xs font-mono font-medium text-rose-100">
                  <span>ID: CBXV73FFYM...</span>
                  <span>EXP: 51,840 LEDGERS</span>
                </div>
              </div>

              {/* Sub-Stat: Verified Inscriptions */}
              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold block">Verified Inscriptions</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">+3,945 Ledger Txs</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-subtle text-accent border border-accent/20">
                  +12.8%
                </span>
              </div>
            </div>
            {/* Card 4: Recent Security Audits */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between overflow-hidden transition-colors">
              <div>
                <div className="flex justify-between items-center mb-4">
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

                <div className="space-y-2.5">
                  {recentAudits.map((item, idx) => (
                    <Link
                      key={idx}
                      href={`/reports?hash=${item.hash}`}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 transition cursor-pointer w-full overflow-hidden"
                      title={`View audit for ${item.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div className={`w-8 h-8 rounded-xl ${item.bgColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                          {item.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.date} • {item.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          item.isSecure
                            ? 'bg-accent-subtle text-accent border border-accent/20'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                        }`}>
                          • {item.status}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          Score: {item.score}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* View all reports footer link to ensure balanced height */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">4 of 3,945 records</span>
                <Link
                  href="/reports"
                  className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-xs"
                >
                  <span>Explore all records</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (Center): Card 2 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-full transition-colors">
              <div>
                {/* Header with Title and CTA to Audit Studio */}
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                        Security Threat & Invariant Engine
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
                        1,428
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      +24.6% this epoch
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Verified Secure
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        1,392
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      97.5% pass rate
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Flaws Quarantined
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        36
                      </div>
                    </div>
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-bold block leading-tight">
                      0 exploit leaks
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between h-full min-h-[110px]">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold block leading-tight">
                      Avg AI Latency
                    </span>
                    <div className="my-1">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                        840ms
                      </div>
                    </div>
                    <span className="text-xs text-accent font-bold block leading-tight">
                      Dual Flash Engine
                    </span>
                  </div>
                </div>

                {/* Smart Contract Risk Header & Filter Toggle (Spacious, Fully Contained Layout) */}
                <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  {/* Row 1: Title and Subtitle with 100% width */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block animate-pulse shrink-0" />
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Smart Contract Security Risk Index
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5 ml-4.5">
                      Static AST Threat Detection &amp; On-Chain Rent Exposure
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

                    <div className="bg-accent text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md shadow-accent/20 whitespace-nowrap shrink-0">
                      +98.2% Security Score
                    </div>
                  </div>
                </div>

                {/* Modern Smart Contract Risk Bar Graph with Distinct Colors */}
                <div className="flex items-end justify-between h-56 sm:h-60 px-1 sm:px-3 pt-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 gap-1 sm:gap-2">
                  {/* Y Axis Risk Level Reference */}
                  <div className="flex flex-col justify-between h-full text-[10px] font-extrabold text-slate-600 dark:text-slate-300 py-1 pr-1 shrink-0">
                    <span className="text-accent">100% Safe</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span className="text-red-500">0% Threat</span>
                  </div>

                  {/* 6 Modern Risk Bars (Color-Coded) */}
                  {riskVectors.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-0"
                      title={`${item.category}: ${item.score}% Security (${item.threat}) — ${item.detail}`}
                    >
                      {/* Security Score percentage pill above bar with bar color */}
                      <span className={`text-xs font-black transition-transform group-hover:scale-110 ${item.scoreColor}`}>
                        {item.score}%
                      </span>

                      {/* Modern Capsule Track */}
                      <div
                        className="w-7 sm:w-10 md:w-11 h-40 sm:h-44 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner transition group-hover:scale-[1.02]"
                        style={{ borderColor: `${item.glowColor}40` }}
                      >
                        {/* Subtle grid pattern background in track */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.05)_50%,transparent_75%)] bg-[length:6px_6px]" />

                        {/* Distinct Dynamic Gradient Bar with Glass Reflection */}
                        <div
                          className="w-full rounded-xl transition-all duration-500 relative overflow-hidden shadow-sm"
                          style={{
                            height: `${item.score}%`,
                            background: item.gradientStyle,
                            boxShadow: `0 2px 10px ${item.glowColor}40`,
                          }}
                        >
                          {/* Glass top reflection */}
                          <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                        </div>
                      </div>

                      {/* Bar Name and Risk Status Tag */}
                      <div className="text-center w-full">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate leading-tight">
                          {item.shortName}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border inline-block mt-0.5 ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend & Risk Verification Action */}
              <div className="pt-3.5 mt-2 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#10b981' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Auth Guarded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#06b6d4' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Storage Safe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#C80552' }} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Admin Guarded</span>
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
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 3: AI Analyzed Smart Contract (Auto-updates when audited/loaded) */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors">
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

                {/* Contract Identity & Score Highlight Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 mb-2">
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
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                        Security Score
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {activeAudit.riskScore}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/100</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider block font-bold">
                        Quarantined Flaws
                      </span>
                      <span className="text-sm font-bold text-accent">
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
                <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">SHA256:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate text-xs">
                      {activeAudit.contractHash.slice(0, 10)}...{activeAudit.contractHash.slice(-8)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 shrink-0">
                    Live AST
                  </span>
                </div>

                {/* AI Summary snippet */}
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {activeAudit.summary}
                </p>
              </div>

              {/* Action Buttons: Audit in Studio & View Full Report */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/audit"
                  className="py-2.5 px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/20 text-center flex items-center justify-center gap-1"
                >
                  <span>Audit Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/reports?hash=${activeAudit.contractHash}`}
                  className="py-2.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition border border-slate-200/60 dark:border-slate-700 text-center"
                >
                  View Report
                </Link>
              </div>
            </div>

            {/* Card 5: Live Threat Shield & AST Defense */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-1 flex flex-col justify-between transition-colors">
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    4 Active Guards
                  </span>
                </div>

                {/* 4 Invariant Security Guards */}
                <div className="space-y-2 mb-3">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          Authorization Guard
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate">
                          require_auth() signature enforcement
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Guarded
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          Storage Rent Guardian
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate">
                          TTL auto-bump & state isolation
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shrink-0">
                      Protected
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          Panic Crash Shield
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate">
                          Zero unhandled .unwrap() host panics
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shrink-0">
                      Safe
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          Admin Access Control
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate">
                          Multi-sig role & caller authentication
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 shrink-0">
                      Enforced
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
                <Link
                  href="/monitor"
                  className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent flex items-center gap-1 text-xs"
                >
                  <span>Open Monitor</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
