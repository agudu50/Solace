'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Hourglass,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
  X,
} from 'lucide-react';
import { Tile, TileHeader, Tray, hatch } from '../../components/dashboard/Overview';
// Live values are shown as plain numbers: CountUp restarts from 0 on every change.
import { EASE_OUT } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

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

/** ~7 days of ledgers at ~5s per ledger; used to scale the TTL gauge. */
const TTL_SCALE = 120960;
const LATENCY_SAMPLES = 24;

const PASSPHRASE = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
};

export default function MonitorPage() {
  const [contractId, setContractId] = useState<string>(DEFAULT_CONTRACT_ID);
  const [monitoring, setMonitoring] = useState<boolean>(true);
  // Cache is read after mount (not during render) to avoid a hydration mismatch.
  const [metrics, setMetrics] = useState<LiveTelemetry | null>(null);
  const [error, setError] = useState<string>('');
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [latencies, setLatencies] = useState<number[]>([]);
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
        const fullMetrics = { ...data, latencyMs: latency };
        setMetrics(fullMetrics);
        setLatencies((l) => [...l, latency].slice(-LATENCY_SAMPLES));
        setLastRefreshedAt(new Date().toLocaleTimeString());
        try {
          localStorage.setItem('solace-last-telemetry', JSON.stringify(fullMetrics));
        } catch (_) {}
      } else {
        setError(data.error || `Contract telemetry offline or unreachable on Stellar ${activeNet === 'mainnet' ? 'Mainnet' : 'Testnet'}.`);
        if (!isSilent && !metrics) setMetrics(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Solace backend server.');
      if (!isSilent && !metrics) setMetrics(null);
    } finally {
      if (!isSilent) setMonitoring(false);
    }
  };

  // Show the last cached snapshot immediately while the live fetch runs.
  useEffect(() => {
    try {
      const cached = localStorage.getItem('solace-last-telemetry');
      if (cached) setMetrics((m) => m ?? JSON.parse(cached));
    } catch (_) {}
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPolling, contractId, network]);

  const selectContract = (id: string) => {
    setContractId(id);
    setLatencies([]);
    fetchLiveTelemetry(id);
  };

  const handleStartMonitor = (e: React.FormEvent) => {
    e.preventDefault();
    setLatencies([]);
    fetchLiveTelemetry(contractId);
  };

  const handleCopyId = () => {
    if (!contractId) return;
    navigator.clipboard.writeText(contractId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const netLabel = network === 'mainnet' ? 'Mainnet' : 'Testnet';
  const ttl = metrics?.ttlRemainingLedgers ?? 0;
  const ttlTone = ttl > 20000 ? 'ok' : ttl > 5000 ? 'warn' : 'bad';
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : metrics?.latencyMs ?? 0;

  return (
    <div className="w-full min-h-screen bg-[#f2f2f0] dark:bg-[#0b0b0b] text-slate-800 dark:text-slate-100 pb-24 md:pb-10 overflow-x-hidden">
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <LiveDot on={isAutoPolling} />
              <span className="text-[11px] text-slate-500">
                {isAutoPolling ? 'Streaming every 5s' : 'Polling paused'}
                {lastRefreshedAt && ` · updated ${lastRefreshedAt}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-slate-900 dark:text-white">Contract monitor</h1>
            <p className="mt-1.5 text-sm text-slate-500 max-w-lg">
              Live health, storage-rent TTL and ledger state for deployed Soroban contracts on Stellar {netLabel}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAutoPolling(!isAutoPolling)}
              aria-pressed={isAutoPolling}
              className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                isAutoPolling
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoPolling ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isAutoPolling ? 'Live' : 'Paused'}
            </button>
            <button
              type="button"
              onClick={() => fetchLiveTelemetry(contractId)}
              disabled={monitoring}
              className={`${btn.secondary} h-10 rounded-xl`}
            >
              <RefreshCw className={`w-4 h-4 ${monitoring ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/audit" className={`${btn.primary} h-10 rounded-xl`}>
              <ShieldCheck className="w-4 h-4" />
              Audit Studio
            </Link>
          </div>
        </div>

        {/* Contract picker */}
        <Tray index={0}>
          <Tile flat className="p-3 sm:p-4 space-y-3">
            <form onSubmit={handleStartMonitor} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  aria-label="Soroban contract ID"
                  placeholder="Deployed Soroban contract ID, e.g. CBXV73FFYM…"
                  spellCheck={false}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-[#fafaf9] dark:bg-[#1a1a1a] pl-10 pr-3 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button type="submit" disabled={monitoring || !contractId.trim()} className={`${btn.primary} h-11 rounded-xl`}>
                <Activity className="w-4 h-4" />
                {monitoring ? 'Inspecting…' : 'Inspect contract'}
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 mr-1">Monitored</span>
              <ContractChip
                active={contractId === DEFAULT_CONTRACT_ID}
                onClick={() => selectContract(DEFAULT_CONTRACT_ID)}
                label="Solace core"
                sub={`${DEFAULT_CONTRACT_ID.slice(0, 4)}…${DEFAULT_CONTRACT_ID.slice(-4)}`}
                tone="accent"
              />
              {auditedContracts.map((item, idx) => (
                <ContractChip
                  key={item.hash || idx}
                  active={contractId === item.contractId && contractId !== DEFAULT_CONTRACT_ID}
                  onClick={() => selectContract(item.contractId)}
                  label={item.name}
                  sub={item.hash?.slice(0, 6)}
                  tone={item.isSecure ? 'ok' : 'bad'}
                />
              ))}
            </div>
          </Tile>
        </Tray>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div role="alert" className="flex items-center gap-3 p-3.5 rounded-[14px] border border-amber-500/30 bg-amber-500/10 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError('')} aria-label="Dismiss" className="grid place-items-center w-7 h-7 rounded-md hover:bg-amber-500/10 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton */}
        {monitoring && !metrics && (
          <Tray>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <Tile key={i} className="h-40">
                  <span />
                </Tile>
              ))}
            </div>
          </Tray>
        )}

        {metrics && (
          <>
            {/* KPI tray */}
            <Tray index={1}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                <KpiTile
                  icon={Wifi}
                  label="Network status"
                  value={<span className="capitalize">{metrics.status?.toLowerCase()}</span>}
                  foot={metrics.exists ? `Footprint verified on ${netLabel}` : 'No storage entry on network'}
                  pill={{ text: metrics.exists ? 'Online' : 'Not found', tone: metrics.exists ? 'ok' : 'warn' }}
                />
                <KpiTile
                  icon={Layers}
                  label={`${netLabel} ledger`}
                  value={<span className="font-mono">#{metrics.latestLedger.toLocaleString()}</span>}
                  foot={`Closed ${new Date(metrics.closeTime * 1000).toLocaleTimeString()}`}
                  pill={{ text: `Protocol ${metrics.protocolVersion}`, tone: 'neutral' }}
                />
                <KpiTile
                  icon={Hourglass}
                  label="Rent TTL"
                  value={ttl.toLocaleString()}
                  foot="ledgers remaining"
                  pill={{ text: ttlTone === 'ok' ? 'Secure' : ttlTone === 'warn' ? 'Extend soon' : 'Critical', tone: ttlTone }}
                />
                <KpiTile
                  icon={Clock}
                  label="RPC response"
                  value={
                    <>
                      {avgLatency}
                      <span className="text-lg text-slate-400 ml-1">ms</span>
                    </>
                  }
                  foot={`average of ${Math.max(1, latencies.length)} sample${latencies.length === 1 ? '' : 's'}`}
                  pill={{ text: metrics.rpcHealth || 'healthy', tone: 'ok' }}
                />
              </div>
            </Tray>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
              {/* TTL gauge */}
              <Tray index={2} className="lg:col-span-4">
                <Tile className="h-full flex flex-col">
                  <TileHeader title="Storage rent" action={<Pill tone={ttlTone}>{metrics.storageType}</Pill>} />
                  <div className="px-4 sm:px-5 pt-5 pb-5 flex-1 flex flex-col">
                    <TtlGauge remaining={ttl} />
                    <p className="mt-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{metrics.rentStatus}</p>
                    <dl className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/[0.07] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-slate-500">Expires at ledger</dt>
                        <dd className="mt-0.5 font-mono text-slate-900 dark:text-white">
                          {metrics.liveUntilLedgerSeq > 0 ? `#${metrics.liveUntilLedgerSeq.toLocaleString()}` : 'Unbounded'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">≈ time left</dt>
                        <dd className="mt-0.5 text-slate-900 dark:text-white">{ttlToTime(ttl)}</dd>
                      </div>
                    </dl>
                  </div>
                </Tile>
              </Tray>

              {/* Latency + parameters */}
              <Tray index={3} className="lg:col-span-8">
                <Tile flat className="h-full flex flex-col">
                  <TileHeader
                    title="Live telemetry"
                    action={
                      <a
                        href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/${metrics.contractId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-3 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Stellar Expert <ExternalLink className="w-3 h-3" />
                      </a>
                    }
                  />
                  <div className="px-4 sm:px-5 pt-5 pb-5 space-y-6">
                    <section>
                      <p className="mb-2.5 text-xs text-slate-500">RPC response time · last {LATENCY_SAMPLES} polls</p>
                      <LatencyBars samples={latencies} />
                    </section>
                    <section>
                      <p className="mb-1 text-xs text-slate-500 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        On-chain parameters
                      </p>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-xs">
                        <Param label="Contract address">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <span className="font-mono truncate max-w-[180px]" title={metrics.contractId}>
                              {metrics.contractId}
                            </span>
                            <button type="button" onClick={handleCopyId} aria-label="Copy contract address" className="text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer">
                              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </span>
                        </Param>
                        <Param label="Storage class">{metrics.storageType}</Param>
                        <Param label="Last modified ledger">
                          <span className="font-mono">
                            {metrics.lastModifiedLedgerSeq ? `#${metrics.lastModifiedLedgerSeq.toLocaleString()}` : 'Genesis / pre-deploy'}
                          </span>
                        </Param>
                        <Param label="RPC node health">
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {metrics.rpcHealth}
                          </span>
                        </Param>
                        <Param label="Network passphrase">
                          <span className="font-mono truncate max-w-[220px]">{PASSPHRASE[network]}</span>
                        </Param>
                        <Param label="Snapshot time">{metrics.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : lastRefreshedAt || '—'}</Param>
                      </dl>
                    </section>
                  </div>
                </Tile>
              </Tray>
            </div>
          </>
        )}

        {!metrics && !monitoring && (
          <Tray>
            <Tile className={`py-14 text-center ${hatch}`}>
              <span className="mx-auto grid place-items-center w-11 h-11 rounded-xl bg-accent-subtle text-accent">
                <Activity className="w-5 h-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">No contract monitored yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Enter a deployed Soroban contract ID or pick a monitored contract above to stream its TTL rent and ledger state.
              </p>
            </Tile>
          </Tray>
        )}

        <div className="flex justify-end">
          <Link href="/reports" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            Ledger reports <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

type Tone = 'neutral' | 'ok' | 'warn' | 'bad';

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const cls = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
    ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    bad: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }[tone];
  return <span className={`shrink-0 inline-flex items-center h-5 px-2 rounded-md text-[10px] font-medium whitespace-nowrap capitalize ${cls}`}>{children}</span>;
}

function LiveDot({ on }: { on: boolean }) {
  return (
    <span className="relative flex w-2 h-2" aria-hidden>
      {on && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 animate-ping-soft" />}
      <span className={`relative w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    </span>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  foot,
  pill,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  foot: string;
  pill: { text: string; tone: Tone };
}) {
  return (
    <Tile className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-slate-700 dark:text-slate-300">
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{label}</span>
      </div>
      <p className="mt-6 text-3xl sm:text-4xl font-medium tracking-tight tabular-nums text-slate-900 dark:text-white leading-none truncate">{value}</p>
      <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-white/[0.07] flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 truncate">{foot}</span>
        <Pill tone={pill.tone}>{pill.text}</Pill>
      </div>
    </Tile>
  );
}

function ContractChip({
  active,
  onClick,
  label,
  sub,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  tone: 'accent' | 'ok' | 'bad';
}) {
  const dot = { accent: 'bg-accent', ok: 'bg-emerald-500', bad: 'bg-red-500' }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs transition-colors cursor-pointer ${
        active
          ? 'border-accent bg-accent-subtle text-accent'
          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
      {sub && <span className="font-mono text-[10px] opacity-60">{sub}</span>}
    </button>
  );
}

function Param({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-200/70 dark:border-white/[0.07] min-w-0">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-900 dark:text-white text-right min-w-0 truncate">{children}</dd>
    </div>
  );
}

/** Half-donut showing remaining rent as a share of ~7 days of ledgers. */
function TtlGauge({ remaining }: { remaining: number }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, remaining / TTL_SCALE));
  const C = Math.PI * 80;
  const color = remaining > 20000 ? '#10b981' : remaining > 5000 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative mx-auto w-full max-w-[260px] [perspective:600px]">
      <motion.svg
        viewBox="0 0 200 112"
        className="w-full"
        aria-label={`${Math.round(pct * 100)}% of a 7-day rent window remaining`}
        role="img"
        initial={{ rotateX: reduce ? 0 : 35, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      >
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" strokeWidth="22" strokeLinecap="round" className="stroke-slate-100 dark:stroke-white/[0.06]" />
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          stroke={color}
          initial={{ strokeDasharray: `${reduce ? pct * C : 0} ${C * 2}` }}
          animate={{ strokeDasharray: `${pct * C} ${C * 2}` }}
          transition={{ duration: 1.1, delay: 0.2, ease: EASE_OUT }}
        />
      </motion.svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-3xl font-medium tabular-nums tracking-tight text-slate-900 dark:text-white leading-none">{Math.round(pct * 100)}%</p>
        <p className="mt-1 text-xs text-slate-500">of 7-day window</p>
      </div>
    </div>
  );
}

function LatencyBars({ samples }: { samples: number[] }) {
  const max = Math.max(200, ...samples);
  const padded = [...Array(Math.max(0, LATENCY_SAMPLES - samples.length)).fill(null), ...samples] as (number | null)[];
  return (
    <div>
      <div className={`flex items-end gap-1 h-24 rounded-xl px-2 pt-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.07] ${hatch}`} role="img" aria-label={`Latest RPC response times: ${samples.join(', ')} ms`}>
        {padded.map((v, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end">
            {v !== null && (
              <motion.div
                title={`${v} ms`}
                className={`w-full rounded-t-[4px] ${v > 1500 ? 'bg-red-500' : v > 700 ? 'bg-amber-400' : 'bg-accent'}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (v / max) * 100)}%` }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
        <span>older</span>
        <span>{samples.length ? `latest ${samples[samples.length - 1]} ms` : 'waiting for first poll'}</span>
      </div>
    </div>
  );
}

/** ~5 seconds per ledger on Stellar. */
function ttlToTime(ledgers: number) {
  const s = ledgers * 5;
  if (s <= 0) return 'Expired';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
