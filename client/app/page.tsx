'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import SidebarDock from '../components/layout/SidebarDock';
import ContractInput from '../components/audit/ContractInput';

interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

interface AuditReport {
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilities: Vulnerability[];
  postDeploymentRecommendations: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DashboardPage() {
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [selectedAuditMode, setSelectedAuditMode] = useState<'PRE' | 'POST'>('PRE');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [isPostDeployment, setIsPostDeployment] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [contractHash, setContractHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [anchoring, setAnchoring] = useState<boolean>(false);
  const [anchorResult, setAnchorResult] = useState<{
    transactionHash: string;
    contractId: string;
    explorerUrl: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const handleAudit = async () => {
    if (!codeSnippet.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeSnippet, isPostDeployment }),
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.data || data.report);
        if (data.contractHash) {
          setContractHash(data.contractHash);
        }
      } else {
        setError(data.error || 'Failed to generate audit report.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Ensure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnchorOnChain = async () => {
    if (!report || !contractHash) {
      setError('Please run an audit first before anchoring on-chain.');
      return;
    }
    setAnchoring(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/contract/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractHash,
          riskScore: report.riskScore,
          isSecure: report.isSecure,
          auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAnchorResult({
          transactionHash: data.transactionHash,
          contractId: data.contractId,
          explorerUrl: data.explorerUrl,
        });
      } else {
        setError(data.error || 'Failed to anchor audit on Soroban ledger.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error recording audit onto the Stellar ledger.');
    } finally {
      setAnchoring(false);
    }
  };

  const handleCopyHash = () => {
    if (!contractHash) return;
    navigator.clipboard.writeText(contractHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

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
    },
    {
      name: 'Vault Lending Pool Protocol',
      subtitle: 'vault_protocol.rs',
      date: '15 Oct 2026',
      time: '11:45 AM',
      status: 'Successful',
      hash: '8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4',
      score: '12/100',
      initials: 'VP',
      bgColor: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Liquidity Distributor Vault',
      subtitle: 'distributor.rs',
      date: '14 Oct 2026',
      time: '10:15 AM',
      status: 'Action Required',
      hash: '11173fe05370006e4579671e6c8a34c55e4428cbfd9fa342bdb4eeb7ab70e8e9',
      score: '95/100',
      initials: 'LD',
      bgColor: 'bg-red-100 text-red-800',
    },
  ];

  return (
    <div className="flex w-full min-h-screen">
      {/* Floating Left Sidebar Dock (matching reference image) */}
      <SidebarDock onOpenAudit={() => setShowAuditModal(true)} />

      {/* Main Dashboard Canvas */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Greeting & Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back, Auditor
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Autonomous smart contract security & on-chain provenance on Stellar Soroban
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            {/* Date / Network Pill */}
            <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-full text-xs font-medium text-slate-700 shadow-sm flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>15 Oct, 2026 - Stellar Testnet</span>
            </div>

            {/* + Run Security Audit Action Button */}
            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>+ Run Security Audit</span>
            </button>
          </div>
        </div>

        {/* 3-Column Dashboard Layout (matching reference image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ================= COLUMN 1 (Top Left): Card 1 ================= */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: Contract Security / Credit Card Widget */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Contract Security</h2>
                  <p className="text-[11px] text-slate-400">Target Score & Ledger State</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition"
                  title="Inspect"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* Card Widget (Dark luxury theme matching the VISA card in image, with Solace brand accent) */}
              <div
                className="text-white rounded-2xl p-5 shadow-md relative overflow-hidden mb-4"
                style={{ background: 'linear-gradient(135deg, #B50449 0%, #600226 100%)' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold tracking-wider text-xs uppercase text-rose-100">
                    SOLACE CORE
                  </span>
                  {/* Wave contactless icon */}
                  <svg className="w-5 h-5 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 14a6 6 0 018 0M5 10a10 10 0 0114 0" />
                  </svg>
                </div>

                <div className="text-[10px] text-rose-200 uppercase tracking-wide">
                  Deployed Instance ID
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  CBXV73...NKDQ
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-300/20 text-[11px] font-mono text-rose-100">
                  <span>ID: CBXV73FFYM...</span>
                  <span>EXP: 51,840 LEDGERS</span>
                </div>
              </div>

              {/* Sub-Stat: Weekly Inscriptions */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Verified Inscriptions</span>
                  <span className="text-base font-bold text-slate-900">+3,945 Ledger Txs</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent border border-accent-subtle">
                  +12.8%
                </span>
              </div>
            </div>

            {/* Card 4: Recent Verified Audits Table (matching Payment History) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Recent Security Audits</h2>
                  <p className="text-[11px] text-slate-400">Live on-chain inscriptions</p>
                </div>
                <Link
                  href="/reports"
                  className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition"
                  title="View all verified reports"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              <div className="space-y-3">
                {recentAudits.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      window.location.href = `/reports?hash=${item.hash}`;
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${item.bgColor} flex items-center justify-center font-bold text-xs`}>
                        {item.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.date} • {item.time}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        item.status === 'Successful'
                          ? 'bg-accent-subtle text-accent border border-accent-subtle'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        • {item.status}
                      </span>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= COLUMN 2 (Center): Card 2 ================= */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Card 2: Security Invariants Bar Chart (matching Engagement Rate in image) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Security Invariants</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pre / Post Toggle Pill */}
                    <div className="bg-slate-100 p-0.5 rounded-full flex text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('PRE')}
                        className={`px-3 py-1 rounded-full font-medium transition ${
                          selectedAuditMode === 'PRE'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Pre-Deploy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAuditMode('POST')}
                        className={`px-3 py-1 rounded-full font-medium transition ${
                          selectedAuditMode === 'POST'
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Post-Deploy
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAuditModal(true)}
                      className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition"
                      title="Inspect"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Top Highlight Pill above the peak bar */}
                <div className="flex justify-center mb-3">
                  <div className="bg-accent text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <span>+98.2% Pass Rate</span>
                  </div>
                </div>

                {/* Bar Chart Visualization (matching reference image) */}
                <div className="flex items-end justify-between h-48 sm:h-56 px-2 sm:px-6 pt-4 border-b border-dashed border-slate-200">
                  {/* Y Axis reference */}
                  <div className="flex flex-col justify-between h-full text-[10px] text-slate-400 py-1 pr-2">
                    <span>5k</span>
                    <span>4k</span>
                    <span>3k</span>
                    <span>2k</span>
                    <span>1k</span>
                    <span>0</span>
                  </div>

                  {/* 6 Rounded Bars (Auth, Storage, TTL, Access, Math, Upgrade) */}
                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-32 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden transition group-hover:bg-accent/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.18)_50%,transparent_75%)] bg-[length:8px_8px]" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">Auth</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-40 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden transition group-hover:bg-accent/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.18)_50%,transparent_75%)] bg-[length:8px_8px]" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">Storage</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-36 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden transition group-hover:bg-accent/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.18)_50%,transparent_75%)] bg-[length:8px_8px]" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">TTL</span>
                  </div>

                  {/* Highlighting Peak Bar (Access Control - Apr in image) */}
                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-48 rounded-2xl bg-accent shadow-md relative overflow-hidden transition group-hover:bg-accent-hover">
                      <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">Access</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-34 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden transition group-hover:bg-accent/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.18)_50%,transparent_75%)] bg-[length:8px_8px]" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">Math</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-8 sm:w-10 h-38 rounded-2xl bg-accent-subtle border border-accent/20 relative overflow-hidden transition group-hover:bg-accent/20">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.18)_50%,transparent_75%)] bg-[length:8px_8px]" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">Upgrade</span>
                  </div>
                </div>
              </div>

              {/* Sub-Card Details inside Center Column */}
              <div className="pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                  <span>Enforced Authorization Protocols</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="font-semibold text-slate-900 hover:text-accent underline underline-offset-2"
                >
                  Test Contract Code
                </button>
              </div>
            </div>
          </div>

          {/* ================= COLUMN 3 (Right): Card 3 & 5 ================= */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Card 3: Storage Rent TTL & Wave Chart (matching Total Balance in image) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Storage Rent TTL</h2>
                    <p className="text-[11px] text-slate-400">Ledger Rent Balance</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/monitor';
                    }}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition"
                    title="Monitor"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

                <div className="text-center py-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Active Ledger TTL
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    51,840 Ledgers
                  </span>
                </div>

                {/* Smooth Wave / Sparkline Chart (matching reference image) */}
                <div className="h-20 w-full my-2">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C80552" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#C80552" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Fill */}
                    <path
                      d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25 L200,60 L0,60 Z"
                      fill="url(#waveGradient)"
                    />
                    {/* Line */}
                    <path
                      d="M0,45 Q25,15 50,30 T100,20 T150,35 T200,25"
                      fill="none"
                      stroke="#C80552"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Two Pill Buttons: Send & Receive -> Run Audit & Inspect Live */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="py-2.5 px-3 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-sm text-center"
                >
                  Run Audit
                </button>
                <Link
                  href="/monitor"
                  className="py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200/60 text-center"
                >
                  Inspect Live
                </Link>
              </div>
            </div>

            {/* Card 5: Compiled WASM & Authorized Signers (matching Amount of Credit) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Compiled WASM Size</span>
                </div>
                <p className="text-[11px] text-slate-400">Optimized Soroban release binary</p>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black text-slate-900">1,950 Bytes</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent-subtle">
                    +100% v22
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Authorized Signers</span>
                    <span className="text-[10px] text-slate-400">Stellar Testnet keypairs</span>
                  </div>
                  <a
                    href="https://stellar.expert/explorer/testnet/account/GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>

                {/* Avatars Row (matching the circular avatar row in reference image) */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                    G1
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                    S2
                  </div>
                  <div className="w-7 h-7 rounded-full bg-accent text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                    A3
                  </div>
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                    T4
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#A00441] text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm">
                    +1
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 ml-2">GBWS...DYPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= MODAL AUDIT STUDIO ================= */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowAuditModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent-subtle uppercase tracking-wider">
                  Live Security Engine
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Solace AI Smart Contract Auditor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Contract Input & Findings Grid inside Modal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContractInput
                codeSnippet={codeSnippet}
                setCodeSnippet={setCodeSnippet}
                isPostDeployment={isPostDeployment}
                setIsPostDeployment={setIsPostDeployment}
                loading={loading}
                error={error}
                onAudit={handleAudit}
              />

              {/* Audit Dashboard & Findings View */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-900">Findings & Verification</h4>
                    {report && (
                      <button
                        type="button"
                        onClick={handleAnchorOnChain}
                        disabled={anchoring}
                        className="px-3 py-1 bg-accent hover:bg-accent-hover disabled:bg-slate-300 text-white text-xs font-semibold rounded-full transition"
                      >
                        {anchoring ? 'Anchoring...' : 'Anchor on Soroban'}
                      </button>
                    )}
                  </div>

                  {!report && !loading && (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <p className="font-semibold text-slate-600">No active audit executed.</p>
                      <p className="mt-1">Load sample contract or paste Rust code, then click Audit Smart Contract.</p>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3" />
                      <p className="text-xs font-semibold text-slate-600">Analyzing Soroban security invariants...</p>
                    </div>
                  )}

                  {report && !loading && (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {/* Contract Hash and Copy */}
                      {contractHash && (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div className="truncate mr-2 font-mono text-[11px] text-slate-600">
                            Hash: {contractHash.slice(0, 20)}...
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyHash}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold whitespace-nowrap"
                          >
                            {copiedHash ? 'Copied' : 'Copy Hash'}
                          </button>
                        </div>
                      )}

                      {/* Anchor On-Chain Confirmation */}
                      {anchorResult && (
                        <div className="bg-accent-subtle border border-accent-subtle p-3 rounded-xl text-xs">
                          <span className="font-bold text-accent block mb-1">
                            Anchored on Stellar Testnet
                          </span>
                          <p className="text-slate-700 text-[11px] mb-2">
                            Transaction Hash: {anchorResult.transactionHash.slice(0, 16)}...
                          </p>
                          <a
                            href={anchorResult.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-accent underline"
                          >
                            View on Stellar Expert
                          </a>
                        </div>
                      )}

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Risk Score</span>
                          <div className={`text-2xl font-black mt-0.5 ${report.riskScore > 50 ? 'text-red-600' : 'text-accent'}`}>
                            {report.riskScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Security Status</span>
                          <div className={`text-sm font-bold mt-1.5 ${report.isSecure ? 'text-accent' : 'text-amber-600'}`}>
                            {report.isSecure ? 'Secure' : 'Issues Found'}
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">Executive Summary</span>
                        {report.summary}
                      </div>

                      {/* Vulnerabilities List */}
                      {report.vulnerabilities?.map((vuln, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-red-900">{vuln.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-red-700 text-[11px] mt-0.5">{vuln.description}</p>
                          <div className="mt-2 bg-white/80 p-2 rounded border border-red-100 font-mono text-[10px] text-slate-800">
                            Fix: {vuln.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAuditModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-full transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
