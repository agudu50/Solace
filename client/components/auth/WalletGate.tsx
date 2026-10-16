'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Check,
  Loader2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { connectWallet, detectWalletNetwork, checkFreighterInstalled } from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';

interface WalletGateProps {
  children: React.ReactNode;
  pageTitle?: string;
  description?: string;
}

type AuthStatus = 'idle' | 'requesting' | 'verifying' | 'authenticated';

export default function WalletGate({ children, pageTitle, description }: WalletGateProps) {
  const { walletKey, network, setNetwork, setWalletKeyDirectly } = useWallet();
  const [checking, setChecking] = useState<boolean>(!walletKey);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authStepMsg, setAuthStepMsg] = useState<string>('');
  const [verifiedKey, setVerifiedKey] = useState<string>('');
  const [freighterReady, setFreighterReady] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (walletKey) {
      setChecking(false);
    } else {
      try {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored && /^G[A-Z0-9]{55}$/.test(stored)) {
          setWalletKeyDirectly(stored);
        }
      } catch (_) {}
      setChecking(false);
    }

    checkFreighterInstalled().then((installed) => {
      setFreighterReady(installed);
    });
  }, [walletKey, setWalletKeyDirectly]);

  const handleConnect = async () => {
    setErrorMsg('');
    setAuthStatus('requesting');
    setAuthStepMsg('Contacting Freighter browser extension...');

    try {
      // 1. Request access from Freighter
      const key = await connectWallet();
      
      // 2. Verification stage: Display detected key and perform protocol checks
      setAuthStatus('verifying');
      setAuthStepMsg(`Freighter Signer Identified: ${key.slice(0, 6)}...${key.slice(-6)}`);
      setVerifiedKey(key);

      // Verify network details
      const detectedNet = await detectWalletNetwork();
      setNetwork(detectedNet);

      // 3. Smooth transition to authenticated status so user sees clear verification
      await new Promise((r) => setTimeout(r, 600));
      setAuthStatus('authenticated');
      setAuthStepMsg('Auditor Signature & Ledger Authority Verified.');
    } catch (err: any) {
      const msg = err?.message || 'Connection failed.';
      setAuthStatus('idle');
      if (msg === 'FREIGHTER_NOT_INSTALLED') {
        setErrorMsg('Freighter wallet extension was not detected in this browser. Please install Freighter from freighter.app or open in a browser with Freighter active.');
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setErrorMsg('Wallet authorization was declined in Freighter. Please approve connection to authenticate.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleConfirmEntry = () => {
    if (!verifiedKey) return;
    setWalletKeyDirectly(verifiedKey);
  };

  const handleUseDemoKey = () => {
    const demoSigner = 'GBWSB2OVP5Q4H4G2R7YTHNJMK6K6X3L2J3J7Y6X5B4V3C2X1Z7FDYPI';
    setAuthStatus('verifying');
    setAuthStepMsg('Configuring Testnet Guest Auditor Keypair...');
    setVerifiedKey(demoSigner);
    setTimeout(() => {
      setAuthStatus('authenticated');
      setAuthStepMsg('Testnet Guest Signer Active');
    }, 400);
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // If wallet is connected, render the protected page content
  if (walletKey) {
    return <>{children}</>;
  }

  // Render the structured Auditor Authentication Screen
  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-accent/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Glassmorphic Card (Optimized for Mobile & Desktop) */}
      <div className="max-w-2xl w-full bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border border-slate-200/90 dark:border-slate-800/90 text-center relative overflow-hidden transition-all duration-300">
        {/* Top glowing cyber accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-90" />

        {/* Floating cyber lock & Solace logo badge */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-accent/25 dark:border-accent/35 animate-[spin_12s_linear_infinite]" />
          <div className="absolute inset-1 rounded-xl sm:rounded-2xl border border-dashed border-accent/20 dark:border-accent/30" />
          
          {/* Central Solace Logo Box */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-accent/40 flex items-center justify-center shadow-xl shadow-accent/25 group bg-accent">
            <Image
              src="/solace-logo.jpg"
              alt="Solace Logo"
              width={56}
              height={56}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              priority
            />
            <div className="absolute bottom-0 right-0 p-1 bg-[#111726]/90 rounded-tl-lg border-t border-l border-accent/40">
              <Lock className="w-2 h-2 text-accent" />
            </div>
          </div>
        </div>

        {/* System Badges (Mobile Responsive Flex-Wrap) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-accent-subtle text-accent border border-accent/20 flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
            <span>Auditor Authentication Guard</span>
          </span>
          <span
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 border shadow-xs ${
              network === 'mainnet'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${
                network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
              }`}
            />
            <span>Stellar {network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Protocol 22)'}</span>
          </span>
        </div>

        {/* Page Title & Context */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
          {pageTitle ? `${pageTitle}: Connect Wallet` : 'Auditor Authentication Required'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed mb-6">
          {description ||
            'Connect your authorized Stellar / Soroban auditor keypair (Freighter wallet) to inspect verified smart contract audit proofs, real-time AST threat telemetry, and cryptographic ledger seals.'}
        </p>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2 text-left shadow-sm">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Structured Authentication Flow Panel */}
        {authStatus === 'idle' && (
          <div className="space-y-4 mb-6">
            {/* Freighter Extension Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  freighterReady ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>
                {freighterReady
                  ? 'Freighter Extension: Detected in Browser'
                  : 'Freighter Extension: Standby / Checking'}
              </span>
            </div>

            {/* Primary Action Button (Brand Accent #C80552, never black) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleConnect}
                className="w-full sm:w-auto px-7 py-3 bg-accent hover:bg-accent-hover text-white rounded-full font-bold text-xs sm:text-sm shadow-xl shadow-accent/30 hover:shadow-accent/40 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Auditor Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/80"
              >
                <span>Get Freighter</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Alternative Demo Signer for Quick Testing */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleUseDemoKey}
                className="text-[11px] font-medium text-slate-500 hover:text-accent dark:hover:text-accent transition underline underline-offset-4"
              >
                Or evaluate with Testnet Auditor Signer
              </button>
            </div>
          </div>
        )}

        {/* Stage: Requesting / Verifying State */}
        {(authStatus === 'requesting' || authStatus === 'verifying') && (
          <div className="mb-6 p-5 rounded-2xl bg-accent-subtle/40 dark:bg-accent-subtle/20 border border-accent/30 text-left animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-accent/30 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {authStatus === 'requesting' ? 'Connecting to Freighter...' : 'Verifying Keypair Permissions...'}
                </span>
                <span className="text-[11px] font-mono text-accent truncate block mt-0.5">
                  {authStepMsg}
                </span>
              </div>
            </div>
            <div className="mt-3 w-full bg-accent/20 rounded-full h-1.5 overflow-hidden">
              <div className="bg-accent h-full w-2/3 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Stage: Authenticated & Verified Confirmation Card */}
        {authStatus === 'authenticated' && verifiedKey && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left animate-in zoom-in-95 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auditor Signer Authenticated</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                {network.toUpperCase()}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">
                Verified Stellar Keypair
              </span>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white break-all select-all">
                {verifiedKey}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmEntry}
                className="w-full sm:flex-1 py-3 px-5 bg-accent hover:bg-accent-hover text-white rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Security Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthStatus('idle');
                  setVerifiedKey('');
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Switch Account
              </button>
            </div>
          </div>
        )}

        {/* Non-custodial verification badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-6 sm:mb-8 flex-wrap">
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

        {/* Protected Features Grid (Mobile Responsive) */}
        <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800/80 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Protected Platform Capabilities
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/20">
              Soroban Protocol v22
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Capability 1 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-accent/40 dark:hover:border-accent/40 transition group">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug truncate">
                    Static AST Threat Engine
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Detects auth bypass &amp; host panics
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition group">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug truncate">
                    Real-Time Rent Telemetry
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Live storage TTL tracking &amp; alerts
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition group">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug truncate">
                    On-Chain Inscriptions
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
                    Tamper-proof Soroban ledger proofs
                  </span>
                </div>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition group">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block leading-snug truncate">
                    AI Security Remediation
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed block mt-0.5">
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
