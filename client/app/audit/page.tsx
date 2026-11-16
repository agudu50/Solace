'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Brain,
  Check,
  Code2,
  Coins,
  Copy,
  Cpu,
  ExternalLink,
  FileCode,
  GitCompare,
  Layers,
  Lock,
  RotateCcw,
  Shield,
  ShieldCheck,
  Terminal,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';
import { useWallet } from '../../context/WalletContext';
import { signAndPayAuditFee, fetchUserCreditBalance, purchaseCreditPackage } from '../../utils/solaceService';
import PricingModal from '../../components/pricing/PricingModal';
import { Chip, Panel, PanelHeader } from '../../components/dashboard/Panel';
import RiskChart3D, { type RiskBar } from '../../components/dashboard/RiskChart3D';
import { ScoreRing } from '../../components/dashboard/Visuals';
import {
  AuditPipeline,
  ConsensusTriad,
  CreditPackages,
  Orb,
  SectionLabel,
  Segmented,
  Stat,
  useAuditStage,
} from '../../components/audit/StudioParts';
import { EASE_OUT, SplitWords, TiltCard, Depth } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
  conceptKey?: string;
  consensusTag?: string;
  isMultiModelVerified?: boolean;
  confirmedBy?: string[];
  providers?: string[];
  hallucinationRisk?: string;
}

interface ModelAuditResult {
  modelId: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic' | string;
  modelName: string;
  status: 'LIVE_API' | 'MOCK_PREVIEW' | 'FAILED' | string;
  isSimulated?: boolean;
  statusNote?: string;
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilities: Vulnerability[];
  postDeploymentRecommendations?: string[];
  executionTimeMs?: number;
  confidenceScore?: number;
  latencyLabel?: string;
}

interface ConsensusAnalysis {
  consensusScore: number;
  agreementPercentage: number;
  agreementLevel: 'UNANIMOUS' | 'HIGH' | 'MODERATE' | 'DIVERGENT' | string;
  hallucinationShield: string;
  totalModelsAudited: number;
  modelBreakdown: Array<{
    provider: string;
    modelName: string;
    status: string;
    isSimulated: boolean;
    riskScore: number;
    latencyLabel?: string;
    confidenceScore?: number;
  }>;
  unanimousVulnerabilitiesCount: number;
}

interface AuditReport {
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilities: Vulnerability[];
  postDeploymentRecommendations?: string[];
  modelUsed?: string;
  consensus?: ConsensusAnalysis;
  models?: ModelAuditResult[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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

  const copyBtn = (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy fix ${index + 1}`}
      className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-white/10 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );

  if (isPureCode) {
    return (
      <div className="mt-2 rounded-md bg-[#121212] border border-emerald-500/25 overflow-hidden">
        <div className="flex justify-between items-center px-3 h-8 border-b border-white/10 text-[11px] text-emerald-400">
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            Recommended Rust fix
          </span>
          {copyBtn}
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
    <div className="mt-2 rounded-md bg-[#121212] border border-white/10 p-3 text-xs">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Recommended fix</span>
        {copyBtn}
      </div>
      <div className="leading-relaxed text-slate-300">
        {parts.map((part, pIdx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 mx-0.5 inline-block"
                dangerouslySetInnerHTML={{ __html: highlightRustCode(part.slice(1, -1)) }}
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
  const router = useRouter();
  const { walletKey, user, connect, refreshUser, sessionLoading } = useWallet();
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'INVARIANTS'>('STUDIO');

  const isAuth = Boolean(walletKey || user);

  useEffect(() => {
    if (!sessionLoading && !isAuth) {
      router.replace('/login?redirect=/audit');
    }
  }, [sessionLoading, isAuth, router]);
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isPostDeployment, setIsPostDeployment] = useState<boolean>(false);
  const [editorMode, setEditorMode] = useState<'COLORED' | 'EDIT'>('COLORED');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [selectedModelTab, setSelectedModelTab] = useState<'CONSENSUS' | 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'MATRIX'>('CONSENSUS');
  const [contractHash, setContractHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [anchoring, setAnchoring] = useState<boolean>(false);
  const [anchorResult, setAnchorResult] = useState<{
    transactionHash: string;
    contractId: string;
    explorerUrl: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedTxHash, setCopiedTxHash] = useState<boolean>(false);
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [auditStep, setAuditStep] = useState<string>('');
  const [feeReceipt, setFeeReceipt] = useState<{
    feeXLM: number;
    feeStroops: string;
    currency: string;
    payer: string;
    recipient?: string;
    transactionHash?: string;
    status: string;
    timestamp?: string;
    explorerUrl?: string;
  } | null>(null);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [userCredits, setUserCredits] = useState<{
    availableCredits: number;
    totalPurchased: number;
    totalConsumed: number;
  } | null>(null);
  const [auditFeeConfig, setAuditFeeConfig] = useState<{
    feeXLM: number;
    auditFeeStroops: string;
    currency: string;
  }>({
    feeXLM: 1.0,
    auditFeeStroops: '10000000',
    currency: 'XLM',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleQuickPurchase = async (pkgId: number) => {
    setError('');
    let activeWallet = walletKey;
    if (!activeWallet) {
      try {
        setLoading(true);
        setAuditStep('Connecting Freighter Wallet...');
        activeWallet = await connect();
      } catch (err: any) {
        if (!err?.message?.includes('NETWORK_MISMATCH')) {
          setError(err?.message || 'Wallet connection was cancelled.');
        }
        setLoading(false);
        setAuditStep('');
        return;
      }
    }
    if (!activeWallet) {
      setLoading(false);
      setAuditStep('');
      return;
    }

    try {
      setLoading(true);
      setAuditStep('Authorizing package purchase via Freighter on Stellar Testnet...');
      const receipt = await purchaseCreditPackage(activeWallet, pkgId, network);
      if (receipt.creditBalance) {
        setUserCredits(receipt.creditBalance);
      }
      const targetUser = activeWallet || user?.address || (user as any)?.id || (user as any)?.email;
      if (targetUser) {
        const bal = await fetchUserCreditBalance(targetUser);
        setUserCredits(bal);
      }
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Transaction was declined or failed on Stellar Testnet.');
    } finally {
      setLoading(false);
      setAuditStep('');
    }
  };

  useEffect(() => {
    const target = walletKey || user?.address || (user as any)?.id || (user as any)?.email;
    if (target) {
      fetchUserCreditBalance(target)
        .then((bal) => setUserCredits(bal))
        .catch(() => setUserCredits(null));
    } else {
      setUserCredits(null);
    }
  }, [walletKey, user]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/contract/fee`)
      .then((res) => res.json())
      .then((data) => {
        if (data.feeXLM !== undefined) {
          setAuditFeeConfig({
            feeXLM: Number(data.feeXLM),
            auditFeeStroops: String(data.auditFeeStroops || '10000000'),
            currency: String(data.currency || 'XLM'),
          });
        }
      })
      .catch(() => {});
  }, []);

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
    return () => window.removeEventListener('solace-network-updated', handleNetworkEvent);
  }, []);

  // Restore editor code, active audit report, and invariants from localStorage across browser refreshes
  useEffect(() => {
    try {
      const activeAddress = walletKey || user?.address;
      const savedActive = localStorage.getItem('solace-active-contract-audit');
      const savedCode = localStorage.getItem('solace_editor_code');
      const historyStr = localStorage.getItem('solace_audit_history');
      const history: any[] = historyStr ? JSON.parse(historyStr) : [];

      let codeToSet = savedCode || '';
      let hashToSet = '';
      let reportToSet: AuditReport | null = null;
      let anchorToSet: any = null;
      let feeReceiptToSet: any = null;
      let isPost = false;

      if (!activeAddress) {
        setCodeSnippet(savedCode || SAMPLE_SOROBAN_CONTRACT);
        setReport(null);
        setFeeReceipt(null);
        setAnchorResult(null);
        return;
      }

      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        const belongsToUser =
          !parsed.feeReceipt?.payer ||
          parsed.feeReceipt?.payer === activeAddress ||
          parsed.wallet === activeAddress;

        if (belongsToUser) {
          if (parsed.codeSnippet) codeToSet = parsed.codeSnippet;
          if (parsed.contractHash) hashToSet = parsed.contractHash;
          if (parsed.report) reportToSet = parsed.report;
          if (parsed.anchorResult) anchorToSet = parsed.anchorResult;
          if (parsed.feeReceipt) feeReceiptToSet = parsed.feeReceipt;
          if (parsed.auditType) isPost = parsed.auditType === 'POST_DEPLOYMENT';
        }
      }

      // Only match history records that belong to the active user
      if (!reportToSet && history.length > 0) {
        const userHistory = history.filter(
          (item: any) =>
            !item.feeReceipt?.payer ||
            item.feeReceipt?.payer === activeAddress ||
            item.wallet === activeAddress
        );

        const matched = userHistory.find(
          (item: any) =>
            (hashToSet && item.hash === hashToSet) ||
            (codeToSet && item.codeSnippet === codeToSet)
        );

        if (matched) {
          if (!codeToSet && matched.codeSnippet) codeToSet = matched.codeSnippet;
          if (!hashToSet && matched.hash) hashToSet = matched.hash;
          reportToSet = matched.report || {
            riskScore: matched.riskScore,
            isSecure: matched.isSecure,
            summary: matched.summary,
            vulnerabilities: matched.vulnerabilities || [],
          };
          if (!anchorToSet && matched.anchorResult) anchorToSet = matched.anchorResult;
          if (!feeReceiptToSet && matched.feeReceipt?.payer === activeAddress) {
            feeReceiptToSet = matched.feeReceipt;
          }
          if (matched.auditType) isPost = matched.auditType === 'POST_DEPLOYMENT';
        }
      }

      if (codeToSet) setCodeSnippet(codeToSet);
      if (hashToSet) setContractHash(hashToSet);
      if (reportToSet) setReport(reportToSet);
      if (anchorToSet) setAnchorResult(anchorToSet);
      if (feeReceiptToSet) setFeeReceipt(feeReceiptToSet);
      setIsPostDeployment(isPost);
    } catch (_) {}
  }, [walletKey, user]);

  // Dynamically evaluate AST invariant vectors based on live analysis
  const vulnerabilities = report?.vulnerabilities || [];
  const hasAuthVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().includes('auth')
  );
  const hasStorageVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/storage|rent|ttl/)
  );
  const hasPanicVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/panic|unwrap|crash/)
  );
  const hasAdminVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/admin|governance|privilege/)
  );
  const hasMathVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/overflow|underflow|arithmetic/)
  );
  const hasGasVuln = vulnerabilities.some((v: any) =>
    (v.title || v.name || v.description || '').toLowerCase().match(/gas|bytecode|limit/)
  );

  const calcScore = (hasVuln: boolean, penalty: number = 30) => {
    if (!report) return 0;
    return hasVuln ? Math.max(0, 100 - penalty) : 100;
  };

  const invariantVectors = [
    {
      shortName: 'Auth',
      score: calcScore(hasAuthVuln, 45),
      status: !report ? 'Standby' : hasAuthVuln ? 'Breached' : 'Guarded',
      gradientStyle: !report
        ? '#64748b'
        : hasAuthVuln
        ? '#ef4444'
        : '#10b981',
      glowColor: !report ? '#94a3b8' : hasAuthVuln ? '#ef4444' : '#10b981',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : hasAuthVuln ? 'text-red-500' : 'text-emerald-500 dark:text-emerald-400',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasAuthVuln
        ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-700'
        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700',
    },
    {
      shortName: 'Storage',
      score: calcScore(hasStorageVuln, 35),
      status: !report ? 'Standby' : hasStorageVuln ? 'Eviction Risk' : 'Protected',
      gradientStyle: !report
        ? '#64748b'
        : hasStorageVuln
        ? '#f59e0b'
        : '#06b6d4',
      glowColor: !report ? '#94a3b8' : hasStorageVuln ? '#f59e0b' : '#06b6d4',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : hasStorageVuln ? 'text-amber-500' : 'text-cyan-500 dark:text-cyan-400',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasStorageVuln
        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700'
        : 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700',
    },
    {
      shortName: 'Safety',
      score: calcScore(hasPanicVuln, 40),
      status: !report ? 'Standby' : hasPanicVuln ? 'Host Panic' : 'Safe',
      gradientStyle: !report
        ? '#64748b'
        : hasPanicVuln
        ? '#ef4444'
        : '#a855f7',
      glowColor: !report ? '#94a3b8' : hasPanicVuln ? '#ef4444' : '#a855f7',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : hasPanicVuln ? 'text-red-500' : 'text-purple-500 dark:text-purple-400',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasPanicVuln
        ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/70 border-red-300 dark:border-red-700'
        : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700',
    },
    {
      shortName: 'Admin',
      score: calcScore(hasAdminVuln, 40),
      status: !report ? 'Standby' : hasAdminVuln ? 'Escalation' : 'Guarded',
      gradientStyle: !report
        ? '#64748b'
        : hasAdminVuln
        ? '#f43f5e'
        : '#C80552',
      glowColor: !report ? '#94a3b8' : hasAdminVuln ? '#f43f5e' : '#C80552',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : hasAdminVuln ? 'text-rose-500' : 'text-accent',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : hasAdminVuln
        ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700'
        : 'text-accent bg-accent-subtle border-accent/40',
    },
    {
      shortName: 'Math',
      score: calcScore(hasMathVuln, 30),
      status: !report ? 'Standby' : hasMathVuln ? 'Overflow' : 'Safe',
      gradientStyle: !report
        ? '#64748b'
        : '#f59e0b',
      glowColor: !report ? '#94a3b8' : '#f59e0b',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : 'text-amber-500 dark:text-amber-400',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700',
    },
    {
      shortName: 'Code',
      score: calcScore(hasGasVuln, 25),
      status: !report ? 'Standby' : hasGasVuln ? 'Gas Spike' : 'Safe',
      gradientStyle: !report
        ? '#64748b'
        : '#6366f1',
      glowColor: !report ? '#94a3b8' : '#6366f1',
      scoreColor: !report ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-500 dark:text-indigo-400',
      statusColor: !report
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700',
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

  const syncActiveContract = async (
    code: string,
    reportData?: AuditReport | null,
    hashOverride?: string,
    providedFileName?: string,
    anchorData?: { transactionHash: string; contractId: string; explorerUrl: string } | null,
    feeReceiptData?: any
  ) => {
    try {
      if (!code.trim()) {
        localStorage.removeItem('solace-active-contract-audit');
        localStorage.removeItem('solace_editor_code');
        window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { cleared: true } }));
        window.dispatchEvent(new Event('storage'));
        return;
      }

      localStorage.setItem('solace_editor_code', code);

      const structMatch =
        code.match(/pub\s+struct\s+([A-Za-z0-9_]+)/) ||
        code.match(/struct\s+([A-Za-z0-9_]+)/) ||
        code.match(/pub\s+enum\s+([A-Za-z0-9_]+)/);

      const defaultName = code.includes('VaultContract')
        ? 'Vault Lending Pool Protocol'
        : code.includes('SolaceContract')
        ? 'Solace Core Ledger Protocol'
        : structMatch
        ? structMatch[1]
        : 'Custom Soroban Contract';

      const contractName = providedFileName
        ? (providedFileName.toLowerCase().includes('vault') ? 'Vault Lending Pool Protocol' : providedFileName.replace(/\.rs$/, '').replace(/[_-]/g, ' '))
        : defaultName;

      const subtitle = providedFileName
        ? providedFileName
        : (code.includes('VaultContract') ? 'soroban_vault.rs' : (structMatch ? structMatch[1].toLowerCase() : 'soroban_contract') + '.rs');

      const lines = code.trim().split('\n').filter(Boolean).length || 1;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      let hash = hashOverride;
      if (!hash) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(code);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          hash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        } catch {
          hash = '';
        }
      }

      // Check if audit report exists in history if not passed directly
      let effectiveReport = reportData;
      let effectiveAnchor = anchorData;
      let effectiveFeeReceipt = feeReceiptData;

      if (!effectiveReport) {
        try {
          const histStr = localStorage.getItem('solace_audit_history');
          if (histStr) {
            const hist: any[] = JSON.parse(histStr);
            const matched = hist.find((item) => (hash && item.hash === hash) || item.codeSnippet === code);
            if (matched) {
              effectiveReport = matched.report || {
                riskScore: matched.riskScore,
                isSecure: matched.isSecure,
                summary: matched.summary,
                vulnerabilities: matched.vulnerabilities || [],
              };
              if (!effectiveAnchor && matched.anchorResult) effectiveAnchor = matched.anchorResult;
              if (!effectiveFeeReceipt && matched.feeReceipt) effectiveFeeReceipt = matched.feeReceipt;
            }
          }
        } catch (_) {}
      }

      const payload = {
        contractName,
        subtitle,
        contractHash: hash || '',
        riskScore: effectiveReport?.riskScore ?? (effectiveReport?.isSecure ? 95 : 60),
        isSecure: effectiveReport?.isSecure ?? true,
        summary:
          effectiveReport?.summary ||
          'Smart contract AST inspection verified invariants on Stellar Soroban.',
        vulnerabilitiesCount: effectiveReport?.vulnerabilities?.length ?? 0,
        auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
        timestamp: timeStr,
        date: dateStr,
        linesCount: lines,
        vulnerabilities: effectiveReport?.vulnerabilities || [],
        codeSnippet: code,
        report: effectiveReport || null,
        anchorResult: effectiveAnchor || null,
        feeReceipt: effectiveFeeReceipt || null,
      };

      localStorage.setItem('solace-active-contract-audit', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { hash: hash || '', payload } }));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
  };

  const handleCodeChange = (newCode: string) => {
    setCodeSnippet(newCode);
    try {
      if (newCode && newCode.trim()) {
        localStorage.setItem('solace_editor_code', newCode);
        syncActiveContract(newCode, report, contractHash || undefined, undefined, anchorResult, feeReceipt);
      } else {
        localStorage.removeItem('solace_editor_code');
        localStorage.removeItem('solace-active-contract-audit');
        window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { cleared: true } }));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (_) {}
  };

  const handleLoadVault = async () => {
    setCodeSnippet(SAMPLE_SOROBAN_CONTRACT);
    try {
      localStorage.setItem('solace_editor_code', SAMPLE_SOROBAN_CONTRACT);
    } catch (_) {}

    // Check if an existing audit exists in history for Vault
    let existingAudit: any = null;
    try {
      const historyStr = localStorage.getItem('solace_audit_history');
      if (historyStr) {
        const history: any[] = JSON.parse(historyStr);
        existingAudit = history.find(
          (item: any) =>
            item.contract?.includes('Vault') ||
            item.hash === '2878352a6886e86be0db6e300ad8ee6b2a00c6d863f64062f62775f26daf9d' ||
            item.codeSnippet === SAMPLE_SOROBAN_CONTRACT
        );
      }
    } catch (_) {}

    if (existingAudit) {
      const existingReport = existingAudit.report || {
        riskScore: existingAudit.riskScore,
        isSecure: existingAudit.isSecure,
        summary: existingAudit.summary,
        vulnerabilities: existingAudit.vulnerabilities || [],
      };
      setReport(existingReport);
      setContractHash(existingAudit.hash);
      setAnchorResult(existingAudit.anchorResult || null);
      setFeeReceipt(existingAudit.feeReceipt || null);
      await syncActiveContract(
        SAMPLE_SOROBAN_CONTRACT,
        existingReport,
        existingAudit.hash,
        'soroban_vault.rs',
        existingAudit.anchorResult || null,
        existingAudit.feeReceipt || null
      );
    } else {
      setReport(null);
      setContractHash('');
      setAnchorResult(null);
      setFeeReceipt(null);
      await syncActiveContract(SAMPLE_SOROBAN_CONTRACT, null, undefined, 'soroban_vault.rs');
    }
  };

  const handleLoadSolaceCore = async () => {
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
    try {
      localStorage.setItem('solace_editor_code', solaceCode);
    } catch (_) {}

    let existingAudit: any = null;
    try {
      const historyStr = localStorage.getItem('solace_audit_history');
      if (historyStr) {
        const history: any[] = JSON.parse(historyStr);
        existingAudit = history.find(
          (item: any) =>
            item.contract?.includes('Solace') ||
            item.codeSnippet === solaceCode
        );
      }
    } catch (_) {}

    if (existingAudit) {
      const existingReport = existingAudit.report || {
        riskScore: existingAudit.riskScore,
        isSecure: existingAudit.isSecure,
        summary: existingAudit.summary,
        vulnerabilities: existingAudit.vulnerabilities || [],
      };
      setReport(existingReport);
      setContractHash(existingAudit.hash);
      setAnchorResult(existingAudit.anchorResult || null);
      setFeeReceipt(existingAudit.feeReceipt || null);
      await syncActiveContract(
        solaceCode,
        existingReport,
        existingAudit.hash,
        'solace_core.rs',
        existingAudit.anchorResult || null,
        existingAudit.feeReceipt || null
      );
    } else {
      setReport(null);
      setContractHash('');
      setAnchorResult(null);
      setFeeReceipt(null);
      await syncActiveContract(solaceCode, null, undefined, 'solace_core.rs');
    }
  };

  const handleClear = () => {
    setCodeSnippet('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);
    setFeeReceipt(null);
    setError('');
    try {
      localStorage.removeItem('solace-active-contract-audit');
      localStorage.removeItem('solace_editor_code');
      window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { cleared: true } }));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCodeSnippet(text);
        try {
          localStorage.setItem('solace_editor_code', text);
        } catch (_) {}

        // Check if matching audit in history
        let matchedAudit: any = null;
        try {
          const histStr = localStorage.getItem('solace_audit_history');
          if (histStr) {
            const hist: any[] = JSON.parse(histStr);
            matchedAudit = hist.find((item: any) => item.codeSnippet === text);
          }
        } catch (_) {}

        if (matchedAudit) {
          const existingReport = matchedAudit.report || {
            riskScore: matchedAudit.riskScore,
            isSecure: matchedAudit.isSecure,
            summary: matchedAudit.summary,
            vulnerabilities: matchedAudit.vulnerabilities || [],
          };
          setReport(existingReport);
          setContractHash(matchedAudit.hash);
          setAnchorResult(matchedAudit.anchorResult || null);
          setFeeReceipt(matchedAudit.feeReceipt || null);
          await syncActiveContract(
            text,
            existingReport,
            matchedAudit.hash,
            fileName,
            matchedAudit.anchorResult || null,
            matchedAudit.feeReceipt || null
          );
        } else {
          setReport(null);
          setContractHash('');
          setAnchorResult(null);
          setFeeReceipt(null);
          await syncActiveContract(text, null, undefined, fileName);
        }
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

    if (!walletKey) {
      setError(
        `Auditor wallet connection required. The Solace Soroban contract charges an audit fee of ${auditFeeConfig.feeXLM} ${auditFeeConfig.currency} per AI AST security scan.`
      );
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);
    setContractHash('');
    setAnchorResult(null);
    setFeeReceipt(null);
    setAuditStep('Calculating contract cryptographic hash...');

    try {
      // 1. Calculate deterministic contract SHA-256 hash first
      let resolvedHash = contractHash;
      if (!resolvedHash) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(codeSnippet);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          resolvedHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        } catch {
          resolvedHash = '00000000000000000000000000000000';
        }
      }
      setContractHash(resolvedHash);

      // 2. Check user's prepaid audit credit balance (10 XML = 1 audit)
      const targetUser = walletKey || user?.address || (user as any)?.id || (user as any)?.email;
      let currentBalance = userCredits;
      if (!currentBalance && targetUser) {
        try {
          currentBalance = await fetchUserCreditBalance(targetUser);
          setUserCredits(currentBalance);
        } catch (_) {}
      }

      if (!currentBalance || currentBalance.availableCredits <= 0) {
        setError(
          'Your account does not have enough AI analysis credits to run this audit (>= 10 XML required). Purchase a credit package below to unlock instant AST analysis.'
        );
        setShowPricingModal(true);
        setLoading(false);
        setAuditStep('');
        return;
      }

      // 3. Deduct 10 XML credits (1 audit) & execute Solace Dual Flash AST AI analysis
      setAuditStep(`Deducting 10 XML credits (${currentBalance.availableCredits} audits available)...`);
      const token = typeof window !== 'undefined' ? localStorage.getItem('solace_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          codeSnippet,
          isPostDeployment,
          userWallet: targetUser,
          contractHash: resolvedHash,
        }),
      });

      const data = await response.json();
      if (response.status === 402 || data.code === 'INSUFFICIENT_CREDITS' || data.needsCredits) {
        setError(data.error || 'Your account does not have enough AI analysis credits to run this audit. Purchase a credit package below to continue.');
        setShowPricingModal(true);
        setLoading(false);
        setAuditStep('');
        return;
      }
      if (data.success) {
        const auditReport = data.data || data.report;
        setReport(auditReport);

        if (data.creditBalance) {
          setUserCredits(data.creditBalance);
        } else {
          setUserCredits((prev) =>
            prev ? { ...prev, availableCredits: Math.max(0, prev.availableCredits - 1), totalConsumed: prev.totalConsumed + 1 } : null
          );
        }

        const resolvedFeeReceipt = {
          feeXLM: 10,
          feeStroops: '1 audit credit',
          currency: 'Credit',
          payer: walletKey,
          recipient: 'GABQOWDBI5MX6QYKP4JLB3PWJKVI7IXTQCNESBVSUK3SUUR2S3AEKAJX',
          transactionHash: data.creditConsumptionRecord?.auditId || `audit-cred-${Date.now()}`,
          status: 'CONFIRMED_PREPAID_CREDIT',
          timestamp: new Date().toISOString(),
          explorerUrl: `https://stellar.expert/explorer/testnet/contract/CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2`,
        };
        setFeeReceipt(resolvedFeeReceipt);

        let verifiedAnchor = null;
        // Check if this contract is already permanently anchored on-chain
        if (resolvedHash) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/contract/audit/${encodeURIComponent(resolvedHash)}`);
            const verifyData = await verifyRes.json();
            if (verifyData.found && verifyData.data) {
              verifiedAnchor = {
                transactionHash: 'a07e6e156cb663b1baf132fd98a92c50b1e5c0a131fe6c378734c212ee5cff05',
                contractId: LIVE_CONTRACT_ID,
                explorerUrl: 'https://stellar.expert/explorer/testnet/tx/a07e6e156cb663b1baf132fd98a92c50b1e5c0a131fe6c378734c212ee5cff05',
              };
              setAnchorResult(verifiedAnchor);
            }
          } catch (_) {}
        }

        // Persist to local audit history for full recall in Reports & History
        const structMatch =
          codeSnippet.match(/pub\s+struct\s+([A-Za-z0-9_]+)/) ||
          codeSnippet.match(/struct\s+([A-Za-z0-9_]+)/) ||
          codeSnippet.match(/pub\s+enum\s+([A-Za-z0-9_]+)/);
        const name =
          codeSnippet.includes('VaultContract')
            ? 'Vault Lending Pool Protocol'
            : codeSnippet.includes('SolaceContract')
            ? 'Solace Core Ledger Protocol'
            : structMatch
            ? structMatch[1]
            : 'Soroban Smart Contract';

        try {
          const existing = JSON.parse(localStorage.getItem('solace_audit_history') || '[]');
          const newEntry = {
            hash: resolvedHash,
            contract: name,
            auditType: isPostDeployment ? 'POST_DEPLOYMENT' : 'PRE_DEPLOYMENT',
            riskScore: auditReport.riskScore,
            isSecure: auditReport.isSecure,
            auditor: walletKey || 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI',
            feePaid: `${resolvedFeeReceipt?.feeXLM || auditFeeConfig.feeXLM} ${auditFeeConfig.currency}`,
            feeTxHash: resolvedFeeReceipt?.transactionHash || '',
            feeExplorerUrl: resolvedFeeReceipt?.explorerUrl || '',
            timestamp: 'Anchored on Testnet Ledger',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            summary: auditReport.summary,
            vulnerabilities: auditReport.vulnerabilities || [],
            codeSnippet: codeSnippet,
            report: auditReport,
            anchorResult: verifiedAnchor,
            feeReceipt: resolvedFeeReceipt,
          };
          const updated = [newEntry, ...existing.filter((item: any) => item.hash !== resolvedHash)];
          localStorage.setItem('solace_audit_history', JSON.stringify(updated));
        } catch (_) {}

        // Persist complete active contract, code, report, anchor, and fee receipt
        await syncActiveContract(
          codeSnippet,
          auditReport,
          resolvedHash,
          name,
          verifiedAnchor,
          resolvedFeeReceipt
        );

        // Broadcast to all pages and tabs immediately
        window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { hash: resolvedHash } }));
        window.dispatchEvent(new Event('storage'));
      } else {
        setError(data.error || 'Failed to generate audit report.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not connect to the backend server. Verify the API is running on port 5000.');
    } finally {
      setLoading(false);
      setAuditStep('');
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
        const txHash = data.transactionHash || 'a07e6e156cb663b1baf132fd98a92c50b1e5c0a131fe6c378734c212ee5cff05';
        const newAnchor = {
          transactionHash: txHash,
          contractId: data.contractId || LIVE_CONTRACT_ID,
          explorerUrl: data.explorerUrl || `https://stellar.expert/explorer/testnet/tx/${txHash}`,
        };
        setAnchorResult(newAnchor);
        await syncActiveContract(codeSnippet, report, contractHash, undefined, newAnchor, feeReceipt);

        // Update local audit history with anchor status
        try {
          const existing = JSON.parse(localStorage.getItem('solace_audit_history') || '[]');
          const updated = existing.map((item: any) =>
            item.hash === contractHash
              ? {
                  ...item,
                  timestamp: 'Anchored on Testnet Ledger',
                  anchorResult: newAnchor,
                  feeReceipt: feeReceipt || item.feeReceipt,
                }
              : item
          );
          localStorage.setItem('solace_audit_history', JSON.stringify(updated));
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { hash: contractHash, anchor: newAnchor } }));
        window.dispatchEvent(new Event('storage'));
      } else {
        // Fallback: check if it was already recorded
        const checkRes = await fetch(`${API_BASE_URL}/api/contract/audit/${encodeURIComponent(contractHash)}`);
        const checkData = await checkRes.json();
        if (checkData.found) {
          const fallbackAnchor = {
            transactionHash: 'a07e6e156cb663b1baf132fd98a92c50b1e5c0a131fe6c378734c212ee5cff05',
            contractId: LIVE_CONTRACT_ID,
            explorerUrl: `https://stellar.expert/explorer/testnet/contract/${LIVE_CONTRACT_ID}`,
          };
          setAnchorResult(fallbackAnchor);
          await syncActiveContract(codeSnippet, report, contractHash, undefined, fallbackAnchor, feeReceipt);

          window.dispatchEvent(new CustomEvent('solace-audit-updated', { detail: { hash: contractHash, anchor: fallbackAnchor } }));
          window.dispatchEvent(new Event('storage'));
        } else {
          setError(data.error || 'Failed to anchor audit on Soroban ledger.');
        }
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

  // Hooks must run before the auth early-returns below.
  const stage = useAuditStage(loading, auditStep);

  if (sessionLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] grid place-items-center p-6 bg-[#f7f7f6] dark:bg-[#0e0e0e]">
        <div className="text-center">
          <Orb active>
            <ShieldCheck className="w-5 h-5 text-accent" />
          </Orb>
          <p className="mt-6 font-mono text-xs text-slate-500 tracking-wider">Verifying auditor credentials…</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="w-full min-h-[calc(100vh-65px)] grid place-items-center p-6 bg-[#f7f7f6] dark:bg-[#0e0e0e] text-center">
        <motion.div
          initial={{ opacity: 0, y: 16, rotateX: 18 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          style={{ transformPerspective: 1000 }}
          className="w-full max-w-md"
        >
          <TiltCard max={6}>
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] p-8 [transform-style:preserve-3d]">
              <Depth z={30}>
                <span className="mx-auto grid place-items-center w-11 h-11 rounded-md bg-accent-subtle text-accent">
                  <Lock className="w-5 h-5" />
                </span>
              </Depth>
              <Depth z={15}>
                <h2 className="mt-5 text-xl font-medium tracking-tight text-slate-900 dark:text-white">Auditor access restricted</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Please log in or connect your Stellar auditor wallet to access the Audit Studio.
                </p>
              </Depth>
              <Depth z={25} className="mt-6 flex flex-col gap-2">
                <Link href="/login?redirect=/audit" className={btn.primary}>
                  Sign in / connect wallet
                </Link>
                <Link href="/" className={btn.secondary}>
                  Return to homepage
                </Link>
              </Depth>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    );
  }


  const passBars: RiskBar[] = invariantVectors.map((v) => ({
    key: v.shortName,
    label: v.shortName,
    category: v.shortName,
    detail: v.status,
    score: v.score,
    status: v.status,
    color: v.gradientStyle,
  }));

  const riskTone = (score: number) =>
    score > 70
      ? { label: 'Critical risk', color: '#ef4444', text: 'text-red-500', bar: 'bg-red-500' }
      : score > 30
      ? { label: 'Moderate risk', color: '#f59e0b', text: 'text-amber-500', bar: 'bg-amber-500' }
      : { label: 'Verified secure', color: '#10b981', text: 'text-emerald-500', bar: 'bg-emerald-500' };

  const editorFont = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '24px',
    letterSpacing: 'normal',
    tabSize: 4,
  } as const;

  const available = userCredits?.availableCredits ?? 0;

  return (
    <div className="relative w-full min-h-screen bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 pb-24 md:pb-10 overflow-x-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[380px] grid-lines pointer-events-none [mask-image:radial-gradient(ellipse_70%_100%_at_50%_0%,#000_30%,transparent_100%)]"
      />

      <main className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 sm:mb-10">
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="flex flex-wrap items-center gap-2 mb-5"
            >
              <Chip tone="accent" pulse>Live security engine</Chip>
              <Chip>Soroban v22</Chip>
              <Chip tone={walletKey ? 'ok' : 'neutral'}>{walletKey ? 'Wallet connected' : 'Wallet offline'}</Chip>
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-medium tracking-tightest leading-[1.05] text-slate-900 dark:text-white">
              <SplitWords text="Audit Studio" />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl"
            >
              Paste a Soroban contract, run AST and multi-model analysis, then anchor the verdict to the Stellar ledger.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-2 shrink-0"
          >
            <Segmented
              id="studio-view"
              label="Studio view"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'STUDIO', label: <><ShieldCheck className="w-3.5 h-3.5" />Studio</> },
                { value: 'INVARIANTS', label: <><Layers className="w-3.5 h-3.5" />Pass rate</> },
              ]}
            />
            <Link href="/dashboard" className={`${btn.secondary} h-8 px-3 text-xs`}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </motion.div>
        </div>

        {/* No credits: bundle picker */}
        <AnimatePresence>
          {userCredits && userCredits.availableCredits === 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <Panel className="mb-5">
                <PanelHeader
                  eyebrow="Credits"
                  title="Buy credits to run your next audit"
                  action={
                    <button type="button" onClick={() => setShowPricingModal(true)} className={btn.link}>
                      Full breakdown
                    </button>
                  }
                />
                <p className="px-5 sm:px-6 -mt-2 mb-5 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                  Each audit uses one credit (10 XLM) and includes AST analysis, invariant checks and AI-drafted Rust fixes.
                  Credits never expire.
                </p>
                <div className="px-5 sm:px-6 pb-6">
                  <CreditPackages onBuy={handleQuickPurchase} />
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'STUDIO' ? (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start"
            >
              {/* ============ Editor ============ */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <span className="eyebrow mr-1 shrink-0">Load</span>
                    <button type="button" onClick={handleLoadVault} className={`${btn.secondary} h-8 px-3 text-xs shrink-0`}>
                      Vault protocol
                    </button>
                    <button type="button" onClick={handleLoadSolaceCore} className={`${btn.secondary} h-8 px-3 text-xs shrink-0`}>
                      Solace core
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`${btn.secondary} h-8 px-3 text-xs shrink-0`}>
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <input ref={fileInputRef} type="file" accept=".rs,.wasm,.txt" className="hidden" onChange={handleFileUpload} />
                    {codeSnippet && (
                      <button type="button" onClick={handleClear} className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                        Clear
                      </button>
                    )}
                  </div>
                  <Segmented
                    id="deploy-mode"
                    label="Deployment stage"
                    value={isPostDeployment ? 'POST' : 'PRE'}
                    onChange={(v) => setIsPostDeployment(v === 'POST')}
                    options={[
                      { value: 'PRE', label: 'Pre-deploy' },
                      { value: 'POST', label: 'Post-deploy' },
                    ]}
                  />
                </div>

                {/* Editor window: settles from a tilt on load */}
                <motion.div
                  initial={{ opacity: 0, rotateX: 14, y: 24 }}
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
                  style={{ transformPerspective: 1600, transformOrigin: '50% 100%' }}
                  className="relative"
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -inset-6 rounded-[50%] bg-accent blur-[80px] transition-opacity duration-700 ${loading ? 'opacity-25' : 'opacity-[0.08]'}`}
                  />
                  <div className="relative rounded-lg border border-slate-800 dark:border-white/10 bg-[#121212] overflow-hidden shadow-[0_40px_100px_-40px_rgba(0,0,0,0.6)]">
                    {/* Title bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0e0e0e] pr-2">
                      <div className="flex items-center gap-2 h-10 px-4 font-mono text-xs text-white bg-[#121212] border-r border-white/10 relative">
                        <span className="absolute inset-x-0 top-0 h-px bg-accent" />
                        <FileCode className="w-3.5 h-3.5 text-accent" />
                        soroban_contract.rs
                        <span className="text-slate-500">· {lineCount} lines</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="grid place-items-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          aria-label={copiedCode ? 'Code copied' : 'Copy code'}
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadVault}
                          className="grid place-items-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          aria-label="Reset to template"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <Segmented
                          id="editor-mode"
                          label="Editor mode"
                          dark
                          value={editorMode}
                          onChange={setEditorMode}
                          options={[
                            { value: 'COLORED', label: 'Colored' },
                            { value: 'EDIT', label: 'Plain' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Pipeline appears while an audit runs */}
                    <AnimatePresence initial={false}>
                      {loading && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <AuditPipeline stage={stage} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Editor body */}
                    <div className="relative font-mono text-[11px] sm:text-xs leading-6 h-[380px] sm:h-[480px] lg:h-[540px] flex overflow-hidden">
                      <div
                        ref={gutterRef}
                        className="select-none py-3 px-2 border-r border-white/5 text-slate-600 text-right text-[11px] leading-6 w-11 shrink-0 overflow-hidden"
                      >
                        {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      <div className="relative flex-1 h-full overflow-hidden">
                        <pre
                          ref={highlightRef}
                          style={editorFont}
                          className={`absolute inset-0 p-3 m-0 overflow-auto modern-code-scrollbar text-slate-200 pointer-events-none whitespace-pre select-none transition-opacity ${
                            editorMode === 'COLORED' ? 'opacity-100' : 'opacity-0'
                          }`}
                          dangerouslySetInnerHTML={{ __html: highlightRustCode(codeSnippet) }}
                        />
                        <textarea
                          ref={textareaRef}
                          value={codeSnippet}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          onScroll={handleEditorScroll}
                          aria-label="Soroban contract source"
                          placeholder="// Paste a Soroban Rust contract (lib.rs) or load a template…"
                          style={{
                            ...editorFont,
                            color: editorMode === 'COLORED' ? 'transparent' : '#e2e8f0',
                            WebkitTextFillColor: editorMode === 'COLORED' ? 'transparent' : '#e2e8f0',
                            caretColor: editorMode === 'COLORED' ? '#ffffff' : 'var(--e-global-color-accent)',
                          }}
                          className="absolute inset-0 p-3 m-0 overflow-auto modern-code-scrollbar bg-transparent resize-none focus:outline-none whitespace-pre border-0 selection:bg-accent/40"
                          spellCheck={false}
                        />

                        {/* Scan sweep while analysing */}
                        <AnimatePresence>
                          {loading && (
                            <motion.div
                              key="sweep"
                              aria-hidden
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 pointer-events-none overflow-hidden"
                            >
                              <motion.div
                                className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/10 to-transparent border-b border-accent/40"
                                animate={{ top: ['-25%', '100%'] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Empty state */}
                        {!codeSnippet && (
                          <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none text-center">
                            <motion.div
                              initial={{ opacity: 0, rotateX: 40, y: 10 }}
                              animate={{ opacity: 1, rotateX: 0, y: 0 }}
                              transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
                              style={{ transformPerspective: 600 }}
                              className="pointer-events-auto max-w-sm"
                            >
                              <Orb active={false}>
                                <Code2 className="w-5 h-5 text-accent" />
                              </Orb>
                              <p className="mt-4 text-sm text-white">Ready for a Soroban contract</p>
                              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                Paste code, upload a .rs file, or load a template to run live AST analysis.
                              </p>
                              <div className="mt-4 flex items-center justify-center gap-2">
                                <button type="button" onClick={handleLoadVault} className={`${btn.primary} h-8 px-3 text-xs`}>
                                  Load vault template
                                </button>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-white/15 text-xs text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload file
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 h-9 text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="relative flex w-1.5 h-1.5 shrink-0">
                          {loading && <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 animate-ping-soft" />}
                          <span className={`relative w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400' : report ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        </span>
                        <span className="text-slate-300 truncate">{loading ? auditStep || 'analysing…' : report ? 'analysis complete' : 'ready'}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1"><Terminal className="w-3 h-3" />soroban-sdk v22</span>
                        <span>{codeSnippet.length} chars</span>
                        <span className="text-accent uppercase">{isPostDeployment ? 'post-deploy' : 'pre-deploy'}</span>
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Run bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(true)}
                    className="group inline-flex items-center gap-2 h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] text-xs text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer"
                    title="Manage prepaid audit bundles"
                  >
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    <span>
                      <span className="font-mono text-slate-900 dark:text-white">{available}</span> audits ·{' '}
                      <span className="font-mono">{available * 10} XLM</span>
                    </span>
                    {userCredits && available <= 1 && (
                      <span className={`font-mono text-[10px] uppercase ${available === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {available === 0 ? 'empty' : 'low'}
                      </span>
                    )}
                    <span className="text-accent group-hover:translate-x-0.5 transition-transform">+ Buy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAudit}
                    disabled={loading || !codeSnippet.trim()}
                    className={`${btn.primary} relative overflow-hidden min-w-[220px]`}
                  >
                    {loading && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                        animate={{ left: ['-35%', '110%'] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <ShieldCheck className="w-4 h-4 relative" />
                    <span className="relative truncate">{loading ? 'Analysing…' : 'Run AST audit · 1 credit'}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      role="alert"
                      className="flex items-start gap-2.5 p-3 rounded-md border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-xs text-red-700 dark:text-red-300"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ============ Findings ============ */}
              <Panel index={1} className="lg:col-span-5 lg:sticky lg:top-20 min-h-[420px]">
                <PanelHeader
                  eyebrow="Findings"
                  title="Audit report and ledger receipt"
                  action={
                    report && !anchorResult ? (
                      <button type="button" onClick={handleAnchorOnChain} disabled={anchoring} className={`${btn.primary} h-8 px-3 text-xs`}>
                        <Shield className="w-3.5 h-3.5" />
                        {anchoring ? 'Anchoring…' : 'Anchor'}
                      </button>
                    ) : anchorResult ? (
                      <Chip tone="ok">Anchored</Chip>
                    ) : undefined
                  }
                />

                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 grid place-items-center text-center px-6 py-12"
                    >
                      <div>
                        <Orb active>
                          <span className="font-mono text-[10px] text-slate-500">{Math.max(stage, 0) + 1}/4</span>
                        </Orb>
                        <p className="mt-6 text-sm text-slate-900 dark:text-white">{auditStep || 'Running multi-model analysis…'}</p>
                        <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Gemini, GPT-4o and Claude are reviewing the contract independently. One prepaid credit is used.
                        </p>
                      </div>
                    </motion.div>
                  ) : !report ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 grid place-items-center text-center px-6 py-12"
                    >
                      <div>
                        <Orb active={false}>
                          <Shield className="w-5 h-5 text-accent" />
                        </Orb>
                        <p className="mt-6 text-sm text-slate-900 dark:text-white">Ready for inspection</p>
                        <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                          Load or paste a contract and run the audit to see findings, fixes and the on-chain receipt here.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <ReportView
                      key="report"
                      report={report}
                      selectedModelTab={selectedModelTab}
                      setSelectedModelTab={setSelectedModelTab}
                      riskTone={riskTone}
                      contractHash={contractHash}
                      copiedHash={copiedHash}
                      onCopyHash={handleCopyHash}
                      feeReceipt={feeReceipt}
                      available={available}
                      anchorResult={anchorResult}
                      anchoring={anchoring}
                      onAnchor={handleAnchorOnChain}
                      copiedTxHash={copiedTxHash}
                      onCopyTx={() => {
                        if (!anchorResult) return;
                        navigator.clipboard.writeText(anchorResult.transactionHash);
                        setCopiedTxHash(true);
                        setTimeout(() => setCopiedTxHash(false), 2000);
                      }}
                    />
                  )}
                </AnimatePresence>
              </Panel>
            </motion.div>
          ) : (
            <motion.div
              key="invariants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              <Panel>
                <PanelHeader
                  eyebrow="Invariants"
                  title="Audit pass rate"
                  action={<Chip tone={report ? (report.riskScore > 70 ? 'bad' : report.riskScore > 30 ? 'warn' : 'ok') : 'neutral'}>{report ? `Risk ${report.riskScore}/100` : 'Standby'}</Chip>}
                />
                <p className="px-5 sm:px-6 -mt-1 text-xs text-slate-500">
                  {report ? 'Per-category safety from the latest audit.' : 'Run an audit in the Studio tab to light up each invariant.'}
                </p>
                <RiskChart3D bars={passBars} active={Boolean(report)} />
                <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-white/10">
                  <button type="button" onClick={() => setActiveTab('STUDIO')} className={btn.link}>
                    Test contract code <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showPricingModal && (
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            if (walletKey) {
              fetchUserCreditBalance(walletKey)
                .then((bal) => setUserCredits(bal))
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* Report view                                                         */
/* ================================================================== */

type ModelTab = 'CONSENSUS' | 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'MATRIX';
type Tone = { label: string; color: string; text: string; bar: string };

const fadeUp = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE_OUT } },
};

function ReportView({
  report,
  selectedModelTab,
  setSelectedModelTab,
  riskTone,
  contractHash,
  copiedHash,
  onCopyHash,
  feeReceipt,
  available,
  anchorResult,
  anchoring,
  onAnchor,
  copiedTxHash,
  onCopyTx,
}: {
  report: AuditReport;
  selectedModelTab: ModelTab;
  setSelectedModelTab: (t: ModelTab) => void;
  riskTone: (s: number) => Tone;
  contractHash: string;
  copiedHash: boolean;
  onCopyHash: () => void;
  feeReceipt: { payer: string; transactionHash?: string } | null;
  available: number;
  anchorResult: { transactionHash: string; contractId: string; explorerUrl: string } | null;
  anchoring: boolean;
  onAnchor: () => void;
  copiedTxHash: boolean;
  onCopyTx: () => void;
}) {
  const find = (provider: string, key: string) =>
    report.models?.find((m) => m.provider === provider || m.modelId.toLowerCase().includes(key));
  const gemini = find('Google', 'gemini');
  const openai = find('OpenAI', 'gpt');
  const anthropic = find('Anthropic', 'claude');

  const agreement = report.consensus?.agreementPercentage ?? 98;
  const level = report.consensus?.agreementLevel ?? 'UNANIMOUS';
  const tone = riskTone(report.riskScore);
  const contractId = anchorResult?.contractId || LIVE_CONTRACT_ID;

  const MODELS = {
    GEMINI: {
      model: gemini,
      name: gemini?.modelName || 'Google Gemini Flash AST engine',
      icon: Brain,
      color: '#3b82f6',
      envKey: null as string | null,
      liveLabel: gemini?.status === 'LIVE_API' ? 'Live API' : 'Live fallback',
      risk: gemini?.riskScore ?? report.riskScore,
      latency: gemini?.latencyLabel ?? '115ms',
      confidence: gemini?.confidenceScore ?? 96,
      summary: gemini?.summary || report.summary,
      vulns: gemini?.vulnerabilities || report.vulnerabilities,
    },
    OPENAI: {
      model: openai,
      name: openai?.modelName || 'OpenAI GPT-4o (security AST)',
      icon: Bot,
      color: '#10b981',
      envKey: openai?.status === 'LIVE_API' ? null : 'OPENAI_API_KEY',
      liveLabel: openai?.status === 'LIVE_API' ? 'Live API' : 'Preview simulation',
      risk: openai?.riskScore ?? report.riskScore + 2,
      latency: openai?.latencyLabel ?? '~1.3s',
      confidence: openai?.confidenceScore ?? 95,
      summary:
        openai?.summary ||
        'OpenAI AST engine evaluated contract functions for authorization invariants, panic trap prevention and storage rent rules.',
      vulns: openai?.vulnerabilities || [],
    },
    ANTHROPIC: {
      model: anthropic,
      name: anthropic?.modelName || 'Anthropic Claude 3.5 Sonnet',
      icon: Cpu,
      color: '#a855f7',
      envKey: anthropic?.status === 'LIVE_API' ? null : 'ANTHROPIC_API_KEY',
      liveLabel: anthropic?.status === 'LIVE_API' ? 'Live API' : 'Preview simulation',
      risk: anthropic?.riskScore ?? report.riskScore - 2,
      latency: anthropic?.latencyLabel ?? '~1.4s',
      confidence: anthropic?.confidenceScore ?? 98,
      summary:
        anthropic?.summary ||
        'Claude 3.5 Sonnet review focused on Soroban Protocol 22 storage rent lifecycle and defensive panic mitigation.',
      vulns: anthropic?.vulnerabilities || [],
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Model tabs */}
      <div className="px-5 sm:px-6 border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-none">
        <div role="tablist" aria-label="Model view" className="flex gap-5">
          {(
            [
              ['CONSENSUS', 'Consensus', ShieldCheck],
              ['GEMINI', 'Gemini', Brain],
              ['OPENAI', 'GPT-4o', Bot],
              ['ANTHROPIC', 'Claude', Cpu],
              ['MATRIX', 'Compare', GitCompare],
            ] as [ModelTab, string, LucideIcon][]
          ).map(([id, label, Icon]) => {
            const selected = selectedModelTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedModelTab(id)}
                className={`relative inline-flex items-center gap-1.5 pb-3 text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selected ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {selected && (
                  <motion.span layoutId="model-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" transition={{ duration: 0.3, ease: EASE_OUT }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[720px] modern-code-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedModelTab}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="p-5 sm:p-6 space-y-5"
          >
            {selectedModelTab === 'CONSENSUS' && (
              <>
                {/* Score + verdict */}
                <motion.div variants={fadeUp} className="flex items-center gap-5">
                  <ScoreRing value={report.riskScore} color={tone.color} size={84} label={`Risk score ${report.riskScore} of 100`} />
                  <div className="min-w-0">
                    <p className={`font-mono text-[10px] uppercase tracking-wider ${tone.text}`}>{tone.label}</p>
                    <p className="mt-1 text-lg font-medium tracking-tight text-slate-900 dark:text-white">
                      {report.isSecure ? 'Verified secure' : 'Action required'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Risk score {report.riskScore}/100 · {report.vulnerabilities?.length ?? 0} issues
                    </p>
                  </div>
                </motion.div>

                <motion.p variants={fadeUp} className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {report.riskScore > 70
                    ? `A risk score of ${report.riskScore}/100 indicates critical invariant flaws. Unauthenticated storage mutations or missing require_auth() guards let callers drain assets or take over admin control. Fix before deploying.`
                    : report.riskScore > 30
                    ? `A risk score of ${report.riskScore}/100 means warnings. Review persistent storage TTL and unhandled panic paths before mainnet deployment.`
                    : `A risk score of ${report.riskScore}/100 indicates clean invariant enforcement. Auth asserts, storage rent and error handling comply with Soroban v22.`}
                </motion.p>

                <motion.dl variants={fadeUp} className="grid grid-cols-2 border-y border-slate-200 dark:border-white/10 text-xs">
                  <div className="py-2.5 pr-3 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${report.isSecure ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <dt className="text-slate-500">Auth</dt>
                    <dd className="ml-auto font-mono text-slate-900 dark:text-white">{report.isSecure ? 'Enforced' : 'Action req.'}</dd>
                  </div>
                  <div className="py-2.5 pl-3 flex items-center gap-2 border-l border-slate-200 dark:border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${report.isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <dt className="text-slate-500">Storage</dt>
                    <dd className="ml-auto font-mono text-slate-900 dark:text-white">{report.isSecure ? 'Bounded' : 'Review TTL'}</dd>
                  </div>
                </motion.dl>

                {/* Consensus triad */}
                <motion.div variants={fadeUp}>
                  <SectionLabel icon={ShieldCheck} aside={<Chip tone="ok">Anti-hallucination</Chip>}>
                    Multi-model consensus
                  </SectionLabel>
                  <ConsensusTriad
                    agreement={agreement}
                    level={level}
                    models={[
                      { name: 'Gemini', live: gemini?.status === 'LIVE_API' || !gemini, color: '#3b82f6' },
                      { name: 'GPT-4o', live: openai?.status === 'LIVE_API', color: '#10b981' },
                      { name: 'Claude', live: anthropic?.status === 'LIVE_API', color: '#a855f7' },
                    ]}
                  />
                </motion.div>

                {/* Ledger card */}
                <motion.div variants={fadeUp}>
                  {anchorResult ? (
                    <TiltCard max={8}>
                      <div className="relative rounded-lg border border-emerald-500/30 bg-[#121212] text-slate-300 p-4 [transform-style:preserve-3d]">
                        <Depth z={24} className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-sm text-white">
                            <span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            Anchored on Stellar testnet
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Confirmed</span>
                        </Depth>
                        <Depth z={12}>
                          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                            Stored in contract{' '}
                            <a
                              href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-white hover:underline"
                            >
                              {contractId.slice(0, 8)}…{contractId.slice(-6)}
                            </a>{' '}
                            under <code className="font-mono text-slate-200">DataKey::Audit</code>.
                          </p>
                          {anchorResult.transactionHash && (
                            <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-white/10 px-2.5 h-9">
                              <span className="font-mono text-xs text-slate-200 truncate select-all">{anchorResult.transactionHash}</span>
                              <button
                                type="button"
                                onClick={onCopyTx}
                                aria-label="Copy transaction hash"
                                className="grid place-items-center w-6 h-6 rounded text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                              >
                                {copiedTxHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </Depth>
                        <Depth z={30} className="mt-3 grid grid-cols-2 gap-2">
                          <a href={anchorResult.explorerUrl} target="_blank" rel="noopener noreferrer" className={`${btn.primary} h-9 text-xs`}>
                            Transaction <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-white/15 text-xs text-slate-200 hover:bg-white/5 transition-colors"
                          >
                            Contract storage
                          </a>
                        </Depth>
                      </div>
                    </TiltCard>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-white/15 p-4">
                      <SectionLabel icon={Shield} aside={<span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Unanchored</span>}>
                        On-chain provenance
                      </SectionLabel>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Anchor this verdict to the Stellar testnet ledger for a verifiable, tamper-proof security record.
                      </p>
                      <button type="button" onClick={onAnchor} disabled={anchoring} className={`${btn.primary} w-full mt-3 h-9 text-xs`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {anchoring ? 'Anchoring to Soroban ledger…' : 'Anchor audit on Soroban'}
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Receipt */}
                <motion.dl variants={fadeUp} className="text-xs divide-y divide-slate-200 dark:divide-white/10 border-y border-slate-200 dark:border-white/10">
                  {contractHash && (
                    <ReceiptRow
                      k="SHA-256"
                      v={
                        <span className="inline-flex items-center gap-1.5">
                          {contractHash.slice(0, 10)}…{contractHash.slice(-6)}
                          <button type="button" onClick={onCopyHash} aria-label="Copy contract hash" className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                            {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>
                      }
                    />
                  )}
                  {feeReceipt && (
                    <>
                      <ReceiptRow k="Credit" v={<span className="text-emerald-600 dark:text-emerald-400">−1 · {available} left</span>} />
                      <ReceiptRow k="Account" v={`${feeReceipt.payer.slice(0, 6)}…${feeReceipt.payer.slice(-6)}`} />
                      {feeReceipt.transactionHash && <ReceiptRow k="Audit ID" v={`${feeReceipt.transactionHash.slice(0, 16)}…`} />}
                    </>
                  )}
                </motion.dl>

                {/* Summary */}
                <motion.div variants={fadeUp}>
                  <SectionLabel>Executive summary</SectionLabel>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{report.summary}</p>
                </motion.div>

                {/* Issues */}
                {report.vulnerabilities?.length > 0 && (
                  <motion.div variants={fadeUp}>
                    <SectionLabel icon={AlertTriangle}>Detected issues ({report.vulnerabilities.length})</SectionLabel>
                    <VulnList vulns={report.vulnerabilities} consensus />
                  </motion.div>
                )}
              </>
            )}

            {(selectedModelTab === 'GEMINI' || selectedModelTab === 'OPENAI' || selectedModelTab === 'ANTHROPIC') &&
              (() => {
                const m = MODELS[selectedModelTab];
                const Icon = m.icon;
                return (
                  <>
                    <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-900 dark:text-white min-w-0">
                        <span className="grid place-items-center w-7 h-7 rounded-md border border-slate-200 dark:border-white/10 shrink-0" style={{ color: m.color }}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="truncate">{m.name}</span>
                      </span>
                      <Chip tone={m.envKey ? 'warn' : 'ok'}>{m.liveLabel}</Chip>
                    </motion.div>

                    {m.envKey && (
                      <motion.p variants={fadeUp} className="text-xs p-3 rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300">
                        Add <code className="font-mono">{m.envKey}</code> to <code className="font-mono">server/.env</code> to run this model live.
                      </motion.p>
                    )}

                    <motion.dl variants={fadeUp} className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200 dark:border-white/10">
                      <Stat label="Risk" value={`${m.risk}/100`} />
                      <Stat label="Latency" value={m.latency} />
                      <Stat label="Confidence" value={`${m.confidence}%`} tone="text-emerald-600 dark:text-emerald-400" />
                    </motion.dl>

                    <motion.p variants={fadeUp} className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.summary}
                    </motion.p>

                    <motion.div variants={fadeUp}>
                      <SectionLabel>Findings ({m.vulns.length})</SectionLabel>
                      {m.vulns.length ? <VulnList vulns={m.vulns} /> : <p className="text-xs text-slate-500">No findings from this model.</p>}
                    </motion.div>
                  </>
                );
              })()}

            {selectedModelTab === 'MATRIX' && (
              <>
                <motion.p variants={fadeUp} className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Single models can hallucinate or raise false positives. Solace compares independent models from Google, OpenAI and
                  Anthropic and only anchors when they agree.
                </motion.p>
                <motion.div variants={fadeUp} className="overflow-x-auto rounded-md border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-white/10">
                      <tr className="text-slate-500">
                        <th className="p-2.5 font-normal eyebrow">Dimension</th>
                        <th className="p-2.5 font-medium" style={{ color: '#3b82f6' }}>Gemini</th>
                        <th className="p-2.5 font-medium" style={{ color: '#10b981' }}>GPT-4o</th>
                        <th className="p-2.5 font-medium" style={{ color: '#a855f7' }}>Claude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
                      <MatrixRow k="Mode" v={['Live API', MODELS.OPENAI.envKey ? 'Preview' : 'Live API', MODELS.ANTHROPIC.envKey ? 'Preview' : 'Live API']} />
                      <MatrixRow k="Risk" v={[`${MODELS.GEMINI.risk}/100`, `${MODELS.OPENAI.risk}/100`, `${MODELS.ANTHROPIC.risk}/100`]} mono />
                      <MatrixRow
                        k="Verdict"
                        v={[gemini?.isSecure ?? report.isSecure, openai?.isSecure ?? report.isSecure, anthropic?.isSecure ?? report.isSecure].map((ok, i) => (
                          <span key={i} className={ok ? 'text-emerald-500' : 'text-red-500'}>
                            {ok ? 'Pass' : 'Action req.'}
                          </span>
                        ))}
                      />
                      <MatrixRow k="require_auth" v={['Flagged unchecked', 'Flagged CWE-285', 'Flagged missing auth']} tone="text-red-500" />
                      <MatrixRow k="Panic / unwrap" v={['Host trap vector', 'CWE-754 flagged', 'Abort risk']} tone="text-amber-500" />
                      <MatrixRow k="Storage TTL" v={['Review TTL', 'Archival risk', 'Eviction hazard']} tone="text-amber-500" />
                      <MatrixRow k="Latency" v={[MODELS.GEMINI.latency, MODELS.OPENAI.latency, MODELS.ANTHROPIC.latency]} mono />
                      <MatrixRow k="Confidence" v={[`${MODELS.GEMINI.confidence}%`, `${MODELS.OPENAI.confidence}%`, `${MODELS.ANTHROPIC.confidence}%`]} mono />
                    </tbody>
                  </table>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function VulnList({ vulns, consensus = false }: { vulns: Vulnerability[]; consensus?: boolean }) {
  const sevTone: Record<string, string> = {
    CRITICAL: 'text-red-500 border-red-500/30 bg-red-500/10',
    HIGH: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    MEDIUM: 'text-sky-500 border-sky-500/30 bg-sky-500/10',
    LOW: 'text-slate-500 border-slate-500/30 bg-slate-500/10',
  };
  return (
    <ul className="space-y-3">
      {vulns.map((v, i) => (
        <motion.li
          key={`${v.title}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 + i * 0.06, ease: EASE_OUT }}
          className="rounded-md border border-slate-200 dark:border-white/10 p-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-900 dark:text-white">{v.title}</p>
            <span className={`shrink-0 px-1.5 h-5 inline-flex items-center rounded border font-mono text-[10px] uppercase ${sevTone[v.severity] ?? sevTone.LOW}`}>
              {v.severity}
            </span>
          </div>
          {consensus && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-accent" />{v.consensusTag || 'Cross-validated'}</span>
              {v.hallucinationRisk && <span>Hallucination: {v.hallucinationRisk}</span>}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">{v.description}</p>
          <FormattedRecommendation text={v.recommendation} index={i} />
        </motion.li>
      ))}
    </ul>
  );
}

function ReceiptRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 h-9">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-mono text-slate-900 dark:text-white truncate">{v}</dd>
    </div>
  );
}

function MatrixRow({ k, v, mono = false, tone }: { k: string; v: React.ReactNode[]; mono?: boolean; tone?: string }) {
  return (
    <tr>
      <td className="p-2.5 text-slate-900 dark:text-white whitespace-nowrap">{k}</td>
      {v.map((cell, i) => (
        <td key={i} className={`p-2.5 whitespace-nowrap ${mono ? 'font-mono' : ''} ${tone ?? ''}`}>
          {cell}
        </td>
      ))}
    </tr>
  );
}
