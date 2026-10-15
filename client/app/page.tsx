'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Shield,
  FileCheck,
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

export default function DashboardPage() {
  const [selectedAuditMode, setSelectedAuditMode] = useState<'PRE' | 'POST'>('PRE');

  const riskVectors = [
    {
      category: 'Auth Hijack Vulnerability',
      shortName: 'Auth Guards',
      score: selectedAuditMode === 'PRE' ? 100 : 100,
      threat: '0% Threat',
      status: 'Guarded',
      statusColor: 'text-accent bg-accent-subtle border-accent/20',
      detail: 'require_auth() signature enforcement on state mutators',
    },
    {
      category: 'Storage Rent Eviction (TTL)',
      shortName: 'State Rent',
      score: selectedAuditMode === 'PRE' ? 97 : 99,
      threat: selectedAuditMode === 'PRE' ? '3% Threat' : '1% Threat',
      status: 'Safe',
      statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      detail: 'Persistent vs Instance storage isolation & TTL bump automation',
    },
    {
      category: 'Host Panic Crash Risk',
      shortName: 'Panic Safety',
      score: selectedAuditMode === 'PRE' ? 94 : 96,
      threat: selectedAuditMode === 'PRE' ? '6% Threat' : '4% Threat',
      status: 'Safe',
      statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      detail: 'Elimination of unhandled .unwrap() panics and array indexing crash vectors',
    },
    {
      category: 'Admin Privilege Escalation',
      shortName: 'Access Control',
      score: selectedAuditMode === 'PRE' ? 100 : 98,
      threat: selectedAuditMode === 'PRE' ? '0% Threat' : '2% Threat',
      status: 'Guarded',
      statusColor: 'text-accent bg-accent-subtle border-accent/20',
      detail: 'Multi-sig admin governance and caller address authentication',
    },
    {
      category: 'Arithmetic Overflow / Underflow',
      shortName: 'Safe Math',
      score: selectedAuditMode === 'PRE' ? 98 : 100,
      threat: selectedAuditMode === 'PRE' ? '2% Threat' : '0% Threat',
      status: 'Safe',
      statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      detail: 'Checked integer operations preventing wrap-around arithmetic exploits',
    },
    {
      category: 'Bytecode & Gas Spike Exhaustion',
      shortName: 'Bytecode Wasm',
      score: selectedAuditMode === 'PRE' ? 96 : 97,
      threat: selectedAuditMode === 'PRE' ? '4% Threat' : '3% Threat',
      status: 'Safe',
      statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
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
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  Dual Gemini AI Fallback
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome Back, Security Auditor
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Autonomous AST rule verification, persistent storage rent monitoring, and cryptographic on-chain audit proof inscriptions on the Stellar ledger.
              </p>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap shrink-0">
              {/* Date / Testnet Epoch Pill */}
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-2">
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
                  <p className="text-[11px] text-slate-400">Target Score & Ledger State</p>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Testnet Active
                  </span>
                </div>

                <div className="text-[10px] text-rose-200 uppercase tracking-wide">
                  Deployed Instance ID
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  CBXV73...NKDQ
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-300/20 text-[10px] sm:text-[11px] font-mono text-rose-100">
                  <span>ID: CBXV73FFYM...</span>
                  <span>EXP: 51,840 LEDGERS</span>
                </div>
              </div>

              {/* Sub-Stat: Verified Inscriptions */}
              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Verified Inscriptions</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">+3,945 Ledger Txs</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent border border-accent-subtle">
                  +12.8%
                </span>
              </div>
            </div>

            {/* Card 4: Recent Security Audits */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security Audits</h2>
                  <p className="text-[11px] text-slate-400">Live on-chain inscriptions</p>
                </div>
                <Link
                  href="/reports"
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition"
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
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{item.date} • {item.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        item.isSecure
                          ? 'bg-accent-subtle text-accent border border-accent-subtle'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                      }`}>
                        • {item.status}
                      </span>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        Score: {item.score}
                      </div>
                    </div>
                  </Link>
                ))}
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
                      <span className="text-[10px] text-slate-400">
                        Real-time Soroban AST flaw inspection & verification
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

                {/* Contracts Submitted & Core Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Contracts Submitted
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      1,428
                    </div>
                    <span className="text-[10px] text-accent font-semibold block mt-0.5">
                      +24.6% this epoch
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Verified Secure
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      1,392
                    </div>
                    <span className="text-[10px] text-accent font-semibold block mt-0.5">
                      97.5% pass rate
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Flaws Quarantined
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      36
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                      0 exploit leaks
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Avg AI Latency
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      840ms
                    </div>
                    <span className="text-[10px] text-accent font-semibold block mt-0.5">
                      Dual Flash Engine
                    </span>
                  </div>
                </div>

                {/* Smart Contract Risk Header & Filter Toggle (Item 2 & 4: No black buttons, crystal clear risks) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Smart Contract Security Risk Index
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Static AST Threat Detection & On-Chain Rent Exposure
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                    {/* Toggle Buttons (Brand Accent when selected, never black) */}
                    <div className="bg-slate-100/90 dark:bg-slate-900 p-1 rounded-full flex items-center border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('PRE')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
                          selectedAuditMode === 'PRE'
                            ? 'bg-accent text-white shadow-md shadow-accent/25'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        Pre-Deploy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('POST')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap select-none ${
                          selectedAuditMode === 'POST'
                            ? 'bg-accent text-white shadow-md shadow-accent/25'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        Post-Deploy
                      </button>
                    </div>

                    {/* Overall Risk Rating Badge */}
                    <div className="bg-accent text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md shadow-accent/20 whitespace-nowrap shrink-0">
                      +98.2% Security Score
                    </div>
                  </div>
                </div>

                {/* Modern Smart Contract Risk Bar Graph (Item 4: Modern Graph with Risk Levels) */}
                <div className="flex items-end justify-between h-56 sm:h-60 px-1 sm:px-3 pt-3 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 gap-1 sm:gap-2">
                  {/* Y Axis Risk Level Reference */}
                  <div className="flex flex-col justify-between h-full text-[9px] font-bold text-slate-400 dark:text-slate-500 py-1 pr-1 shrink-0">
                    <span className="text-accent">100% Safe</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span className="text-red-500">0% Threat</span>
                  </div>

                  {/* 6 Modern Risk Bars */}
                  {riskVectors.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-0"
                      title={`${item.category}: ${item.score}% Security (${item.threat}) — ${item.detail}`}
                    >
                      {/* Security Score percentage pill above bar */}
                      <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 dark:text-slate-200 transition-transform group-hover:scale-110">
                        {item.score}%
                      </span>

                      {/* Modern Capsule Track */}
                      <div className="w-7 sm:w-10 md:w-11 h-40 sm:h-44 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner group-hover:border-accent/40 transition">
                        {/* Subtle grid pattern background in track */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.05)_50%,transparent_75%)] bg-[length:6px_6px]" />

                        {/* Dynamic Gradient Bar with Glass Reflection */}
                        <div
                          className={`w-full rounded-xl transition-all duration-500 relative overflow-hidden shadow-sm ${
                            item.score === 100
                              ? 'bg-gradient-to-t from-accent via-[#E0105E] to-[#FF4D88]'
                              : 'bg-gradient-to-t from-accent/90 to-[#E63975]'
                          }`}
                          style={{ height: `${item.score}%` }}
                        >
                          {/* Glass top reflection */}
                          <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                        </div>
                      </div>

                      {/* Bar Name and Risk Status Tag */}
                      <div className="text-center w-full">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                          {item.shortName}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend & Risk Verification Action */}
              <div className="pt-3.5 mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                    <span className="text-[11px] font-medium">Guarded (0% Risk)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span className="text-[11px] font-medium">Safe (&lt;5% Threat)</span>
                  </div>
                </div>
                <Link
                  href="/audit"
                  className="font-bold text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent underline underline-offset-2 flex items-center gap-1 text-[11px]"
                >
                  <span>Verify Contract in Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3 (Right): Card 3 & Card 5 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 3: AI Security Precision */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Security Precision</h2>
                    <p className="text-[11px] text-slate-400">Gemini Invariant Fallback Engine</p>
                  </div>
                  <Link
                    href="/monitor"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition"
                    title="Monitor live telemetry"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="text-center py-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Exploit Prevention Rate
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    99.8% Precision
                  </span>
                  <span className="text-[10px] text-accent font-semibold block mt-0.5">
                    0 Exploit Leaks · Dual Fallback Flash
                  </span>
                </div>

                {/* Smooth Wave / Sparkline Chart */}
                <div className="h-20 w-full my-2">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C80552" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#C80552" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25 L200,60 L0,60 Z"
                      fill="url(#waveGradient)"
                    />
                    <path
                      d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25"
                      fill="none"
                      stroke="#C80552"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Two Pill Buttons: Run Audit & Inspect Live (Accent & Slate, never black) */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/audit"
                  className="py-2.5 px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/20 text-center"
                >
                  Run Audit
                </Link>
                <Link
                  href="/monitor"
                  className="py-2.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-200/60 dark:border-slate-700 text-center"
                >
                  Inspect Live
                </Link>
              </div>
            </div>

            {/* Card 5: On-Chain Audit Anchors & Auditor Quorum */}
            <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-accent-subtle flex items-center justify-center text-accent shrink-0 border border-accent/20 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      On-Chain Audit Anchors
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Cryptographic ledger proofs on Stellar
                    </p>
                  </div>
                </div>

                {/* Primary Metric Row */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-slate-900/40 border border-slate-200/70 dark:border-slate-800 mb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Ledger Inscriptions
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1 block">
                      3,945 Proofs
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-subtle text-accent border border-accent/20 inline-flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      100% Immutable
                    </span>
                  </div>
                </div>

                {/* SHA-256 AST Inscription Banner */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-accent shrink-0 shadow-xs mt-0.5">
                    <Lock className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                      SHA-256 AST Hash Inscription
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                      Anchored directly into Solace Core Contract
                    </span>
                  </div>
                </div>
              </div>

              {/* Auditor Signature Quorum Section */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                      Auditor Signature Quorum
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Ed25519 Testnet Keypairs
                    </p>
                  </div>
                  <a
                    href="https://stellar.expert/explorer/testnet/account/GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shadow-xs"
                    title="View Auditor Signer on Stellar Expert"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Keypair Box & Threshold */}
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI">
                        GBWSB2...7FDYPI
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 shrink-0">
                      Active Signer
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Consensus Threshold</span>
                    <span className="font-bold text-slate-900 dark:text-white">3-of-4 Signers Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
