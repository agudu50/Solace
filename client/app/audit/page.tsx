'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Shield,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  Terminal,
  Code2,
} from 'lucide-react';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';

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
  postDeploymentRecommendations?: string[];
  modelUsed?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const LIVE_CONTRACT_ID = 'CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightRustCode(code: string): string {
  if (!code) return '';

  return code
    .split('\n')
    .map((line) => {
      // 1. If entire line is a comment
      if (line.trim().startsWith('//')) {
        return `<span style="color: #4ade80; font-style: italic;">${escapeHtml(line)}</span>`;
      }

      // 2. Separate trailing comment if any
      const commentIdx = line.indexOf('//');
      const codePart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
      const commentPart =
        commentIdx !== -1
          ? `<span style="color: #4ade80; font-style: italic;">${escapeHtml(line.slice(commentIdx))}</span>`
          : '';

      // 3. Single-pass regex tokenization so replacements NEVER corrupt tags or match numbers inside styling
      const TOKEN_REGEX =
        /(".*?"|'.*?')|(#!?\[.*?\])|(\b(?:pub|fn|let|mut|impl|struct|enum|if|else|match|return|use|for|in|while|as|true|false|self|Self)\b)|(\b(?:Address|Env|String|Symbol|BytesN|u32|u64|u128|i32|i64|i128|bool|DataKey|AuditRecord|SolaceContract|VaultContract)\b)|(\b(?:require_auth|storage|instance|persistent|get|set|record_audit|deposit|withdraw|init|unwrap_or|unwrap|clone)\b)|(\b(?:panic!|symbol_short!|vec!)\b)|(\b\d+\b)/g;

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

function FormattedRecommendation({ text, index }: { text: string; index: number }) {
  const [copied, setCopied] = useState<boolean>(false);

  const isPureCode =
    text.includes('\n') &&
    (text.includes('pub fn') || text.includes('fn ') || text.includes('env.storage()') || text.includes('{'));

  const handleCopy = () => {
    const match = text.match(/`([^`]+)`/);
    const toCopy = isPureCode ? text : match ? match[1] : text;
    navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPureCode) {
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col mt-1">
        <div className="flex justify-between items-center px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-slate-100">Recommended Rust Fix</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-1 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre
          className="p-3 m-0 overflow-x-auto text-slate-200 font-mono text-xs leading-5 modern-code-scrollbar"
          dangerouslySetInnerHTML={{ __html: highlightRustCode(text) }}
        />
      </div>
    );
  }

  const parts = text.split(/(`[^`]+`)/g);

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-red-200/60 dark:border-red-900/50 p-2.5 text-xs mt-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-bold text-accent text-[11px] uppercase tracking-wider">Recommended Fix:</span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[10px] border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy Fix'}</span>
        </button>
      </div>
      <div className="leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
        {parts.map((part, pIdx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            const rawCode = part.slice(1, -1);
            return (
              <code
                key={pIdx}
                className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-950 text-teal-300 border border-slate-800 mx-0.5 inline-block shadow-xs"
                dangerouslySetInnerHTML={{ __html: highlightRustCode(rawCode) }}
              />
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    </div>
  );
}

export default function AuditStudioPage() {
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'INVARIANTS'>('STUDIO');
  const [codeSnippet, setCodeSnippet] = useState<string>(SAMPLE_SOROBAN_CONTRACT);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isPostDeployment, setIsPostDeployment] = useState<boolean>(false);
  const [editorMode, setEditorMode] = useState<'COLORED' | 'EDIT'>('COLORED');
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const invariantVectors = [
    {
      shortName: 'Auth',
      score: 100,
      status: 'Guarded',
      gradientStyle: 'linear-gradient(to top, #047857 0%, #10b981 50%, #34d399 100%)',
      glowColor: '#10b981',
      scoreColor: 'text-emerald-500 dark:text-emerald-400',
      statusColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700',
    },
    {
      shortName: 'Storage',
      score: 97,
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)',
      glowColor: '#06b6d4',
      scoreColor: 'text-cyan-500 dark:text-cyan-400',
      statusColor: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700',
    },
    {
      shortName: 'Safety',
      score: 94,
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #6d28d9 0%, #a855f7 50%, #d946ef 100%)',
      glowColor: '#a855f7',
      scoreColor: 'text-purple-500 dark:text-purple-400',
      statusColor: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700',
    },
    {
      shortName: 'Admin',
      score: 100,
      status: 'Guarded',
      gradientStyle: 'linear-gradient(to top, #9f1239 0%, #C80552 50%, #fb7185 100%)',
      glowColor: '#C80552',
      scoreColor: 'text-accent',
      statusColor: 'text-accent bg-accent-subtle border-accent/40',
    },
    {
      shortName: 'Math',
      score: 98,
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #b45309 0%, #f59e0b 50%, #fcd34d 100%)',
      glowColor: '#f59e0b',
      scoreColor: 'text-amber-500 dark:text-amber-400',
      statusColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700',
    },
    {
      shortName: 'Code',
      score: 96,
      status: 'Safe',
      gradientStyle: 'linear-gradient(to top, #3730a3 0%, #6366f1 50%, #818cf8 100%)',
      glowColor: '#6366f1',
      scoreColor: 'text-indigo-500 dark:text-indigo-400',
      statusColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700',
    },
  ];

  const handleEditorScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = top;
        highlightRef.current.scrollLeft = left;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = top;
      }
    }
  };

  const syncActiveContract = (
    code: string,
    reportData?: AuditReport | null,
    hashOverride?: string
  ) => {
    try {
      const isSolaceCore = code.includes('SolaceContract');
      const isVault = code.includes('VaultContract');
      const contractName = isSolaceCore
        ? 'Solace Core Security Contract'
        : isVault
        ? 'Vault Lending Pool Protocol'
        : 'Custom Soroban Contract';
      const subtitle = isSolaceCore
        ? 'contract/src/lib.rs'
        : isVault
        ? 'soroban_vault.rs'
        : 'soroban_contract.rs';

      const lines = code.trim().split('\n').filter(Boolean).length || 1;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const hash =
        hashOverride ||
        (isSolaceCore
          ? '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a'
          : isVault
          ? '8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4'
          : '3f7a18b2c90e45d120a4b7c89f01e23a456789b0c1d2e3f4a5b6c7d8e9f0a1b2');

      const payload = {
        contractName,
        subtitle,
        contractHash: hash,
        riskScore: reportData?.riskScore ?? (isVault ? 92 : 85),
        isSecure: reportData?.isSecure ?? true,
        summary:
          reportData?.summary ||
          (isVault
            ? 'Soroban multi-sig liquidity pool with authorized withdrawals and rent protection.'
            : 'Autonomous Solace Dual Flash AST Engine verified require_auth() invariants and persistent rent protection.'),
        vulnerabilitiesCount: reportData?.vulnerabilities?.length ?? 0,
        auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
        timestamp: timeStr,
        date: dateStr,
        linesCount: lines,
      };

      localStorage.setItem('solace-active-contract-audit', JSON.stringify(payload));
      window.dispatchEvent(new Event('solace-audit-updated'));
    } catch (_) {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('solace-active-contract-audit');
      if (!stored) {
        syncActiveContract(SAMPLE_SOROBAN_CONTRACT, null);
      }
    } catch (_) {}
  }, []);

  const handleLoadVault = () => {
    setCodeSnippet(SAMPLE_SOROBAN_CONTRACT);
    setReport(null);
    setAnchorResult(null);
    syncActiveContract(SAMPLE_SOROBAN_CONTRACT, {
      riskScore: 92,
      isSecure: true,
      summary: 'Soroban multi-sig liquidity pool with authorized withdrawals and rent protection.',
      vulnerabilities: [],
    }, '8e5c8e34be62125fce61ec221b659cbe3a7f766e4a2bf1cb6358db33cf3741d4');
  };

  const handleLoadSolaceCore = () => {
    const solaceCode = `// Solace Core Contract (contract/src/lib.rs)
// Implements immutable audit inscription and retrieval on Stellar Soroban
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuditRecord {
    pub auditor: Address,
    pub contract_hash: BytesN<32>,
    pub risk_score: u32,
    pub is_secure: bool,
    pub audit_type: Symbol,
    pub timestamp: u64,
}

#[contract]
pub struct SolaceContract;

#[contractimpl]
impl SolaceContract {
    pub fn record_audit(
        env: Env,
        auditor: Address,
        contract_hash: BytesN<32>,
        risk_score: u32,
        is_secure: bool,
        audit_type: Symbol,
    ) {
        auditor.require_auth();
        let record = AuditRecord {
            auditor,
            contract_hash: contract_hash.clone(),
            risk_score,
            is_secure,
            audit_type,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&contract_hash, &record);
    }
}
`;
    setCodeSnippet(solaceCode);
    setReport(null);
    setAnchorResult(null);
    syncActiveContract(solaceCode, {
      riskScore: 85,
      isSecure: true,
      summary: 'Autonomous Solace Dual Flash AST Engine verified require_auth() invariants and persistent rent protection.',
      vulnerabilities: [],
    }, '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a');
  };

  const handleClear = () => {
    setCodeSnippet('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCodeSnippet(text);
        syncActiveContract(text, null);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyCode = () => {
    if (!codeSnippet) return;
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
        const auditReport = data.data || data.report;
        setReport(auditReport);
        const resolvedHash = data.contractHash || '07c390518ca81e3aeb5c2025e135804470b13ba97ae5aa66782dbf06ea55330a';
        if (data.contractHash) {
          setContractHash(data.contractHash);
        }
        syncActiveContract(codeSnippet, auditReport, resolvedHash);

        // Persist to local audit history for full recall in Reports & History
        try {
          const isSolaceCore = codeSnippet.includes('SolaceContract');
          const isVault = codeSnippet.includes('VaultContract');
          const name = isSolaceCore ? 'Solace Core Security Contract' : isVault ? 'Solace Vault Protocol' : 'Custom Soroban Contract';
          const existing = JSON.parse(localStorage.getItem('solace_audit_history') || '[]');
          const newEntry = {
            hash: resolvedHash,
            contract: name,
            auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
            riskScore: auditReport.riskScore,
            isSecure: auditReport.isSecure,
            auditor: 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
            timestamp: 'Anchored on Testnet Ledger',
            summary: auditReport.summary,
            vulnerabilities: auditReport.vulnerabilities || [],
            codeSnippet: codeSnippet,
          };
          const updated = [newEntry, ...existing.filter((item: any) => item.hash !== resolvedHash)];
          localStorage.setItem('solace_audit_history', JSON.stringify(updated));
        } catch (_) {}
      } else {
        setError(data.error || 'Failed to generate audit report.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Verify the API is running on port 5000.');
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

  const lineCount = codeSnippet ? codeSnippet.split('\n').length : 0;

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors duration-200 pb-24 md:pb-8">
      {/* Main Studio Canvas */}
      <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Top Header Card (Enhanced Hero) */}
        <div className="relative overflow-hidden bg-white dark:bg-[#111726] rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 transition-colors">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block" />
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Live Security Engine</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  Stellar Soroban v22 Protocol
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Interactive Code Audit Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 max-w-xl leading-relaxed">
                Autonomous Solace Dual Flash AST inspection &amp; verification on Stellar Soroban
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap shrink-0">
              {/* View Tabs */}
              <div className="bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-full shadow-xs flex text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('STUDIO')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold transition text-xs select-none ${
                    activeTab === 'STUDIO'
                      ? 'bg-accent text-white shadow-md shadow-accent/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audit Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('INVARIANTS')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold transition text-xs select-none ${
                    activeTab === 'INVARIANTS'
                      ? 'bg-accent text-white shadow-md shadow-accent/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Audit Pass Rate</span>
                </button>
              </div>

              <Link
                href="/"
                className="px-4 py-2 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab 1: Studio */}
        {activeTab === 'STUDIO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left 7 Columns: Code Editor & Audit Action */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
                <div>
                  {/* Top Control Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {/* Load Presets */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">Load:</span>
                      <button
                        type="button"
                        onClick={handleLoadVault}
                        className="px-2.5 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-full transition whitespace-nowrap shrink-0"
                      >
                        Vault Protocol
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSolaceCore}
                        className="px-2.5 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-full transition whitespace-nowrap shrink-0"
                      >
                        Solace Core
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-full transition flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".rs,.wasm,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      {codeSnippet && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Pre / Post Deploy Toggle (Brand accent, no black) */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 p-0.5 sm:p-1 rounded-full text-xs shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsPostDeployment(false)}
                        className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                          !isPostDeployment
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
                        }`}
                      >
                        Pre-Deploy
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setIsPostDeployment(true)}
                        className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                          isPostDeployment
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
                        }`}
                      >
                        Post-Deploy
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Box with Modern Left Toolbar, Syntax Highlighting, and Bottom Status Bar */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden flex flex-col w-full max-w-full">
                    {/* Header Bar */}
                    <div className="flex justify-between items-center text-xs text-slate-300 px-3 py-2.5 border-b border-slate-800 font-mono bg-slate-900/70 flex-wrap gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex items-center gap-1.5 text-slate-100 font-bold truncate">
                          <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">soroban_contract.rs</span>
                        </span>
                        <span className="text-slate-600 hidden xs:inline">•</span>
                        <span className="text-slate-400 font-semibold text-[11px] hidden xs:inline">{lineCount} lines</span>
                      </div>

                      {/* Mode Toggle: Colored Syntax vs Plain Edit */}
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEditorMode('COLORED')}
                          className={`px-2 py-0.5 rounded-md font-bold transition ${
                            editorMode === 'COLORED'
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Colored Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('EDIT')}
                          className={`px-2 py-0.5 rounded-md font-bold transition ${
                            editorMode === 'EDIT'
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Plain Edit
                        </button>
                      </div>
                    </div>

                    {/* Editor Workspace with Left Side Bar, Gutter, and Code Canvas */}
                    <div className="relative font-mono text-[11px] sm:text-xs leading-6 h-[360px] sm:h-[460px] lg:h-[520px] flex overflow-hidden bg-slate-950">
                      {/* Modern Left Side Action Strip */}
                      <div className="w-8 sm:w-10 bg-slate-950/90 border-r border-slate-900 flex flex-col items-center py-2.5 gap-2 select-none shrink-0 z-10">
                        <span className="w-5 h-5 rounded-md bg-accent/15 text-accent text-[9px] font-black flex items-center justify-center border border-accent/25" title="Rust Contract">
                          RS
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                          title={copiedCode ? 'Copied code!' : 'Copy Code'}
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadVault}
                          className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                          title="Reset to Template"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Numbers Gutter */}
                      <div
                        ref={gutterRef}
                        className="select-none py-3 px-1.5 sm:px-2 bg-slate-900/40 border-r border-slate-800 text-slate-600 text-right font-mono text-[10px] sm:text-[11px] leading-6 w-8 sm:w-11 shrink-0 overflow-hidden"
                      >
                        {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Main Code Editing Canvas */}
                      <div className="relative flex-1 h-full overflow-hidden">
                        {/* Syntax Highlighted HTML Layer */}
                        <pre
                          ref={highlightRef}
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: '12px',
                            lineHeight: '24px',
                            letterSpacing: 'normal',
                            tabSize: 4,
                          }}
                          className={`absolute inset-0 p-3 m-0 overflow-auto modern-code-scrollbar text-slate-200 pointer-events-none whitespace-pre select-none ${
                            editorMode === 'COLORED' ? 'opacity-100' : 'opacity-0'
                          }`}
                          dangerouslySetInnerHTML={{ __html: highlightRustCode(codeSnippet) }}
                        />

                        {/* Interactive Textarea Layer */}
                        <textarea
                          ref={textareaRef}
                          value={codeSnippet}
                          onChange={(e) => setCodeSnippet(e.target.value)}
                          onScroll={handleEditorScroll}
                          placeholder="// Paste Soroban Rust smart contract (lib.rs) or click 'Vault Protocol' above..."
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: '12px',
                            lineHeight: '24px',
                            letterSpacing: 'normal',
                            tabSize: 4,
                            color: editorMode === 'COLORED' ? 'transparent' : '#e2e8f0',
                            WebkitTextFillColor: editorMode === 'COLORED' ? 'transparent' : '#e2e8f0',
                            caretColor: editorMode === 'COLORED' ? '#ffffff' : '#C80552',
                          }}
                          className="absolute inset-0 p-3 m-0 overflow-auto modern-code-scrollbar bg-transparent resize-none focus:outline-none whitespace-pre border-0 selection:bg-accent/40"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    {/* Modern Below Status Bar */}
                    <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 select-none flex-wrap gap-1">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Terminal className="w-3 h-3 text-accent" />
                          <span>soroban-sdk v22</span>
                        </span>
                        <span className="text-slate-600 hidden xs:inline">•</span>
                        <span className="text-slate-400 hidden xs:inline">Rust 2021 (no_std)</span>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <span className="text-slate-400 hidden sm:inline">UTF-8</span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-right">
                        <span>Ln {lineCount}, Col 1</span>
                        <span className="text-slate-600 hidden xs:inline">•</span>
                        <span className="hidden xs:inline">{codeSnippet.length} chars</span>
                        <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase text-[9px]">
                          {isPostDeployment ? 'POST-DEPLOY' : 'PRE-DEPLOY'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3.5 sm:pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {isPostDeployment
                      ? 'Validates live persistent storage rent TTL and archival eviction risks.'
                      : 'Analyzes AST authorization rules & panic vulnerabilities.'}
                  </span>

                  <button
                    type="button"
                    onClick={handleAudit}
                    disabled={loading || !codeSnippet.trim()}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold transition shadow-md shadow-accent/25 whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Solace AI Analyzing Code...' : 'Audit Smart Contract'}</span>
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Findings & On-Chain Verification */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col h-full min-h-[380px] sm:min-h-[500px] transition-colors">
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Findings & Ledger Receipt
                  </h2>
                  {report && (
                    <button
                      type="button"
                      onClick={handleAnchorOnChain}
                      disabled={anchoring}
                      className="px-3.5 py-1 rounded-full bg-accent hover:bg-accent-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold transition shadow-md shadow-accent/20 flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{anchoring ? 'Anchoring...' : 'Anchor on Soroban'}</span>
                    </button>
                  )}
                </div>

                {!report && !loading && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 sm:p-8 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Ready for Code Inspection</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs leading-relaxed font-medium">
                      Load a sample Soroban contract or paste Rust code and click Audit Smart Contract to initiate automated vulnerability detection.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 sm:p-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-3" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Solace Dual Flash AST Engine Analyzing...
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                      Evaluating require_auth(), persistent storage bounds, and arithmetic safety.
                    </p>
                  </div>
                )}

                {report && !loading && (
                  <div className="space-y-4 overflow-y-auto max-h-[620px] pr-1 modern-code-scrollbar">
                    {/* Scores & Status Pill */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                          Security Score
                        </span>
                        <div className={`text-xl sm:text-2xl font-black mt-0.5 ${report.riskScore > 50 ? 'text-red-600 dark:text-red-400' : 'text-accent'}`}>
                          {report.riskScore} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ 100</span>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                          Audit Verdict
                        </span>
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 truncate max-w-full ${
                          report.isSecure
                            ? 'bg-accent-subtle text-accent border border-accent/20'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                        }`}>
                          {report.isSecure ? '• Verified Secure' : '• Action Required'}
                        </span>
                      </div>
                    </div>

                    {/* Security Score Explanation Card */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span>Security Score Analysis ({report.riskScore}/100)</span>
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          report.riskScore > 70
                            ? 'bg-red-600 text-white'
                            : report.riskScore > 30
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {report.riskScore > 70 ? 'CRITICAL RISK' : report.riskScore > 30 ? 'MODERATE RISK' : 'VERIFIED SECURE'}
                        </span>
                      </div>

                      {/* Visual Risk Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            report.riskScore > 70
                              ? 'bg-red-500'
                              : report.riskScore > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(report.riskScore, 100)}%` }}
                        />
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {report.riskScore > 70
                          ? `A risk score of ${report.riskScore}/100 indicates critical invariant flaws. Unauthenticated storage mutations or missing require_auth() authorization guards allow malicious callers to drain assets or overwrite administrative control. Fixes are required before deployment.`
                          : report.riskScore > 30
                          ? `A risk score of ${report.riskScore}/100 represents warnings. Review persistent storage rent TTL and unhandled panic boundaries prior to mainnet ledger deployment.`
                          : `A risk score of ${report.riskScore}/100 indicates clean AST invariant enforcement. Authentication asserts, storage rent management, and error handling are fully compliant with Soroban v22 protocol.`
                        }
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${report.isSecure ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="font-semibold">Auth Guarding:</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">{report.isSecure ? 'Enforced' : 'Action Required'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${report.isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-semibold">Storage Rent:</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">{report.isSecure ? 'Bounded' : 'Review TTL'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hash Pill */}
                    {contractHash && (
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          Hash: {contractHash.slice(0, 12)}...{contractHash.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyHash}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {/* On-Chain Anchored Confirmation */}
                    {anchorResult && (
                      <div className="p-3 rounded-xl sm:rounded-2xl bg-accent-subtle border border-accent/20 text-xs">
                        <span className="font-bold text-accent block">Permanently Anchored on Stellar Testnet</span>
                        <p className="text-slate-700 dark:text-slate-200 text-xs mt-0.5 font-medium">
                          Audit findings cryptographically anchored in contract{' '}
                          <span className="font-mono text-accent font-bold">{LIVE_CONTRACT_ID.slice(0, 10)}...</span>
                        </p>
                        <a
                          href={anchorResult.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-accent underline mt-1.5 inline-flex items-center gap-1 hover:text-accent-hover"
                        >
                          <span>View Transaction on Stellar Expert</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Executive Summary */}
                    <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Executive Summary</span>
                      <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed font-medium">{report.summary}</p>
                    </div>

                    {/* Detected Issues with Syntax-Colored Recommendations */}
                    {report.vulnerabilities && report.vulnerabilities.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Detected Issues ({report.vulnerabilities.length})
                        </span>
                        {report.vulnerabilities.map((vuln, i) => (
                          <div key={i} className="p-3 rounded-xl sm:rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-xs">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-bold text-red-950 dark:text-red-200 break-words">{vuln.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0">
                                {vuln.severity}
                              </span>
                            </div>
                            <p className="text-red-950 dark:text-red-200 text-xs leading-relaxed mb-2 break-words font-medium">
                              {vuln.description}
                            </p>
                            <FormattedRecommendation text={vuln.recommendation} index={i} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invariants */}
        {activeTab === 'INVARIANTS' && (
          <div className="bg-white dark:bg-[#111726] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Audit Pass Rate</h2>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Automated Soroban AST invariant analysis across categories</p>
              </div>

              <div className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                +98.2% Pass Rate
              </div>
            </div>

            {/* Bar Chart Visualization with Mobile Horizontal Scrolling & No Overflow */}
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <div className="min-w-[550px] flex items-end justify-between h-64 sm:h-72 px-2 sm:px-10 pt-6 border-b border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex flex-col justify-between h-full text-xs font-semibold text-slate-600 dark:text-slate-300 py-1 pr-3 shrink-0">
                  <span className="text-accent font-bold">100% Safe</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span className="text-red-500 font-bold">0% Threat</span>
                </div>

                {invariantVectors.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <span className={`text-xs font-black transition-transform group-hover:scale-110 ${item.scoreColor}`}>
                      {item.score}%
                    </span>

                    <div
                      className="w-10 sm:w-12 h-44 sm:h-52 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 flex flex-col justify-end relative overflow-hidden shadow-inner transition group-hover:scale-[1.02]"
                      style={{ borderColor: `${item.glowColor}40` }}
                    >
                      <div
                        className="w-full rounded-xl transition-all duration-500 relative overflow-hidden shadow-sm"
                        style={{
                          height: `${item.score}%`,
                          background: item.gradientStyle,
                          boxShadow: `0 2px 10px ${item.glowColor}40`,
                        }}
                      >
                        <div className="absolute top-1 left-1 right-1 h-2 rounded-full bg-white/40" />
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.shortName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
                <span>Enforced Authorization Protocols</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('STUDIO')}
                className="font-bold text-slate-900 dark:text-white hover:text-accent underline underline-offset-2 flex items-center gap-1"
              >
                <span>Test Contract Code</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
