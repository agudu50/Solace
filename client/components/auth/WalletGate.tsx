'use client';
import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ExternalLink,
  Layers,
  Activity,
  FileCheck2,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { connectWallet, detectWalletNetwork } from '../../utils/solaceService';

interface WalletGateProps {
  children: React.ReactNode;
  pageTitle?: string;
  description?: string;
}

export default function WalletGate({ children, pageTitle, description }: WalletGateProps) {
  const [walletKey, setWalletKey] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  useEffect(() => {
    // Check initial wallet state
    try {
      const storedWallet = localStorage.getItem('solace_connected_wallet');
      if (storedWallet) {
        setWalletKey(storedWallet);
      }
      const storedNet = localStorage.getItem('solace-network');
      if (storedNet === 'mainnet' || storedNet === 'testnet') {
        setNetwork(storedNet);
      }
    } catch (_) {}

    // Check system-determined network from wallet
    detectWalletNetwork().then((net) => {
      setNetwork(net);
      try {
        localStorage.setItem('solace-network', net);
      } catch (_) {}
    });

    setChecking(false);

    const handleWalletUpdate = (e: any) => {
      const key = e.detail?.walletKey ?? localStorage.getItem('solace_connected_wallet') ?? '';
      setWalletKey(key);
    };

    const handleNetworkUpdate = (e: any) => {
      const net = e.detail?.network ?? localStorage.getItem('solace-network') ?? 'testnet';
      if (net === 'mainnet' || net === 'testnet') {
        setNetwork(net);
      }
    };

    window.addEventListener('solace-wallet-updated', handleWalletUpdate);
    window.addEventListener('solace-network-updated', handleNetworkUpdate);
    window.addEventListener('focus', () => {
      try {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored) setWalletKey(stored);
      } catch (_) {}
    });

    return () => {
      window.removeEventListener('solace-wallet-updated', handleWalletUpdate);
      window.removeEventListener('solace-network-updated', handleNetworkUpdate);
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg('');
    try {
      const key = await connectWallet();
      setWalletKey(key);
      try {
        localStorage.setItem('solace_connected_wallet', key);
        window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: key } }));
      } catch (_) {}
    } catch (err: any) {
      const msg = err?.message || 'Connection failed.';
      if (msg === 'FREIGHTER_NOT_INSTALLED') {
        setErrorMsg('Freighter wallet extension is not installed. Please install it from freighter.app.');
        window.open('https://www.freighter.app/', '_blank');
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setErrorMsg('Wallet authorization was cancelled. Please approve connection to proceed.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setConnecting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // If wallet is connected, reveal the page content
  if (walletKey) {
    return <>{children}</>;
  }

  // When not connected, render the enhanced modern security lock screen
  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-14 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="max-w-2xl w-full bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/90 dark:border-slate-800/90 text-center relative overflow-hidden transition-all duration-300">
        {/* Top glowing cyber accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-90" />

        {/* Floating cyber lock & shield badge */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center">
          {/* Animated concentric orbit */}
          <div className="absolute inset-0 rounded-3xl border border-accent/25 dark:border-accent/35 animate-[spin_12s_linear_infinite]" />
          <div className="absolute inset-1.5 rounded-2xl border border-dashed border-accent/20 dark:border-accent/30" />
          
          {/* Central Shield Box */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent/20 via-accent-subtle to-accent/10 border border-accent/40 flex items-center justify-center shadow-lg shadow-accent/20 group">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-accent transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-white dark:border-[#111726]" />
          </div>
        </div>

        {/* System Determined Network & Security Header Badges */}
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Auditor Authentication Guard</span>
          </span>
          <span
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shadow-xs ${
              network === 'mainnet'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
              }`}
            />
            <span>Stellar {network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Protocol 22)'}</span>
          </span>
        </div>

        {/* Page Title & Context */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2.5">
          {pageTitle ? `${pageTitle}: Connect Wallet` : 'Auditor Authentication Required'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed mb-7">
          {description ||
            'Connect your authorized Stellar / Soroban auditor keypair (Freighter wallet) to inspect verified smart contract audit proofs, real-time AST threat telemetry, and cryptographic ledger seals.'}
        </p>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2.5 text-left shadow-sm">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Button (Brand Accent #C80552, never black) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full sm:w-auto px-8 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-full font-bold text-sm shadow-xl shadow-accent/30 hover:shadow-accent/40 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wallet className="w-4 h-4" />
            <span>{connecting ? 'Connecting Freighter...' : 'Connect Auditor Wallet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/80"
          >
            <span>Get Freighter Wallet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Non-custodial verification badges */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-8 flex-wrap">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Non-Custodial</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Zero Key Exposure</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Official Freighter API</span>
          </span>
        </div>

        {/* Protected Features Grid */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 text-left">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Protected Platform Capabilities
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/20">
              Soroban Protocol v22
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Capability 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-accent/40 dark:hover:border-accent/40 transition group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                    Static AST Threat Engine
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Detects auth bypass &amp; host panics
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                    Real-Time Rent Telemetry
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Live storage TTL tracking &amp; alerts
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                    On-Chain Inscriptions
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Tamper-proof Soroban ledger proofs
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                    AI Security Remediation
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Instant syntax-highlighted Rust fixes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
