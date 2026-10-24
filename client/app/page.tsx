'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Wallet,
  Activity,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import InteractiveScanner from '../components/landing/InteractiveScanner';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ArchitectureSection from '../components/landing/ArchitectureSection';
import AuditStudioSection from '../components/landing/AuditStudioSection';
import ReportsSection from '../components/landing/ReportsSection';
import FaqSection from '../components/landing/FaqSection';
import CtaSection from '../components/landing/CtaSection';
import { useWallet } from '../context/WalletContext';

export default function LandingPage() {
  const { walletKey, network } = useWallet();
  const [activeAuditsCount, setActiveAuditsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('solace_audit_history');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          setActiveAuditsCount(parsed.length);
        }
      }
    } catch (_) {}
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 transition-colors selection:bg-accent selection:text-white overflow-x-hidden">
      {/* Connected Auditor Session Quick-Bar (Shown when wallet is authenticated) */}
      {walletKey && (
        <aside
          aria-label="Auditor Session Notice"
          className="w-full bg-accent text-white py-2 px-4 text-xs font-semibold shadow-inner"
        >
          <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Auditor Session Active: <span className="font-mono font-bold">{walletKey.slice(0, 6)}...{walletKey.slice(-6)}</span>
              </span>
              <span className="opacity-60 hidden sm:inline">|</span>
              <span className="hidden sm:inline opacity-90">
                Stellar {network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Protocol 22)'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-3 py-1 rounded-full bg-white text-accent hover:bg-slate-100 font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Go to Auditor Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* 1. Visually Rich 3D Hero Section */}
      <HeroSection />

      {/* 2. Genuine Technical Protocol Metrics */}
      <StatsSection />

      {/* 3. Core Architecture & Invariant Features (#features) */}
      <FeaturesSection />

      {/* 4. Interactive Live AST Simulator (#scanner) */}
      <InteractiveScanner />

      {/* 5. 3-Step Pipeline: How Solace Works (#how-it-works) */}
      <HowItWorksSection />

      {/* 6. On-Chain Cryptographic Provenance Model (#architecture) */}
      <ArchitectureSection />

      {/* 7. On-Page Security Audit Studio (#audit) */}
      <AuditStudioSection />

      {/* 8. On-Chain Verified Ledger Reports (#reports) */}
      <ReportsSection />

      {/* 9. Frequently Asked Questions (#faq) */}
      <FaqSection />

      {/* 10. Final Call-to-Action Section */}
      <CtaSection />
    </div>
  );
}
