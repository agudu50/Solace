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
  Layers,
  Copy,
  Sparkles,
} from 'lucide-react';

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
  summary?: string;
  vulnerabilities?: VulnerabilityDetail[];
  codeSnippet?: string;
  notFound?: boolean;
}

const LIVE_CONTRACT_ID = 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

function ReportsContent() {
  const searchParams = useSearchParams();
  const [searchHash, setSearchHash] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<VerifiedReport | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [reportsList, setReportsList] = useState<VerifiedReport[]>([]);

  const mockReports: VerifiedReport[] = [
    {
      hash: '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a',
      contract: 'Solace Vault Protocol (Missing require_auth)',
      auditType: 'PRE_DEPLOYMENT',
      riskScore: 85,
      isSecure: false,
      auditor: 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
      timestamp: 'Anchored on Testnet Ledger',
      summary:
        'Gemini AI AST inspection detected 2 critical vulnerability vectors in VaultContract: unauthenticated withdrawal access enabling unauthorized token drains, and unverified administrative re-initialization allowing hostile contract takeovers.',
      vulnerabilities: [
        {
          title: 'Missing Authorization Guard in withdraw()',
          severity: 'CRITICAL',
          description:
            'The withdraw() function modifies storage balances without invoking to.require_auth(). Any testnet caller can specify an arbitrary recipient and withdraw funds from another user’s balance without signing.',
          recommendation:
            'pub fn withdraw(env: Env, to: Address, amount: i128) {\n    to.require_auth(); // Enforce caller identity\n    let current: i128 = env.storage().instance().get(&DataKey::Balance(to.clone())).unwrap_or(0);\n    if current < amount {\n        panic!("insufficient funds");\n    }\n    env.storage().instance().set(&DataKey::Balance(to), &(current - amount));\n}',
        },
        {
          title: 'Unprotected Administrative Re-initialization in init()',
          severity: 'HIGH',
          description:
            'The init() function does not verify whether DataKey::Admin has already been written. An attacker can re-invoke init() at any time to overwrite the administrator address.',
          recommendation:
            'pub fn init(env: Env, admin: Address) {\n    if env.storage().instance().has(&DataKey::Admin) {\n        panic!("contract already initialized");\n    }\n    env.storage().instance().set(&DataKey::Admin, &admin);\n}',
        },
      ],
      codeSnippet: `// Solace Sample Soroban Smart Contract\n#![no_std]\nuse soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};\n\n#[contracttype]\npub enum DataKey {\n    Admin,\n    Balance(Address),\n}\n\n#[contract]\npub struct VaultContract;\n\n#[contractimpl]\nimpl VaultContract {\n    pub fn init(env: Env, admin: Address) {\n        env.storage().instance().set(&DataKey::Admin, &admin);\n    }\n\n    pub fn deposit(env: Env, from: Address, amount: i128) {\n        from.require_auth();\n        let current: i128 = env.storage().instance().get(&DataKey::Balance(from.clone())).unwrap_or(0);\n        env.storage().instance().set(&DataKey::Balance(from), &(current + amount));\n    }\n\n    pub fn withdraw(env: Env, to: Address, amount: i128) {\n        let current: i128 = env.storage().instance().get(&DataKey::Balance(to.clone())).unwrap_or(0);\n        if current < amount { panic!("insufficient funds"); }\n        env.storage().instance().set(&DataKey::Balance(to), &(current - amount));\n    }\n}`,
    },
    {
      hash: '8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4',
      contract: 'Solace Core Security Contract (contract/src/lib.rs)',
      auditType: 'PRE_DEPLOYMENT',
      riskScore: 35,
      isSecure: true,
      auditor: 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
      timestamp: 'Verified on Testnet Ledger',
      summary:
        'Autonomous Gemini AI AST inspection verified require_auth() invariants and persistent rent protection. Zero unhandled host panics and verified ledger provenance.',
      vulnerabilities: [],
    },
    {
      hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef',
      contract: 'Vault Lending Pool Protocol',
      auditType: 'PRE_DEPLOYMENT',
      riskScore: 12,
      isSecure: true,
      auditor: 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
      timestamp: 'Verified on Testnet Ledger',
      summary:
        'Formal AST verification confirms checked arithmetic with zero unhandled panics. Multi-sig quorum enforced for liquidation parameters.',
      vulnerabilities: [],
    },
    {
      hash: '3f7a18b2c90e45d120a4b7c89f01e23a456789b0c1d2e3f4a5b6c7d8e9f0a1b2',
      contract: 'AMM Liquidity Pool Protocol',
      auditType: 'POST_DEPLOYMENT',
      riskScore: 95,
      isSecure: false,
      auditor: 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
      timestamp: 'Anchored on Testnet Ledger',
      summary:
        'Storage rent TTL underflow risk: instance storage TTL is expiring in less than 2,000 ledgers. Immediate TTL bump required to prevent state eviction.',
      vulnerabilities: [
        {
          title: 'Imminent Persistent Storage Rent Eviction',
          severity: 'CRITICAL',
          description:
            'Contract storage TTL has dropped below safety threshold (<2,000 ledgers remaining). Storage entry will be archived by the Stellar network if not bumped immediately.',
          recommendation:
            '// Extend storage rent TTL on Stellar Testnet:\nenv.storage().instance().extend_ttl(50000, 100000);',
        },
      ],
    },
  ];

  // Load audit history from localStorage + mock data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('solace_audit_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          mockReports.forEach((m) => {
            if (!merged.some((p) => p.hash.toLowerCase() === m.hash.toLowerCase())) {
              merged.push(m);
            }
          });
          setReportsList(merged);
          return;
        }
      }
    } catch (_) {}
    setReportsList(mockReports);
  }, []);

  const executeLookup = async (query: string) => {
    if (!query) return;
    setSearching(true);
    setSearchHash(query);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/audit/verify/${encodeURIComponent(query)}`);
      const res = await response.json();

      const localMatch =
        reportsList.find((r) => r.hash.toLowerCase().includes(query.toLowerCase())) ||
        mockReports.find((r) => r.hash.toLowerCase().includes(query.toLowerCase()));

      if (res.success && res.data) {
        setSearchResult({
          hash: res.data.contract_hash,
          contract: localMatch?.contract || 'On-Chain Verified Soroban Contract',
          auditType: res.data.audit_type,
          riskScore: res.data.risk_score,
          isSecure: res.data.is_secure,
          auditor: res.data.auditor,
          timestamp: 'Confirmed on Stellar Soroban Testnet',
          summary: localMatch?.summary || 'Cryptographically verified on-chain Soroban audit proof with intact AST invariants.',
          vulnerabilities: localMatch?.vulnerabilities || [],
          notFound: false,
        });
      } else {
        setSearchResult(
          localMatch || {
            hash: query,
            contract: '',
            auditType: '',
            riskScore: 0,
            isSecure: false,
            auditor: '',
            timestamp: '',
            notFound: true,
          }
        );
      }
    } catch {
      const localMatch =
        reportsList.find((r) => r.hash.toLowerCase().includes(query.toLowerCase())) ||
        mockReports.find((r) => r.hash.toLowerCase().includes(query.toLowerCase()));
      setSearchResult(
        localMatch || {
          hash: query,
          contract: '',
          auditType: '',
          riskScore: 0,
          isSecure: false,
          auditor: '',
          timestamp: '',
          notFound: true,
        }
      );
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const hashParam = searchParams.get('hash');
    if (hashParam) {
      executeLookup(hashParam);
    } else if (reportsList.length > 0 && !searchResult) {
      // Default to displaying first report with full recommendations
      setSearchResult(reportsList[0]);
      setSearchHash(reportsList[0].hash);
    }
  }, [searchParams, reportsList]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(searchHash.trim());
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const displayList = reportsList.length > 0 ? reportsList : mockReports;

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-8 overflow-x-hidden">
      <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Top Header Card (Enhanced Hero) */}
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
                  Stellar Soroban v22 Protocol
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
                href={`https://stellar.expert/explorer/testnet/contract/${LIVE_CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 rounded-full bg-slate-100/90 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold"
              >
                <span>Stellar Expert</span>
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

        {/* Quick Hash Sample Buttons */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Try sample hashes:</span>
          <button
            type="button"
            onClick={() => executeLookup('07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a')}
            className={`text-xs font-mono px-3 py-1 rounded-full border shadow-sm transition font-bold ${
              searchHash.includes('07c390')
                ? 'bg-accent text-white border-accent'
                : 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-accent border-slate-200/80 dark:border-slate-800'
            }`}
          >
            # Vault Audit (Has AI Recommendations)
          </button>
          <button
            type="button"
            onClick={() => executeLookup('8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4')}
            className={`text-xs font-mono px-3 py-1 rounded-full border shadow-sm transition font-bold ${
              searchHash.includes('8e5c8e')
                ? 'bg-accent text-white border-accent'
                : 'bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            # Solace Core Contract
          </button>
        </div>

        {/* Search Bar (Accent Brand Action, No Black Button) */}
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

        {/* Selected / Search Result with Complete AI Recommendation History */}
        {searchResult && (
          <div className="mb-8">
            {searchResult.notFound ? (
              <div className="p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl text-sm text-slate-700 dark:text-slate-300 font-medium shadow-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  No on-chain audit record found for hash <span className="font-mono text-slate-900 dark:text-white font-bold">{searchHash}</span>.
                </span>
              </div>
            ) : (
              <div className="p-5 sm:p-7 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm transition-colors">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20 uppercase tracking-wider inline-block mb-1.5">
                      Live Ledger Record &amp; AI Audit History
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">
                      {searchResult.contract}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 break-all">
                        Hash: {searchResult.hash}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(searchResult.hash)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                      searchResult.isSecure
                        ? 'bg-accent-subtle text-accent border border-accent/20'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                    }`}>
                      {searchResult.isSecure ? '• SECURE' : '• ACTION REQUIRED'}
                    </span>
                  </div>
                </div>

                {/* Core Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Security Score</span>
                    <p className={`font-black text-xl sm:text-2xl mt-0.5 ${searchResult.riskScore > 50 ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
                      {searchResult.riskScore} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Audit Mode</span>
                    <p className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">{searchResult.auditType}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Auditor Keypair</span>
                    <p className="text-slate-900 dark:text-slate-100 font-mono font-bold text-xs mt-0.5 truncate" title={searchResult.auditor}>
                      {searchResult.auditor ? `${searchResult.auditor.slice(0, 8)}...${searchResult.auditor.slice(-6)}` : 'On-Chain Solace Key'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Ledger Verification</span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold text-xs mt-0.5">{searchResult.timestamp}</p>
                  </div>
                </div>

                {/* AI Recommendation History Section */}
                <div className="pt-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Security Recommendation &amp; AST Analysis
                      </h4>
                    </div>

                    <Link
                      href="/audit"
                      className="px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Test &amp; Fix in Audit Studio</span>
                    </Link>
                  </div>

                  {/* Executive Summary */}
                  {searchResult.summary && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Executive Summary</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {searchResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Vulnerabilities & Recommended Fixes */}
                  {searchResult.vulnerabilities && searchResult.vulnerabilities.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Detected Invariant Flaws &amp; Actionable Recommendations ({searchResult.vulnerabilities.length})
                      </span>
                      {searchResult.vulnerabilities.map((vuln, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                            <span className="font-bold text-red-950 dark:text-red-200 text-sm">
                              {vuln.title}
                            </span>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-red-950 dark:text-red-200 text-xs leading-relaxed mb-3 font-medium">
                            {vuln.description}
                          </p>

                          {/* Recommended Fix */}
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200/60 dark:border-red-900/60 text-xs overflow-hidden">
                            <span className="font-bold text-accent block mb-1">Recommended AI Fix:</span>
                            <pre className="text-slate-800 dark:text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all overflow-x-auto p-2 bg-slate-50 dark:bg-slate-950/70 rounded-lg border border-slate-200/60 dark:border-slate-800">
                              {vuln.recommendation}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3 text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                          Zero Invariant Vulnerabilities Detected
                        </span>
                        <p className="text-emerald-900 dark:text-emerald-300 font-medium mt-0.5">
                          All authorization guards, persistent rent bounds, and panic safety assertions are fully satisfied.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Ledger Records List */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Verified Audits &amp; History</h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Click any report below to inspect its detailed AI recommendations</p>
          </div>
          <span className="text-xs font-bold text-accent">{displayList.length} Total Proofs</span>
        </div>

        <div className="space-y-3">
          {displayList.map((item, idx) => {
            const isSelected = searchResult && searchResult.hash.toLowerCase() === item.hash.toLowerCase();
            return (
              <div
                key={idx}
                onClick={() => {
                  executeLookup(item.hash);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`bg-white dark:bg-[#111726] border p-5 rounded-3xl shadow-sm cursor-pointer transition group ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-accent/40 dark:hover:border-accent/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
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
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-black">
                      {item.riskScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 font-medium mb-2 truncate">
                  Hash: {item.hash}
                </p>

                {item.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 mb-3">
                    {item.summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <span>
                    Auditor:{' '}
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.auditor ? `${item.auditor.slice(0, 8)}...${item.auditor.slice(-6)}` : 'Solace Keypair'}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.timestamp}</span>
                    </span>
                    <span className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1">
                      <span>View Recommendation</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
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
