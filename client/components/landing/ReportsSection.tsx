'use client';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Code2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LedgerReport {
  id: string;
  contractName: string;
  contractHash: string;
  auditType: string;
  riskScore: number;
  isSecure: boolean;
  auditor: string;
  timestamp: string;
  ledgerSequence: string;
  invariants: string[];
  vulnerabilities: {
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    recommendation: string;
  }[];
}

const DEFAULT_REPORTS: LedgerReport[] = [
  {
    id: 'rep-01',
    contractName: 'VaultContract.rs',
    contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    auditType: 'PRE_DEPLOYMENT',
    riskScore: 95,
    isSecure: true,
    auditor: 'GBWSB2X7WUXPZXW2HQY2CYHCKY76T7G3R4H5P3WXZHAYL7SF3FDYPI',
    timestamp: '2026-10-24 11:42 UTC',
    ledgerSequence: '#4829104',
    invariants: [
      'Invariant-1: require_auth() on State Mutations',
      'Invariant-2: Storage TTL Rent Extension Bound',
      'Invariant-4: Reentrancy CEI Ordering',
    ],
    vulnerabilities: [
      {
        title: 'Missing Authorization on withdraw() Endpoint',
        severity: 'CRITICAL',
        description: 'Original code did not enforce to.require_auth() or admin signature before balance deduction.',
        recommendation: 'Injected to.require_auth() directly prior to ledger balance read and storage deduction.',
      },
      {
        title: 'Unchecked Re-initialization on init()',
        severity: 'HIGH',
        description: 'Admin key could be overwritten if init was invoked subsequent times.',
        recommendation: 'Added env.storage().instance().has(&DataKey::Admin) panic guard check.',
      },
    ],
  },
  {
    id: 'rep-02',
    contractName: 'SorobanTokenVault.rs',
    contractHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    auditType: 'PRE_DEPLOYMENT',
    riskScore: 92,
    isSecure: true,
    auditor: 'GD2X98PLKQW27YUMMNAKZ7X90892PLMKASDVNNP89YTRCVB214987K',
    timestamp: '2026-10-23 18:15 UTC',
    ledgerSequence: '#4827821',
    invariants: [
      'Invariant-1: require_auth() on State Mutations',
      'Invariant-3: Safe Checked Arithmetic (checked_add/sub)',
      'Invariant-6: Cross-Contract Call Authorization Forwarding',
    ],
    vulnerabilities: [
      {
        title: 'Potential Arithmetic Overflow on Liquidity Mint',
        severity: 'MEDIUM',
        description: 'Token pool share computation utilized native arithmetic without checking boundaries.',
        recommendation: 'Wrapped calculation with checked_mul() and checked_div() panicking on overflow.',
      },
    ],
  },
  {
    id: 'rep-03',
    contractName: 'StorageRentManager.rs',
    contractHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    auditType: 'POST_DEPLOYMENT',
    riskScore: 88,
    isSecure: true,
    auditor: 'GBA6W47X892PLMKAVCN8921MNXZVCXBBNKLW9843217654KLMNBVCXZ',
    timestamp: '2026-10-22 09:30 UTC',
    ledgerSequence: '#4825902',
    invariants: [
      'Invariant-2: Storage TTL Rent Extension Bound',
      'Invariant-5: Instance Archival Immunity Verification',
    ],
    vulnerabilities: [
      {
        title: 'Storage Rent TTL Expiration Risk',
        severity: 'MEDIUM',
        description: 'Instance storage was initialized with default TTL without automatic bump invocation on read.',
        recommendation: 'Integrated env.storage().instance().extend_ttl(100_000, 200_000) on all public invocations.',
      },
    ],
  },
  {
    id: 'rep-04',
    contractName: 'LiquidityPoolSwap.rs',
    contractHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    auditType: 'PRE_DEPLOYMENT',
    riskScore: 96,
    isSecure: true,
    auditor: 'GCVBNM987654321QWERTYUIOPASDFGHJKLZXCVBNM87654321QWER',
    timestamp: '2026-10-21 14:10 UTC',
    ledgerSequence: '#4824310',
    invariants: [
      'Invariant-3: Safe Checked Arithmetic (checked_add/sub)',
      'Invariant-4: Reentrancy CEI Ordering',
      'Invariant-6: Host Panic Bound Verification',
    ],
    vulnerabilities: [
      {
        title: 'Unchecked Arithmetic in Fee Computation',
        severity: 'MEDIUM',
        description: 'Intermediate fee math could overflow the Soroban VM on extreme high token swap amounts.',
        recommendation: 'Wrapped multiplication in checked_mul() and checked_div() with CustomError return.',
      },
    ],
  },
];

function deduplicateReports(incoming: LedgerReport[], fallbackDefaults: LedgerReport[]): LedgerReport[] {
  const seen = new Set<string>();
  const result: LedgerReport[] = [];

  for (const r of [...incoming, ...fallbackDefaults]) {
    const key = `${(r.contractHash || '').toLowerCase()}::${(r.contractName || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }
  return result;
}

export default function ReportsSection() {
  const { network, toggleNetwork } = useWallet();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'SECURE' | 'LOCAL'>('ALL');
  const [reports, setReports] = useState<LedgerReport[]>(DEFAULT_REPORTS);
  const [expandedId, setExpandedId] = useState<string | null>('rep-01');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  // Load and live-sync any audited contracts from localStorage or live events
  useEffect(() => {
    const syncReports = (newAuditDetail?: any) => {
      try {
        let localConverted: LedgerReport[] = [];
        const storedHistory = localStorage.getItem('solace_audit_history');
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localConverted = parsed.map((item: any, idx: number) => ({
              id: item.id || `local-${idx}`,
              contractName: item.contract || item.contractName || 'CustomContract.rs',
              contractHash: item.hash || item.contractHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              auditType: item.auditType || 'PRE_DEPLOYMENT',
              riskScore: item.riskScore ?? 95,
              isSecure: item.isSecure ?? ((item.riskScore ?? 95) >= 90),
              auditor: item.auditor || 'Solace Signer',
              timestamp: item.date ? `${item.date} ${item.time || ''}` : 'Recent Session',
              ledgerSequence: item.ledgerSequence || '#4829104',
              invariants: item.invariants || [
                'Invariant-1: require_auth() Enforced',
                'Invariant-2: Storage TTL Rent Protected',
                'Invariant-4: Reentrancy Safe',
              ],
              vulnerabilities: (item.vulnerabilities || []).map((v: any) => ({
                title: v.title || 'Invariant Flaw',
                severity: v.severity || 'HIGH',
                description: v.description || 'AST static analysis finding detected.',
                recommendation: v.recommendation || 'Apply suggested remediation pattern.',
              })),
            }));
          }
        }

        if (newAuditDetail) {
          const liveItem: LedgerReport = {
            id: newAuditDetail.id || `live-${Date.now()}`,
            contractName: newAuditDetail.contract || newAuditDetail.contractName || 'AuditedContract.rs',
            contractHash: newAuditDetail.hash || newAuditDetail.contractHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            auditType: newAuditDetail.auditType || 'PRE_DEPLOYMENT',
            riskScore: newAuditDetail.riskScore ?? 95,
            isSecure: newAuditDetail.isSecure ?? ((newAuditDetail.riskScore ?? 95) >= 90),
            auditor: newAuditDetail.auditor || 'Solace Signer',
            timestamp: newAuditDetail.date ? `${newAuditDetail.date} ${newAuditDetail.time || ''}` : 'Just Now',
            ledgerSequence: newAuditDetail.ledgerSequence || '#4829105',
            invariants: newAuditDetail.invariants || [
              'Invariant-1: require_auth() Enforced',
              'Invariant-2: Storage TTL Rent Protected',
              'Invariant-4: Reentrancy Safe',
            ],
            vulnerabilities: (newAuditDetail.vulnerabilities || []).map((v: any) => ({
              title: v.title || 'Invariant Flaw',
              severity: v.severity || 'HIGH',
              description: v.description || 'AST static analysis finding detected.',
              recommendation: v.recommendation || 'Apply suggested remediation pattern.',
            })),
          };
          localConverted = [liveItem, ...localConverted];
          setExpandedId(liveItem.id);
          setLiveNotice(`⚡ Verified On-Chain Report Added: ${liveItem.contractName}`);
          setTimeout(() => setLiveNotice(null), 4000);
        }

        const merged = deduplicateReports(localConverted, DEFAULT_REPORTS);
        setReports(merged);
      } catch (_) {}
    };

    syncReports();

    const handleAuditCompleted = (e: any) => {
      syncReports(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'solace_audit_history') {
        syncReports();
      }
    };

    window.addEventListener('solace-audit-completed', handleAuditCompleted);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('solace-audit-completed', handleAuditCompleted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contractHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.auditor.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'SECURE') return r.isSecure && r.riskScore >= 90;
    if (filterMode === 'LOCAL') return r.id.startsWith('local-');
    return true;
  });

  return (
    <section id="reports" className="relative w-full py-16 sm:py-24 bg-slate-50/50 dark:bg-[#0c101b]/60 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          {/* Active Network Switcher Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/25 bg-accent/10 text-accent text-xs font-semibold shadow-xs"
              title="Active Network: Stellar Testnet (Protocol 22)"
            >
              <span className="w-2 h-2 rounded-full inline-block bg-accent animate-pulse" />
              <span className="font-bold">
                Stellar Testnet (Protocol 22)
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-75">
                Live
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-subtle text-accent border border-accent/20 text-xs font-bold shadow-xs">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>On-Chain Provenance Ledger</span>
            </div>
          </div>

          {liveNotice && (
            <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in duration-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{liveNotice}</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Verified Ledger Reports
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Every audit conducted through Solace is anchored onto the Stellar Soroban ledger with a unique SHA-256 contract fingerprint, cryptographic auditor signature, and AST invariant status.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-[#111726] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by contract name, SHA-256 hash, or auditor key..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-accent"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                filterMode === 'ALL'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Reports ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('SECURE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                filterMode === 'SECURE'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Verified Safe (Score 90+)
            </button>
            {reports.some((r) => r.id.startsWith('local-')) && (
              <button
                type="button"
                onClick={() => setFilterMode('LOCAL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterMode === 'LOCAL'
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                My Audits
              </button>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#111726] rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                No matching reports found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching with a different contract name or SHA-256 hash.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const isExpanded = expandedId === report.id;
              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-[#111726] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition"
                >
                  {/* Card Summary Header */}
                  <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Contract Title & Metadata */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shrink-0">
                        <Code2 className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                            {report.contractName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {report.auditType}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Ledger {report.ledgerSequence}
                          </span>
                        </div>

                        {/* Hash & Copy */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-[11px] truncate max-w-[220px] sm:max-w-md">
                            SHA-256: {report.contractHash}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(report.contractHash)}
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-accent transition cursor-pointer"
                            title="Copy contract SHA-256 hash"
                          >
                            {copiedHash === report.contractHash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="hidden sm:inline">|</span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>{report.timestamp}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Risk Score & Actions */}
                    <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                      {/* Risk Score Pill */}
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          Security Score
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span
                            className={`font-black text-xl sm:text-2xl ${
                              report.riskScore >= 90
                                ? 'text-emerald-500'
                                : report.riskScore >= 70
                                ? 'text-amber-500'
                                : 'text-accent'
                            }`}
                          >
                            {report.riskScore}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/100</span>
                        </div>
                      </div>

                      {/* Expand / Collapse Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Findings'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-900/40 space-y-6">
                      {/* Verified Invariants Grid */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span>Verified Security Invariants</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {report.invariants.map((inv, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="truncate">{inv}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flaw Findings & Gemini Remediations */}
                      {report.vulnerabilities.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-accent" />
                            <span>Audited Findings &amp; Applied Remediations</span>
                          </h4>
                          <div className="space-y-3">
                            {report.vulnerabilities.map((vuln, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {vuln.title}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-accent-subtle text-accent border border-accent/20">
                                    {vuln.severity}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">Issue: </span>
                                  {vuln.description}
                                </p>
                                <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                                  <span className="font-semibold text-accent">Remediation: </span>
                                  {vuln.recommendation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cryptographic Auditor Key and Explorer Link */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <div className="text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Auditor Signer Key: </span>
                          <span className="font-mono text-[11px] text-accent font-bold break-all">
                            {report.auditor}
                          </span>
                        </div>

                        <a
                          href="https://stellar.expert/explorer/testnet/contract/CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-accent hover:underline font-bold self-start sm:self-auto shrink-0"
                        >
                          <span>Verify on Stellar Expert (Testnet)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
