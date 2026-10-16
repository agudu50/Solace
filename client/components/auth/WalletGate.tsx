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

  // When not connected, render the security lock screen
  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-2xl w-full bg-white dark:bg-[#111726] rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90 dark:border-slate-800 text-center relative overflow-hidden transition-all duration-300">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Lock Icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-accent-subtle text-accent border border-accent/25 flex items-center justify-center shadow-lg shadow-accent/15 mb-6 group">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-accent transition transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-ping" />
        </div>

        {/* System Determined Network & Security Header */}
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Auditor Authentication Guard</span>
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
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

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
          {pageTitle ? `${pageTitle}: Connect Wallet` : 'Auditor Wallet Connection Required'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed mb-6">
          {description ||
            'To access Solace security scoring, live Soroban rent monitoring, and verified ledger records, connect your authorized Stellar / Soroban auditor keypair (Freighter wallet).'}
        </p>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full sm:w-auto px-8 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-full font-bold text-sm shadow-xl shadow-accent/25 transition disabled:opacity-50 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>{connecting ? 'Connecting Freighter...' : 'Connect Auditor Wallet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Get Freighter Wallet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Protected Features Checklist */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3 text-center sm:text-left">
            Protected Platform Capabilities
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Static AST Threat Engine</span>
                <span className="text-[11px] text-slate-500">Detects auth bypass &amp; host panics</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Real-Time Rent Telemetry</span>
                <span className="text-[11px] text-slate-500">Live storage TTL tracking &amp; alerts</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">On-Chain Inscriptions</span>
                <span className="text-[11px] text-slate-500">Tamper-proof Soroban ledger proofs</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">AI Security Remediation</span>
                <span className="text-[11px] text-slate-500">Instant syntax-highlighted Rust fixes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
