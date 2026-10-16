'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  Search,
  ExternalLink,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Wifi,
  Zap,
} from 'lucide-react';
import WalletGate from '../../components/auth/WalletGate';

interface LiveTelemetry {
  contractId: string;
  exists: boolean;
  status: string;
  latestLedger: number;
  protocolVersion: number;
  closeTime: number;
  rpcHealth: string;
  liveUntilLedgerSeq: number;
  lastModifiedLedgerSeq: number | null;
  ttlRemainingLedgers: number;
  rentStatus: string;
  storageType: string;
  network: string;
  timestamp: string;
  latencyMs?: number;
}

const DEFAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MonitorPage() {
  const [contractId, setContractId] = useState<string>(DEFAULT_CONTRACT_ID);
  const [monitoring, setMonitoring] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<LiveTelemetry | null>(null);
  const [error, setError] = useState<string>('');
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [auditedContracts, setAuditedContracts] = useState<any[]>([]);

  const fetchLiveTelemetry = async (targetId: string, isSilent = false, activeNet = network) => {
    if (!targetId.trim()) return;
    if (!isSilent) setMonitoring(true);
    setError('');

    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE_URL}/api/contract/telemetry/${encodeURIComponent(targetId.trim())}?network=${activeNet}`);
      const data = await res.json();
      const latency = Date.now() - startTime;

      if (data.success) {
        setMetrics({
          ...data,
          latencyMs: latency,
        });
        setLastRefreshedAt(new Date().toLocaleTimeString());
      } else {
        setError(data.error || `Contract telemetry offline or unreachable on Stellar ${activeNet === 'mainnet' ? 'Mainnet' : 'Testnet'}.`);
        if (!isSilent) setMetrics(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Solace backend server.');
      if (!isSilent) setMetrics(null);
    } finally {
      if (!isSilent) setMonitoring(false);
    }
  };

  // Synchronize audited contracts from local storage across pages
  useEffect(() => {
    const loadAuditedContracts = () => {
      try {
        const histStr = localStorage.getItem('solace_audit_history');
        const activeStr = localStorage.getItem('solace-active-contract-audit');
        const list: any[] = [];
        if (activeStr) {
          const act = JSON.parse(activeStr);
          if (act.contractName && act.contractHash) {
            list.push({
              name: act.contractName,
              hash: act.contractHash,
              contractId: act.anchorResult?.contractId || DEFAULT_CONTRACT_ID,
              riskScore: act.riskScore,
              isSecure: act.isSecure,
              isCurrent: true,
            });
          }
        }
        if (histStr) {
          const parsed = JSON.parse(histStr);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (!list.some((l) => l.hash === item.hash)) {
                list.push({
                  name: item.contract,
                  hash: item.hash,
                  contractId: item.anchorResult?.contractId || DEFAULT_CONTRACT_ID,
                  riskScore: item.riskScore,
                  isSecure: item.isSecure,
                  isCurrent: false,
                });
              }
            });
          }
        }
        setAuditedContracts(list);
      } catch (_) {}
    };

    loadAuditedContracts();
    window.addEventListener('solace-audit-updated', loadAuditedContracts);
    window.addEventListener('storage', loadAuditedContracts);
    window.addEventListener('focus', loadAuditedContracts);

    return () => {
      window.removeEventListener('solace-audit-updated', loadAuditedContracts);
      window.removeEventListener('storage', loadAuditedContracts);
      window.removeEventListener('focus', loadAuditedContracts);
    };
  }, []);

  // Initial fetch and network listener
  useEffect(() => {
    let currentNet: 'testnet' | 'mainnet' = 'testnet';
    try {
      const storedNet = localStorage.getItem('solace-network');
      if (storedNet === 'mainnet' || storedNet === 'testnet') {
        currentNet = storedNet;
        setNetwork(storedNet);
      }
    } catch (_) {}

    fetchLiveTelemetry(DEFAULT_CONTRACT_ID, false, currentNet);

    const handleNetworkEvent = (e: any) => {
      const net = e.detail?.network ?? localStorage.getItem('solace-network') ?? 'testnet';
      if (net === 'mainnet' || net === 'testnet') {
        setNetwork(net);
        fetchLiveTelemetry(contractId, false, net);
      }
    };

    window.addEventListener('solace-network-updated', handleNetworkEvent);
    return () => window.removeEventListener('solace-network-updated', handleNetworkEvent);
  }, []);

  // Live Auto-Polling Interval (real-time stream every 5s)
  useEffect(() => {
    if (!isAutoPolling || !contractId.trim()) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(() => {
      fetchLiveTelemetry(contractId.trim(), true, network);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isAutoPolling, contractId, network]);

  const handleStartMonitor = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLiveTelemetry(contractId);
  };

  const handleCopyId = () => {
    if (!contractId) return;
    navigator.clipboard.writeText(contractId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-8 overflow-x-hidden">
      <WalletGate
        pageTitle="Live Contract Monitor"
        description="Connect your authorized Stellar / Soroban auditor wallet to stream real-time TTL rent telemetry and invariant checks for live Soroban contracts."
      >
        <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#111726] rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 transition-colors">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block" />
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  <span>Live Post-Deployment Telemetry</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  Stellar Soroban v22 Protocol
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Live Contract Monitor
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-xl leading-relaxed">
                Real-time health monitoring, storage TTL tracking, and post-deployment security checks for live Soroban contracts.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap shrink-0">
              <Link
                href="/reports"
                className="text-xs px-4 py-2 rounded-full bg-slate-100/90 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold"
              >
                <span>Ledger Reports</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/audit"
                className="text-xs px-5 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/25 transition flex items-center gap-2 whitespace-nowrap font-bold hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Audit Studio</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Stream Bar & Quick Sample Contract Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Monitored instances:</span>
            <button
              type="button"
              onClick={() => {
                setContractId(DEFAULT_CONTRACT_ID);
                fetchLiveTelemetry(DEFAULT_CONTRACT_ID);
              }}
              className={`text-xs font-mono px-3 py-1 rounded-full border shadow-sm transition font-bold ${
                contractId === DEFAULT_CONTRACT_ID
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-accent border-slate-200/80 dark:border-slate-800'
              }`}
            >
              # Solace Core (CAC2TV...NPN2)
            </button>
            {auditedContracts.map((item, idx) => (
              <button
                key={item.hash || idx}
                type="button"
                onClick={() => {
                  setContractId(item.contractId);
                  fetchLiveTelemetry(item.contractId);
                }}
                className={`text-xs px-3 py-1 rounded-full border shadow-sm transition font-bold flex items-center gap-1.5 ${
                  contractId === item.contractId && contractId !== DEFAULT_CONTRACT_ID
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800'
                }`}
                title={`Monitor ${item.name} (${item.hash})`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>{item.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({item.hash.slice(0, 8)}...)</span>
              </button>
            ))}
          </div>

          {/* Real-Time Polling Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAutoPolling(!isAutoPolling)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 border shadow-xs ${
                isAutoPolling
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoPolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isAutoPolling ? 'Live Polling (5s Stream)' : 'Polling Paused'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchLiveTelemetry(contractId)}
              disabled={monitoring}
              className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${monitoring ? 'animate-spin text-accent' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Monitor Search Bar */}
        <form onSubmit={handleStartMonitor} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="Enter Deployed Soroban Contract ID (e.g. CBXV73FFYM...)..."
                className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-accent shadow-sm transition"
              />
            </div>
            <button
              type="submit"
              disabled={monitoring || !contractId.trim()}
              className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl text-sm shadow-md shadow-accent/25 transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Activity className="w-4 h-4" />
              <span>{monitoring ? 'Inspecting Live Contract...' : 'Inspect Live Contract'}</span>
            </button>
          </div>
        </form>

        {/* Error notification if contract not found */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-bold underline text-amber-900 dark:text-amber-100 hover:text-amber-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-Time Live Monitor Dashboard */}
        {metrics && (
          <div className="space-y-6 transition-all duration-300">
            {/* Top 3 Live Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Network Status Card */}
              <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm transition-colors relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Network Status
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span>{metrics.latencyMs ? `${metrics.latencyMs}ms` : 'Fast'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${metrics.exists ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {metrics.status}
                  </p>
                </div>

                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1.5 block">
                  {metrics.exists ? `Contract footprint verified on Stellar ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}` : 'No active storage entry on network'}
                </span>
              </div>

              {/* Live Storage Rent TTL Card */}
              <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm transition-colors relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Live Storage Rent TTL
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    metrics.ttlRemainingLedgers > 20000
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : metrics.ttlRemainingLedgers > 5000
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  }`}>
                    {metrics.ttlRemainingLedgers > 20000 ? 'SECURE' : metrics.ttlRemainingLedgers > 5000 ? 'WARNING' : 'CRITICAL'}
                  </span>
                </div>

                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {metrics.ttlRemainingLedgers.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ledgers remaining</span>
                </p>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 mb-1.5">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max((metrics.ttlRemainingLedgers / 120960) * 100, 10), 100)}%` }}
                  />
                </div>

                <span className="text-xs text-accent font-bold block truncate">
                  {metrics.rentStatus}
                </span>
              </div>

              {/* Current Ledger Sequence Card */}
              <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm transition-colors relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Current {network === 'mainnet' ? 'Mainnet' : 'Testnet'} Ledger
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Protocol v{metrics.protocolVersion}
                  </span>
                </div>

                <p className="text-xl sm:text-2xl font-black text-accent mt-1 font-mono">
                  #{metrics.latestLedger.toLocaleString()}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Closed: {new Date(metrics.closeTime * 1000).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Live On-Chain Parameters Table */}
            <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-accent" />
                    <span>Real-Time Ledger Storage Telemetry</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Direct on-chain parameters queried from Stellar Soroban RPC node
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    Last update: {lastRefreshedAt || 'Live'}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/${metrics.contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <span>Stellar Expert ({network === 'mainnet' ? 'Mainnet' : 'Testnet'})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Target Contract Address</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-900 dark:text-white font-bold text-xs truncate max-w-[200px]" title={metrics.contractId}>
                      {metrics.contractId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                      title="Copy Contract Address"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Storage Class Footprint</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{metrics.storageType}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Expiration Ledger Boundary</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {metrics.liveUntilLedgerSeq > 0 ? `#${metrics.liveUntilLedgerSeq.toLocaleString()}` : 'Unbounded'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Last Modified Ledger Sequence</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {metrics.lastModifiedLedgerSeq ? `#${metrics.lastModifiedLedgerSeq.toLocaleString()}` : 'Genesis / Pre-deploy'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">RPC Node Health</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>{metrics.rpcHealth}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold text-xs">Network Passphrase</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate max-w-[200px]">
                    Test SDF Network ; September 2015
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!metrics && !monitoring && (
          <div className="p-12 text-center bg-white dark:bg-[#111726] border border-dashed border-slate-200/80 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto mb-3">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-base">No live contract monitored yet.</p>
            <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
              Provide a deployed Stellar Soroban contract ID or click the sample instance above to inspect real-time TTL rent, access controls, and invariants.
            </p>
          </div>
        )}
      </main>
      </WalletGate>
    </div>
  );
}
