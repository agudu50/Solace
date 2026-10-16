'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  Shield,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Calendar,
  Layers,
  Copy,
  Check,
  BrainCircuit,
  SlidersHorizontal,
  FileCode,
  X,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import WalletGate from '../../components/auth/WalletGate';

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

const LIVE_CONTRACT_ID = 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

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
          isSecure: remoteData.is_secure ?? (localMatch?.isSecure || true),
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

  const displayList = [...reportsList];

  // Sort list: Always new contracts at top by default
  displayList.sort((a, b) => {
    if (sortBy === 'newest') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    if (sortBy === 'oldest') {
      return (a.createdAt || 0) - (b.createdAt || 0);
    }
    if (sortBy === 'score-high') {
      return b.riskScore - a.riskScore;
    }
    if (sortBy === 'score-low') {
      return a.riskScore - b.riskScore;
    }
    return 0;
  });

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-8 overflow-x-hidden">
      <WalletGate
        pageTitle="Verified Reports"
        description="Connect your authorized Stellar / Soroban auditor wallet to inspect verified smart contract audit proofs and cryptographic ledger seals."
      >
        <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Top Header Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#111726] rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 transition-colors">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block" />
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Ledger Provenance &amp; AI History</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  {network === 'mainnet' ? 'Stellar Soroban Mainnet (Production)' : 'Stellar Soroban v22 Protocol'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Verified On-Chain Reports &amp; AI Recommendations
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-xl leading-relaxed">
                Review cryptographically signed smart contract audit reports and recall the complete AI security recommendations and code fixes at any time.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap shrink-0">
              <a
                href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/${LIVE_CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 rounded-full bg-slate-100/90 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold"
              >
                <span>Stellar Expert ({network === 'mainnet' ? 'Mainnet' : 'Testnet'})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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

        {/* Quick Hash Buttons from Real Inscriptions */}
        {reportsList.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Recent Inscriptions:</span>
            {reportsList.slice(0, 3).map((rep) => (
              <button
                key={rep.hash}
                type="button"
                onClick={() => executeLookup(rep.hash)}
                className={`text-xs font-mono px-3 py-1 rounded-full border shadow-sm transition font-bold ${
                  searchHash === rep.hash
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                #{rep.contract}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar - Starts completely EMPTY by default */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                placeholder="Search by contract SHA-256 hash (e.g. 07c390518ca81e3...)..."
                className="w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-accent shadow-sm transition"
              />
              {searchHash && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchHash('');
                    setSearchResult(null);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl text-sm shadow-md shadow-accent/25 transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? 'Querying Ledger...' : 'Lookup Report'}</span>
            </button>
          </div>
        </form>

        {/* Selected / Search Result Card (Only rendered when user searches or clicks a contract) */}
        {searchResult && (
          <div className="mb-8 transition-all duration-300">
            {searchResult.notFound ? (
              <div className="p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl text-sm text-slate-700 dark:text-slate-300 font-medium shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    No on-chain audit record found for hash <span className="font-mono text-slate-900 dark:text-white font-bold break-all">{searchHash}</span>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchResult(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-7 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm transition-colors">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 uppercase tracking-wider inline-block">
                        Active Inspection Dossier
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {searchResult.auditType}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">
                      {searchResult.contract}
                    </h3>

                    {/* Cryptographic SHA-256 Hash Display with Copy */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 max-w-full">
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">SHA256:</span>
                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                          {searchResult.hash}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(searchResult.hash)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1.5 shrink-0"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xs ${
                      searchResult.isSecure
                        ? 'bg-accent-subtle text-accent border border-accent/20'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                    }`}>
                      {searchResult.isSecure ? '• SECURE' : '• ACTION REQUIRED'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchResult(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                      title="Close recommendation view"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Core Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 py-5 border-b border-slate-100 dark:border-slate-800">
                  {/* Security Score */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Security Score
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`font-black text-2xl sm:text-3xl ${searchResult.riskScore > 50 ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
                        {searchResult.riskScore}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                      {searchResult.riskScore > 50 ? 'Critical Vulnerabilities Detected' : 'Verified Secure AST Invariants'}
                    </span>
                  </div>

                  {/* Audit Mode */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Audit Mode
                    </span>
                    <p className="text-slate-900 dark:text-white font-bold text-base mt-1">
                      {searchResult.auditType}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                      {searchResult.auditType === 'PRE_DEPLOYMENT' ? 'Static AST & Auth Invariants' : 'Live Host State & Rent TTL'}
                    </span>
                  </div>

                  {/* Auditor Keypair */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Auditor Keypair
                    </span>
                    <p className="text-slate-900 dark:text-slate-100 font-mono font-bold text-xs mt-1 truncate" title={searchResult.auditor}>
                      {searchResult.auditor ? `${searchResult.auditor.slice(0, 8)}...${searchResult.auditor.slice(-6)}` : 'Solace Master Key'}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                      Ed25519 Verified Signer
                    </span>
                  </div>

                  {/* Ledger Verification */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Ledger Verification
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                      <p className="text-slate-900 dark:text-white font-bold text-xs">
                        {searchResult.timestamp}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                      Stellar Testnet Ledger
                    </span>
                  </div>
                </div>

                {/* AI Security Recommendation Section */}
                <div className="pt-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/25 flex items-center justify-center shrink-0 shadow-xs">
                        <BrainCircuit className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                          AI Security Recommendation &amp; AST Analysis
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Dual Flash AST Invariant Verification Engine
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/audit"
                      className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/25 flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Test &amp; Fix in Audit Studio</span>
                    </Link>
                  </div>

                  {/* Executive Summary */}
                  {searchResult.summary && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1.5 text-xs sm:text-sm">
                        Executive Summary
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-xs sm:text-[13px]">
                        {searchResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Vulnerabilities & Recommended Fixes with Syntax Highlighting */}
                  {searchResult.vulnerabilities && searchResult.vulnerabilities.length > 0 ? (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block uppercase tracking-wider">
                        Detected Invariant Flaws &amp; Actionable Recommendations ({searchResult.vulnerabilities.length})
                      </span>
                      {searchResult.vulnerabilities.map((vuln, i) => (
                        <div
                          key={i}
                          className="p-4 sm:p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/60 text-xs"
                        >
                          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                            <span className="font-bold text-red-950 dark:text-red-200 text-sm sm:text-base">
                              {vuln.title}
                            </span>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white shrink-0 shadow-xs">
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-red-950 dark:text-red-200 text-xs sm:text-[13px] leading-relaxed mb-4 font-medium">
                            {vuln.description}
                          </p>

                          {/* Recommended AI Fix with syntax highlighting */}
                          <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden flex flex-col">
                            {/* Editor Top Bar */}
                            <div className="flex justify-between items-center text-xs text-slate-300 px-3.5 py-2.5 border-b border-slate-800 font-mono bg-slate-900/80 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Code2 className="w-3.5 h-3.5 text-accent" />
                                <span className="font-bold text-slate-100">Recommended AI Fix</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400 text-[11px]">Soroban Rust (no_std)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyFix(vuln.recommendation, i)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-700 transition flex items-center gap-1.5"
                              >
                                {copiedFixIndex === i ? (
                                  <Check className="w-3 h-3 text-accent" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedFixIndex === i ? 'Copied' : 'Copy Fix'}</span>
                              </button>
                            </div>

                            {/* Code Container with Rust Highlighting */}
                            <pre
                              className="p-4 m-0 overflow-x-auto text-slate-200 font-mono text-xs leading-6 selection:bg-accent/40"
                              dangerouslySetInnerHTML={{
                                __html: highlightRustSnippet(vuln.recommendation),
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3.5 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm block">
                          Zero Invariant Vulnerabilities Detected
                        </span>
                        <p className="text-emerald-900 dark:text-emerald-300 font-medium mt-0.5 leading-relaxed">
                          All authorization guards, persistent rent bounds, and panic safety assertions are fully satisfied on Stellar Soroban.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Ledger Records List Header with Sorting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recent Verified Audits &amp; History
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Click any report below to inspect its detailed AI recommendations
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-1 rounded-full shadow-xs text-xs">
              <span className="text-[11px] font-bold text-slate-500 pl-2 hidden sm:inline">Sort:</span>
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  sortBy === 'newest'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Newest First
              </button>
              <button
                type="button"
                onClick={() => setSortBy('score-high')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  sortBy === 'score-high'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Highest Risk
              </button>
              <button
                type="button"
                onClick={() => setSortBy('oldest')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  sortBy === 'oldest'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Oldest First
              </button>
            </div>

            <span className="text-xs font-bold text-accent px-3 py-1 bg-accent-subtle rounded-full border border-accent/20">
              {displayList.length} Total Proofs
            </span>
          </div>
        </div>

        {/* Contract History List */}
        {displayList.length === 0 ? (
          <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center mb-4 shadow-xs">
              <FileCode className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              No Audit Reports Inscribed Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
              Upload and analyze your Soroban smart contracts in Audit Studio to generate permanent cryptographic AST security proofs.
            </p>
            <Link
              href="/audit"
              className="px-5 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Audit Studio</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayList.map((item, idx) => {
              const isExpanded = expandedHash === item.hash;
              const resolvedVulns = item.vulnerabilities || [];
              const resolvedSummary = item.summary || '';

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-[#111726] border p-5 rounded-3xl shadow-sm transition-all duration-200 group ${
                    isExpanded
                      ? 'border-accent ring-2 ring-accent/20 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-accent/40 dark:hover:border-accent/40 hover:shadow-md'
                  }`}
                >
                {/* Title & Status Bar (Clickable to toggle) */}
                <div
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2.5 cursor-pointer select-none"
                  onClick={() => handleToggleRecommendation(item.hash)}
                  title="Click to toggle recommendation dropdown"
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-accent transition">
                      {item.contract}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                      {item.auditType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full w-fit ${
                      item.isSecure
                        ? 'bg-accent-subtle text-accent border border-accent/20'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                    }`}>
                      {item.isSecure ? '• SECURE' : '• ACTION REQUIRED'}
                    </span>
                    <span className="text-xs font-mono text-slate-900 dark:text-white font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.riskScore}/100
                    </span>
                  </div>
                </div>

                {/* Hash: Fully Visible on Mobile (break-all) */}
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium mb-2.5 break-all leading-relaxed">
                  <span className="text-slate-400 dark:text-slate-500 font-normal">Hash: </span>
                  {item.hash}
                </p>

                {/* Summary: Fully Visible, No Clamp Cuts */}
                {resolvedSummary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3.5 leading-relaxed break-words">
                    {resolvedSummary}
                  </p>
                )}

                {/* Footer Bar: Auditor, Checked Date/Time, Dropdown Toggle Button */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium pt-3.5 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      Auditor:{' '}
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {item.auditor ? `${item.auditor.slice(0, 8)}...${item.auditor.slice(-6)}` : 'Solace Keypair'}
                      </span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>
                        Checked:{' '}
                        {item.date
                          ? `${item.date} • ${item.time}`
                          : item.timestamp?.includes('Testnet') && network === 'mainnet'
                          ? 'Anchored on Mainnet Ledger'
                          : item.timestamp}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleRecommendation(item.hash, e)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                        isExpanded
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ring-2 ring-accent/30'
                          : 'bg-accent hover:bg-accent-hover text-white shadow-accent/25 hover:scale-105'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Recommendation' : 'View Recommendation'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Inline Expandable Dropdown Menu: Shows everything directly on this card without scrolling to the top */}
                {isExpanded && (
                  <div
                    className="mt-4 pt-5 border-t border-slate-200/90 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Dropdown Header & AST Badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-accent-subtle text-accent border border-accent/25 flex items-center justify-center shrink-0 shadow-xs">
                          <BrainCircuit className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            AI Security Recommendation &amp; AST Analysis
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            Dual Flash AST Invariant Verification Engine
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href="/audit"
                          className="px-3 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-[11px] font-bold transition shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Test in Audit Studio</span>
                        </Link>
                      </div>
                    </div>

                    {/* Executive Summary in Dropdown */}
                    {resolvedSummary && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block mb-1 text-xs">
                          Executive Summary
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-xs sm:text-[13px]">
                          {resolvedSummary}
                        </p>
                      </div>
                    )}

                    {/* Detected Invariant Flaws with Syntax-Highlighted Rust Fixes */}
                    {resolvedVulns.length > 0 ? (
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white block uppercase tracking-wider">
                          Detected Invariant Flaws &amp; Actionable Recommendations ({resolvedVulns.length})
                        </span>
                        {resolvedVulns.map((vuln: any, vIdx: number) => {
                          const fixKey = `${item.hash}-${vIdx}`;
                          const isCopied = copiedCardFixKey === fixKey;
                          return (
                            <div
                              key={vIdx}
                              className="p-3.5 sm:p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/60 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                                <span className="font-bold text-red-950 dark:text-red-200 text-xs sm:text-sm">
                                  {vuln.title}
                                </span>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0 shadow-xs">
                                  {vuln.severity}
                                </span>
                              </div>
                              <p className="text-red-950 dark:text-red-200 text-xs sm:text-[13px] leading-relaxed mb-3 font-medium">
                                {vuln.description}
                              </p>

                              {/* Recommended AI Fix with syntax highlighting */}
                              <div className="rounded-xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center text-[11px] text-slate-300 px-3 py-2 border-b border-slate-800 font-mono bg-slate-900/80 flex-wrap gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <Code2 className="w-3 h-3 text-accent" />
                                    <span className="font-bold text-slate-100">Recommended AI Fix</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-400 text-[10px]">Soroban Rust (no_std)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(vuln.recommendation);
                                      setCopiedCardFixKey(fixKey);
                                      setTimeout(() => setCopiedCardFixKey(null), 2000);
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-slate-700 transition flex items-center gap-1"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                                    <span>{isCopied ? 'Copied' : 'Copy Fix'}</span>
                                  </button>
                                </div>

                                <pre
                                  className="p-3 m-0 overflow-x-auto text-slate-200 font-mono text-xs leading-5 selection:bg-accent/40"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightRustSnippet(vuln.recommendation),
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3 text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm block">
                            Zero Invariant Vulnerabilities Detected
                          </span>
                          <p className="text-emerald-900 dark:text-emerald-300 font-medium mt-0.5 leading-relaxed text-xs">
                            All authorization guards, persistent rent bounds, and panic safety assertions are fully satisfied on Stellar Soroban.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Dropdown Quick Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.hash);
                            setCopiedCardHash(item.hash);
                            setTimeout(() => setCopiedCardHash(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          {copiedCardHash === item.hash ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCardHash === item.hash ? 'Hash Copied' : 'Copy Hash'}</span>
                        </button>

                        <a
                          href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/${LIVE_CONTRACT_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>Stellar Expert ({network === 'mainnet' ? 'Mainnet' : 'Testnet'})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedHash(null)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        Close Recommendation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </main>
      </WalletGate>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1700px] mx-auto px-4 py-12 text-center text-slate-400">
          Loading verified reports...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
