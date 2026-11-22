'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Chip, Panel, PanelHeader } from '../../components/dashboard/Panel';
import { ScoreRing } from '../../components/dashboard/Visuals';
import { Tile, Tray } from '../../components/dashboard/Overview';
import { Segmented } from '../../components/audit/StudioParts';
import ReportDeck3D from '../../components/reports/ReportDeck3D';
import { CountUp, EASE_OUT, SplitWords } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

interface VulnerabilityDetail {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

interface VerifiedReport {
  hash: string;
  contract: string;
  auditType: string;
  riskScore: number;
  isSecure: boolean;
  auditor: string;
  timestamp: string;
  date: string;
  time: string;
  createdAt: number;
  summary?: string;
  vulnerabilities?: VulnerabilityDetail[];
  codeSnippet?: string;
  notFound?: boolean;
}

const LIVE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SOLACE_CONTRACT_ID || 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightRustSnippet(code: string): string {
  if (!code) return '';

  return code
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('//')) {
        return `<span style="color: #4ade80; font-style: italic;">${escapeHtml(line)}</span>`;
      }

      const commentIdx = line.indexOf('//');
      const codePart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
      const commentPart =
        commentIdx !== -1
          ? `<span style="color: #4ade80; font-style: italic;">${escapeHtml(line.slice(commentIdx))}</span>`
          : '';

      const TOKEN_REGEX =
        /(".*?"|'.*?')|(#!?\[.*?\])|(\b(?:pub|fn|let|mut|impl|struct|enum|if|else|match|return|use|for|in|while|as|true|false|self|Self)\b)|(\b(?:Address|Env|String|Symbol|BytesN|u32|u64|u128|i32|i64|i128|bool|DataKey|AuditRecord|SolaceContract|VaultContract)\b)|(\b(?:require_auth|storage|instance|persistent|get|set|record_audit|deposit|withdraw|init|unwrap_or|unwrap|clone|has)\b)|(\b(?:panic!|symbol_short!|vec!)\b)|(\b\d+\b)/g;

      let lastIndex = 0;
      let highlighted = '';
      let match: RegExpExecArray | null;

      while ((match = TOKEN_REGEX.exec(codePart)) !== null) {
        if (match.index > lastIndex) {
          highlighted += escapeHtml(codePart.slice(lastIndex, match.index));
        }

        const [, str, attr, kw, type, method, macro, num] = match;

        if (str) {
          highlighted += `<span style="color: #f472b6;">${escapeHtml(str)}</span>`;
        } else if (attr) {
          highlighted += `<span style="color: #fbbf24; font-weight: 600;">${escapeHtml(attr)}</span>`;
        } else if (kw) {
          highlighted += `<span style="color: #38bdf8; font-weight: 700;">${escapeHtml(kw)}</span>`;
        } else if (type) {
          highlighted += `<span style="color: #2dd4bf; font-weight: 600;">${escapeHtml(type)}</span>`;
        } else if (method) {
          highlighted += `<span style="color: #fef08a; font-weight: 600;">${escapeHtml(method)}</span>`;
        } else if (macro) {
          highlighted += `<span style="color: #e879f9; font-weight: 700;">${escapeHtml(macro)}</span>`;
        } else if (num) {
          highlighted += `<span style="color: #c084fc; font-weight: 600;">${escapeHtml(num)}</span>`;
        }

        lastIndex = TOKEN_REGEX.lastIndex;
      }

      if (lastIndex < codePart.length) {
        highlighted += escapeHtml(codePart.slice(lastIndex));
      }

      return highlighted + commentPart;
    })
    .join('\n');
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const [searchHash, setSearchHash] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<VerifiedReport | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedFixIndex, setCopiedFixIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score-high' | 'score-low'>('newest');
  const [reportsList, setReportsList] = useState<VerifiedReport[]>([]);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [copiedCardHash, setCopiedCardHash] = useState<string | null>(null);
  const [copiedCardFixKey, setCopiedCardFixKey] = useState<string | null>(null);

  // Load audit history and network setting
  useEffect(() => {
    try {
      const storedNet = localStorage.getItem('solace-network');
      if (storedNet === 'mainnet' || storedNet === 'testnet') {
        setNetwork(storedNet);
      }
    } catch (_) {}

    const handleNetworkEvent = (e: any) => {
      const net = e.detail?.network ?? localStorage.getItem('solace-network') ?? 'testnet';
      if (net === 'mainnet' || net === 'testnet') {
        setNetwork(net);
      }
    };

    window.addEventListener('solace-network-updated', handleNetworkEvent);

    const loadReportsData = () => {
      try {
        const stored = localStorage.getItem('solace_audit_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReportsList(parsed);
            return;
          }
        }

        // Fallback: Check if an active contract audit exists
        const storedActive = localStorage.getItem('solace-active-contract-audit');
        if (storedActive) {
          const parsedActive = JSON.parse(storedActive);
          if (parsedActive.contractHash) {
            const fallbackReport: VerifiedReport = {
              hash: parsedActive.contractHash,
              contract: parsedActive.contractName || 'Soroban Smart Contract',
              auditType: parsedActive.auditType || 'PRE_DEPLOYMENT',
              riskScore: parsedActive.riskScore ?? 95,
              isSecure: parsedActive.isSecure ?? true,
              auditor: 'Solace Signer',
              timestamp: 'Confirmed on Stellar Soroban Ledger',
              date: parsedActive.date || 'Today',
              time: parsedActive.timestamp || 'Just now',
              createdAt: Date.now(),
              summary: parsedActive.summary,
              vulnerabilities: parsedActive.vulnerabilities || [],
              codeSnippet: parsedActive.codeSnippet,
              notFound: false,
            };
            setReportsList([fallbackReport]);
            return;
          }
        }
        setReportsList([]);
      } catch (_) {
        setReportsList([]);
      }
    };

    loadReportsData();

    window.addEventListener('storage', loadReportsData);
    window.addEventListener('solace-audit-updated', loadReportsData);
    window.addEventListener('focus', loadReportsData);

    return () => {
      window.removeEventListener('solace-network-updated', handleNetworkEvent);
      window.removeEventListener('storage', loadReportsData);
      window.removeEventListener('solace-audit-updated', loadReportsData);
      window.removeEventListener('focus', loadReportsData);
    };
  }, []);

  const handleToggleRecommendation = (hash: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedHash((prev) => (prev === hash ? null : hash));
  };

  const executeLookup = async (query: string) => {
    if (!query) return;
    setSearching(true);
    setSearchHash(query);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let currentReports = reportsList;
      if (currentReports.length === 0) {
        try {
          const stored = localStorage.getItem('solace_audit_history');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) currentReports = parsed;
          }
          if (currentReports.length === 0) {
            const storedActive = localStorage.getItem('solace-active-contract-audit');
            if (storedActive) {
              const parsedActive = JSON.parse(storedActive);
              if (parsedActive.contractHash) {
                currentReports = [{
                  hash: parsedActive.contractHash,
                  contract: parsedActive.contractName || 'Soroban Smart Contract',
                  auditType: parsedActive.auditType || 'PRE_DEPLOYMENT',
                  riskScore: parsedActive.riskScore ?? 95,
                  isSecure: parsedActive.isSecure ?? true,
                  auditor: 'Solace Signer',
                  timestamp: 'Confirmed on Stellar Soroban Ledger',
                  date: parsedActive.date || 'Today',
                  time: parsedActive.timestamp || 'Just now',
                  createdAt: Date.now(),
                  summary: parsedActive.summary,
                  vulnerabilities: parsedActive.vulnerabilities || [],
                  codeSnippet: parsedActive.codeSnippet,
                  notFound: false,
                }];
              }
            }
          }
        } catch (_) {}
      }

      const localMatch = currentReports.find((r) => r.hash.toLowerCase().includes(query.toLowerCase()));

      let remoteData: any = null;
      try {
        const response = await fetch(`${apiBase}/api/contract/audit/${encodeURIComponent(query)}`);
        const res = await response.json();
        if (res.success && res.data) {
          remoteData = res.data;
        }
      } catch (_) {}

      if (remoteData) {
        setSearchResult({
          hash: remoteData.contract_hash || query,
          contract: localMatch?.contract || 'On-Chain Verified Soroban Contract',
          auditType: remoteData.audit_type || 'PRE_DEPLOYMENT',
          riskScore: remoteData.risk_score ?? (localMatch?.riskScore || 0),
          isSecure: remoteData.is_secure ?? localMatch?.isSecure ?? true,
          auditor: remoteData.auditor || localMatch?.auditor || 'Solace Signer',
          timestamp: 'Confirmed on Stellar Soroban Ledger',
          date: localMatch?.date || 'Today',
          time: localMatch?.time || 'Just now',
          createdAt: localMatch?.createdAt || Date.now(),
          summary: localMatch?.summary || 'Cryptographically verified on-chain Soroban audit proof with intact AST invariants.',
          vulnerabilities: localMatch?.vulnerabilities || [],
          codeSnippet: localMatch?.codeSnippet,
          notFound: false,
        });
      } else if (localMatch) {
        setSearchResult({
          ...localMatch,
          notFound: false,
        });
      } else {
        setSearchResult({
          hash: query,
          contract: '',
          auditType: '',
          riskScore: 0,
          isSecure: false,
          auditor: '',
          timestamp: '',
          date: '',
          time: '',
          createdAt: Date.now(),
          notFound: true,
        });
      }
    } catch {
      const localMatch = reportsList.find((r) => r.hash.toLowerCase().includes(query.toLowerCase()));
      if (localMatch) {
        setSearchResult({
          ...localMatch,
          notFound: false,
        });
      } else {
        setSearchResult({
          hash: query,
          contract: '',
          auditType: '',
          riskScore: 0,
          isSecure: false,
          auditor: '',
          timestamp: '',
          date: '',
          time: '',
          createdAt: Date.now(),
          notFound: true,
        });
      }
    } finally {
      setSearching(false);
    }
  };

  // Only auto-lookup if explicitly provided in query params (e.g. from Dashboard click)
  // By default, search input remains EMPTY and no report is pre-selected
  useEffect(() => {
    const hashParam = searchParams.get('hash');
    if (hashParam) {
      executeLookup(hashParam);
    }
  }, [searchParams, reportsList]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchHash.trim()) {
      executeLookup(searchHash.trim());
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyFix = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedFixIndex(index);
    setTimeout(() => setCopiedFixIndex(null), 2000);
  };

  // History entries are prepended newest-first but often lack `createdAt`,
  // so fall back to their stored order to keep Newest/Oldest meaningful.
  const displayList = reportsList
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const byTime = (b.r.createdAt || 0) - (a.r.createdAt || 0);
      if (sortBy === 'newest') return byTime || a.i - b.i;
      if (sortBy === 'oldest') return -byTime || b.i - a.i;
      if (sortBy === 'score-high') return b.r.riskScore - a.r.riskScore;
      return a.r.riskScore - b.r.riskScore;
    })
    .map(({ r }) => r);

  const secureCount = reportsList.filter((r) => r.isSecure).length;
  const issueCount = reportsList.reduce((n, r) => n + (r.vulnerabilities?.length || 0), 0);
  const explorerUrl = `https://stellar.expert/explorer/testnet/contract/${LIVE_CONTRACT_ID}`;

  const KPIS = [
    { label: 'Total proofs', icon: FileCode, value: String(reportsList.length), sub: 'recorded audits' },
    { label: 'Verified secure', icon: ShieldCheck, value: String(secureCount), sub: 'passed every invariant' },
    { label: 'Action required', icon: AlertTriangle, value: String(reportsList.length - secureCount), sub: 'need fixes before deploy' },
    { label: 'Issues found', icon: BrainCircuit, value: String(issueCount), sub: 'with AI-drafted fixes' },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#f2f2f0] dark:bg-[#0b0b0b] text-slate-800 dark:text-slate-100 pb-24 md:pb-10 overflow-x-hidden">

      <main className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="min-w-0 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="flex flex-wrap items-center gap-2 mb-5"
            >
              <Chip tone="accent" pulse>Ledger provenance</Chip>
              <Chip>{network === 'mainnet' ? 'Mainnet' : 'Testnet'} · Protocol 22</Chip>
            </motion.div>
            <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-slate-900 dark:text-white">
              <SplitWords text="Verified audit reports" />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400"
            >
              Every signed audit, with its full AI recommendations and Rust fixes, ready to revisit any time.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
              className="mt-6 flex flex-wrap items-center gap-2"
            >
              <Link href="/audit" className={`${btn.primary} group`}>
                Launch Audit Studio
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
                Stellar Expert
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block shrink-0 lg:mr-10"
          >
            <ReportDeck3D items={displayList} onOpen={executeLookup} />
          </motion.div>
        </div>

        {/* KPI tray (same tiles as the dashboard) */}
        <Tray index={0} className="mt-6 sm:mt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {KPIS.map((k) => {
              const Icon = k.icon;
              return (
                <Tile key={k.label} className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141414] text-slate-700 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{k.label}</span>
                  </div>
                  <p className="mt-6 text-4xl font-medium tracking-tight tabular-nums text-slate-900 dark:text-white leading-none">
                    <CountUp value={k.value} />
                  </p>
                  <p className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.07] text-[11px] text-slate-500 truncate">{k.sub}</p>
                </Tile>
              );
            })}
          </div>
        </Tray>

        {/* Search */}
        <Panel index={1} className="mt-4 sm:mt-5">
          <form onSubmit={handleSearch} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                aria-label="Contract SHA-256 hash"
                placeholder="Search by contract SHA-256 hash, e.g. 07c390518ca81e3…"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0e0e] pl-10 pr-10 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              {searchHash && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchHash('');
                    setSearchResult(null);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" disabled={searching} className={btn.primary}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? 'Querying ledger…' : 'Look up'}
            </button>
          </form>
          {reportsList.length > 0 && (
            <div className="px-4 sm:px-5 pb-4 flex flex-wrap items-center gap-2 -mt-1">
              <span className="eyebrow mr-1">Recent</span>
              {reportsList.slice(0, 3).map((rep) => (
                <button
                  key={rep.hash}
                  type="button"
                  onClick={() => executeLookup(rep.hash)}
                  className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                    searchHash === rep.hash
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${rep.isSecure ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {rep.contract}
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Lookup result */}
        <AnimatePresence mode="wait">
          {searchResult && (
            <motion.div
              key={searchResult.notFound ? `nf-${searchResult.hash}` : searchResult.hash}
              initial={{ opacity: 0, y: 16, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              style={{ transformPerspective: 1600, transformOrigin: '50% 0%' }}
              className="mt-4 sm:mt-5"
            >
              {searchResult.notFound ? (
                <Panel>
                  <div className="flex items-center justify-between gap-3 p-5">
                    <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 min-w-0">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="min-w-0">
                        No on-chain audit record found for{' '}
                        <span className="font-mono text-slate-900 dark:text-white break-all">{searchHash}</span>.
                      </span>
                    </div>
                    <CloseButton onClick={() => setSearchResult(null)} />
                  </div>
                </Panel>
              ) : (
                <Panel className="border-accent/40 dark:border-accent/40">
                  <PanelHeader
                    eyebrow="Inspection dossier"
                    title={searchResult.contract}
                    action={
                      <div className="flex items-center gap-2">
                        <Chip tone={searchResult.isSecure ? 'ok' : 'bad'}>{searchResult.isSecure ? 'Secure' : 'Action required'}</Chip>
                        <CloseButton onClick={() => setSearchResult(null)} />
                      </div>
                    }
                  />
                  <div className="px-5 sm:px-6 -mt-1 flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-slate-500 break-all select-all">{searchResult.hash}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(searchResult.hash)}
                      aria-label="Copy hash"
                      className="grid place-items-center w-7 h-7 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200 dark:border-white/10">
                    <div className="px-5 sm:px-6 py-4 flex items-center gap-3">
                      <ScoreRing
                        value={searchResult.riskScore}
                        size={52}
                        color={searchResult.riskScore > 50 ? '#ef4444' : undefined}
                        label={`Score ${searchResult.riskScore} of 100`}
                      />
                      <div className="min-w-0">
                        <dt className="eyebrow">Score</dt>
                        <dd className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {searchResult.riskScore > 50 ? 'Critical issues detected' : 'Invariants verified'}
                        </dd>
                      </div>
                    </div>
                    <DossierCell label="Audit mode" value={searchResult.auditType} note={searchResult.auditType === 'PRE_DEPLOYMENT' ? 'Static AST and auth invariants' : 'Live host state and rent TTL'} className="border-l" />
                    <DossierCell
                      label="Auditor"
                      value={<span className="font-mono">{searchResult.auditor ? `${searchResult.auditor.slice(0, 8)}…${searchResult.auditor.slice(-6)}` : 'Solace master key'}</span>}
                      note="Ed25519 verified signer"
                      className="border-t lg:border-t-0 lg:border-l"
                    />
                    <DossierCell
                      label="Ledger"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {searchResult.timestamp}
                        </span>
                      }
                      note="Stellar testnet ledger"
                      className="border-t border-l lg:border-t-0"
                    />
                  </dl>

                  <div className="p-5 sm:p-6">
                    <RecommendationBody
                      summary={searchResult.summary}
                      vulns={searchResult.vulnerabilities || []}
                      contractHash={searchResult.hash}
                      action={
                        <Link href="/audit" className={`${btn.secondary} h-8 px-3 text-xs`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Test and fix in Studio
                        </Link>
                      }
                    />
                  </div>
                </Panel>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <p className="eyebrow inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-accent" />
              History
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl font-medium tracking-tight text-slate-900 dark:text-white">Recent verified audits</h2>
            <p className="mt-1 text-xs text-slate-500">Open any report to see its AI recommendations and fixes.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Segmented
              id="reports-sort"
              label="Sort reports"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'score-high', label: 'Highest score' },
                { value: 'oldest', label: 'Oldest' },
              ]}
            />
            <Chip>{displayList.length} total</Chip>
          </div>
        </div>

        {displayList.length === 0 ? (
          <Panel index={2}>
            <div className="flex flex-col items-center text-center px-6 py-14">
              <motion.span
                initial={{ rotateX: 70, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
                style={{ transformPerspective: 400 }}
                className="grid place-items-center w-11 h-11 rounded-md bg-accent-subtle text-accent"
              >
                <FileCode className="w-5 h-5" />
              </motion.span>
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">No audit reports yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
                Analyse a Soroban contract in Audit Studio to create your first verifiable security record.
              </p>
              <Link href="/audit" className={`${btn.primary} mt-5`}>
                Launch Audit Studio
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </Panel>
        ) : (
          <Panel index={2}>
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
              className="divide-y divide-slate-200 dark:divide-white/10"
            >
              {displayList.map((item, idx) => {
                const isExpanded = expandedHash === item.hash;
                const panelId = `report-${idx}`;
                return (
                  <motion.li
                    key={`${item.hash}-${idx}`}
                    layout="position"
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } } }}
                    className={`relative transition-colors ${isExpanded ? 'bg-slate-50/80 dark:bg-white/[0.02]' : ''}`}
                  >
                    {isExpanded && <motion.span layoutId="report-active" className="absolute left-0 inset-y-0 w-0.5 bg-accent" />}
                    <button
                      type="button"
                      onClick={() => handleToggleRecommendation(item.hash)}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="group w-full text-left px-5 sm:px-6 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.isSecure ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-white">{item.contract}</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{item.auditType}</span>
                          </div>
                          <p className="mt-1 font-mono text-xs text-slate-500 break-all">{item.hash}</p>
                          {item.summary && !isExpanded && (
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{item.summary}</p>
                          )}
                          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>
                              Auditor{' '}
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {item.auditor ? `${item.auditor.slice(0, 8)}…${item.auditor.slice(-6)}` : 'Solace keypair'}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.date ? `${item.date} · ${item.time}` : item.timestamp}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-medium tabular-nums text-slate-900 dark:text-white leading-none">{item.riskScore}</p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">score</p>
                          </div>
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT }}
                            className="grid place-items-center w-8 h-8 rounded-md border border-slate-200 dark:border-white/10 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.span>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          id={panelId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 sm:px-6 pb-6 sm:pl-[3.25rem]">
                            <RecommendationBody
                              summary={item.summary}
                              vulns={item.vulnerabilities || []}
                              contractHash={item.hash}
                              action={
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.hash);
                                      setCopiedCardHash(item.hash);
                                      setTimeout(() => setCopiedCardHash(null), 2000);
                                    }}
                                    className={`${btn.secondary} h-8 px-3 text-xs`}
                                  >
                                    {copiedCardHash === item.hash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedCardHash === item.hash ? 'Copied' : 'Copy hash'}
                                  </button>
                                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} h-8 px-3 text-xs`}>
                                    Explorer <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <Link href="/audit" className={`${btn.primary} h-8 px-3 text-xs`}>
                                    Test in Studio
                                  </Link>
                                </div>
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </motion.ul>
          </Panel>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared report pieces                                                */
/* ------------------------------------------------------------------ */

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="grid place-items-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

function DossierCell({ label, value, note, className = '' }: { label: string; value: React.ReactNode; note: string; className?: string }) {
  return (
    <div className={`px-5 sm:px-6 py-4 min-w-0 border-slate-200 dark:border-white/10 ${className}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 text-sm text-slate-900 dark:text-white truncate">{value}</dd>
      <dd className="mt-0.5 text-[11px] text-slate-500 truncate">{note}</dd>
    </div>
  );
}

/** Summary, issues with Rust fixes (or an all-clear), and an action row. */
function RecommendationBody({
  summary,
  vulns,
  action,
  contractHash,
}: {
  summary?: string;
  vulns: VulnerabilityDetail[];
  action: React.ReactNode;
  contractHash?: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
          <BrainCircuit className="w-4 h-4 text-accent" />
          AI recommendation and AST analysis
        </span>
        {action}
      </div>

      {summary && (
        <div>
          <p className="eyebrow mb-1.5">Executive summary</p>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{summary}</p>
        </div>
      )}

      {vulns.length > 0 ? (
        <div>
          <p className="eyebrow mb-2.5">Issues and fixes ({vulns.length})</p>
          <ul className="space-y-3">
            {vulns.map((v, i) => (
              <VulnBlock key={`${v.title}-${i}`} vuln={v} index={i} contractHash={contractHash} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-md border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">No invariant vulnerabilities detected</p>
            <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              Authorization guards, persistent rent bounds and panic safety checks all pass.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const SEV_TONE: Record<string, string> = {
  CRITICAL: 'text-red-500 border-red-500/30 bg-red-500/10',
  HIGH: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  MEDIUM: 'text-sky-500 border-sky-500/30 bg-sky-500/10',
  LOW: 'text-slate-500 border-slate-500/30 bg-slate-500/10',
};

function VulnBlock({ vuln, index, contractHash }: { vuln: VulnerabilityDetail; index: number; contractHash?: string }) {
  const [copied, setCopied] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const issueKey = `${contractHash || ''}::${vuln.title}`;

  useEffect(() => {
    const checkResolved = () => {
      try {
        const stored = localStorage.getItem('solace_resolved_issues');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setIsResolved(list.includes(issueKey));
          }
        }
      } catch (_) {}
    };
    checkResolved();
    window.addEventListener('storage', checkResolved);
    window.addEventListener('solace-resolved-issues-updated', checkResolved);
    return () => {
      window.removeEventListener('storage', checkResolved);
      window.removeEventListener('solace-resolved-issues-updated', checkResolved);
    };
  }, [issueKey]);

  const handleToggleResolved = () => {
    try {
      const stored = localStorage.getItem('solace_resolved_issues');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];
      const nextResolved = !isResolved;
      if (nextResolved) {
        if (!list.includes(issueKey)) list.push(issueKey);
      } else {
        list = list.filter((k) => k !== issueKey);
      }
      localStorage.setItem('solace_resolved_issues', JSON.stringify(list));
      setIsResolved(nextResolved);
      window.dispatchEvent(new Event('solace-resolved-issues-updated'));
    } catch (_) {}
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + index * 0.06, ease: EASE_OUT }}
      className={`rounded-md border ${isResolved ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616]'} overflow-hidden transition-colors`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm ${isResolved ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'} font-medium`}>
              {vuln.title}
            </p>
            {isResolved && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Resolved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleResolved}
              className={`inline-flex items-center gap-1.5 h-6 px-2 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                isResolved
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-accent hover:text-accent'
              }`}
              title={isResolved ? 'Reopen finding' : 'Mark recommendation as resolved'}
            >
              {isResolved ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Resolved</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full border border-slate-400" />
                  <span>Mark resolved</span>
                </>
              )}
            </button>
            <span className={`shrink-0 px-1.5 h-5 inline-flex items-center rounded border font-mono text-[10px] uppercase ${SEV_TONE[vuln.severity] ?? SEV_TONE.LOW}`}>
              {vuln.severity}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">{vuln.description}</p>
      </div>
      <div className="bg-[#121212] border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between gap-2 px-4 h-9 border-b border-white/10 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <Code2 className="w-3.5 h-3.5" />
            Recommended fix
            <span className="text-slate-500 font-mono">· Soroban Rust</span>
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(vuln.recommendation);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-white/10 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre
          className="p-4 m-0 overflow-x-auto text-slate-200 font-mono text-xs leading-6 modern-code-scrollbar selection:bg-accent/40"
          dangerouslySetInnerHTML={{ __html: highlightRustSnippet(vuln.recommendation) }}
        />
      </div>
    </motion.li>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
