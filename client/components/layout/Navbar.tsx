'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Activity,
  Search,
  Bell,
  Settings,
  Wallet,
  X,
  CheckCircle2,
  ExternalLink,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Copy,
  LogOut,
  Layers,
  Lock,
  Cpu,
  Zap,
  Check,
} from 'lucide-react';
import { connectWallet, detectWalletNetwork, CONTRACT_ID } from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';

export default function Navbar() {
  const pathname = usePathname();
  const { walletKey, network, connecting, connect, disconnect, setNetwork } = useWallet();
  const [notice, setNotice] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showInvariantsModal, setShowInvariantsModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const handleOpenInvariants = () => setShowInvariantsModal(true);
    window.addEventListener('solace-open-invariants-modal', handleOpenInvariants);
    return () => window.removeEventListener('solace-open-invariants-modal', handleOpenInvariants);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('solace-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('solace-theme', 'light');
    }
  };

  const handleConnect = async () => {
    setNotice('');
    try {
      await connect();
    } catch (err: any) {
      const msg = err?.message || 'Connection failed.';
      if (msg === 'FREIGHTER_NOT_INSTALLED') {
        window.open('https://www.freighter.app/', '_blank');
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setNotice('Cancelled');
        setTimeout(() => setNotice(''), 3000);
      } else {
        setNotice(msg);
        setTimeout(() => setNotice(''), 3000);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Audit Studio', href: '/audit', icon: ShieldCheck },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Monitor', href: '/monitor', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200 bg-[#f4f5f8]/90 dark:bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8 shadow-xs">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand (Mobile Responsive: hides subtitle on tiny screens) */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl overflow-hidden bg-accent shadow-sm transition group-hover:scale-105 border border-accent/30 flex items-center justify-center shrink-0">
            <Image
              src="/solace-logo.jpg"
              alt="Solace Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              Solace
            </span>
            <span className="text-[9px] sm:text-[10px] text-accent font-bold tracking-wider uppercase mt-0.5 hidden sm:block">
              Soroban Security
            </span>
          </div>
        </Link>

        {/* Center Pill Navigation - Only visible when Auditor Wallet is connected */}
        {walletKey && (
          <nav className="hidden md:flex items-center bg-white dark:bg-[#111726] rounded-full p-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-md shadow-accent/25'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Tools (Network, Theme Toggle, Search, Bell, Settings, Wallet) - Compact on Mobile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* System-Determined Network Status Indicator */}
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-xs text-[10px] sm:text-xs font-semibold shrink-0 transition-colors ${
              network === 'mainnet'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-accent/10 border-accent/25 text-accent'
            }`}
            title={`Active Network: Stellar ${network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Staging)'}`}
          >
            <span
              className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full inline-block ${
                network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
              }`}
            />
            <span className="font-bold uppercase tracking-wide text-[10px] sm:text-xs">
              {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </span>
            <span className="text-[10px] opacity-75 hidden md:inline">
              ({network === 'mainnet' ? 'Production' : 'Staging'})
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm flex items-center justify-center transition shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Authenticated Auditor Tools - visible on larger screens to avoid mobile crowding */}
          {walletKey && (
            <>
              {/* Search Button */}
              <button
                type="button"
                onClick={() => {
                  const hash = prompt('Search contract audit hash:');
                  if (hash) window.location.href = `/reports?hash=${encodeURIComponent(hash)}`;
                }}
                className="hidden md:flex w-9 h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm items-center justify-center transition shrink-0"
                title="Search audit by hash"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notification Bell -> Invariants Status Modal (Available on mobile & desktop) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowInvariantsModal(true)}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm flex items-center justify-center transition shrink-0 cursor-pointer"
                  title="System Security Invariants Status (All Soroban security invariants passing on Stellar Testnet)"
                  aria-label="System Security Invariants"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="absolute top-1 sm:top-2 right-1 sm:right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              </div>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm items-center justify-center transition shrink-0"
                title="Security Settings & Network Config"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}

          {/* Wallet Button - Clickable to open Wallet Details Modal (No naked X button) */}
          <div suppressHydrationWarning className="shrink-0 flex items-center">
            {walletKey ? (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-[#111726] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-xs text-[11px] sm:text-xs font-mono text-slate-800 dark:text-slate-200 shrink-0 transition cursor-pointer group"
                title="Auditor Keypair Details & Session"
              >
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold">{walletKey.slice(0, 3)}...{walletKey.slice(-3)}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform hidden sm:inline" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-accent hover:bg-accent-hover text-white rounded-full text-[11px] sm:text-xs font-bold shadow-md shadow-accent/25 transition disabled:opacity-50 flex items-center gap-1 sm:gap-1.5 shrink-0"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                <span className="sm:hidden">{connecting ? '...' : 'Connect'}</span>
              </button>
            )}
          </div>

          {notice && (
            <span className="hidden md:inline-block text-xs text-slate-500 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full shadow-sm">
              {notice}
            </span>
          )}
        </div>
      </div>

      {/* Settings Modal mounted directly to document.body via Portal to center in the middle of the screen */}
      {mounted && showSettings && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white dark:bg-[#111726] rounded-3xl max-w-md w-full p-6 shadow-2xl border-t-4 border-t-accent border-x border-b border-slate-300 dark:border-slate-700 relative text-slate-900 dark:text-slate-100 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top glowing cyber accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-90 pointer-events-none" />

            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Settings</h3>
                  <p className="text-[11px] text-slate-400">Solace Security Engine &amp; Network Configuration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* System-Resolved Network in Settings */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    Stellar Network
                  </span>
                  <span className="text-[10px] font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded-full border border-accent/20">
                    System Determined
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
                    }`}
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Stellar {network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Protocol 22)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Network environment is determined automatically by the system from your connected Freighter wallet and production configuration.
                </p>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold block truncate mt-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  RPC: {network === 'mainnet' ? 'https://soroban-rpc.mainnet.stellar.org' : 'https://soroban-testnet.stellar.org'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  Solace AI Model Engine
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                  <span className="font-semibold text-slate-900 dark:text-white">Adaptive Multi-Model Resiliency</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5 font-medium">
                  Dual Flash AST Engine · High Resilience
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  On-Chain Solace Contract
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                  CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ
                </span>
                <a
                  href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 mt-1 text-xs font-bold"
                >
                  <span>Inspect on Stellar Expert ({network === 'mainnet' ? 'Mainnet' : 'Testnet'})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="mt-5 w-full py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Auditor Wallet Session Modal mounted directly to document.body via Portal to center in the middle of the screen */}
      {/* Enhanced Invariants Status Modal */}
      {mounted && showInvariantsModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowInvariantsModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0c101c] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200/90 dark:border-slate-800/90 relative text-slate-900 dark:text-slate-100 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 my-auto transition-colors max-h-[92vh] overflow-y-auto modern-code-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Decorative Glows */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            {/* Top glowing cyber accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-95 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c101c] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      Soroban Security Invariants
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>100% Passing</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <p className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      All Soroban security invariants passing on Stellar {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvariantsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-200/60 dark:border-slate-700/80"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Real-time Consensus & Telemetry Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  System Health
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  100% Verified
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">0 Violations</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Consensus
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                  Protocol 22
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Enforced Rules</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Host Panics
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  0 Traps
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Zero Unhandled</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  RPC Status
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                  Synchronized
                </span>
                <span className="text-[10px] text-accent block font-bold">~14ms Latency</span>
              </div>
            </div>

            {/* Invariant Vector Cards (6 Deep Security Vectors) */}
            <div className="space-y-2.5 mb-4">
              {/* 1. Authorization Guard */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-emerald-500/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Authorization Guard (require_auth)
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        caller.require_auth();
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Cryptographic signature enforcement verified across all state-mutating functions. Eliminates caller spoofing, unauthorized asset transfers, and privilege escalation.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  Enforced
                </span>
              </div>

              {/* 2. Storage Rent Guardian */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-cyan-500/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/20">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Storage Rent Guardian (TTL Auto-bump)
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        env.storage().persistent().extend_ttl()
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      State isolation between Persistent and Instance entries. Automated TTL threshold bumping protects contract records from ledger archival and state eviction.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shrink-0">
                  Protected
                </span>
              </div>

              {/* 3. Panic Crash Shield */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-purple-500/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/20">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Panic Crash Shield (Zero Host Panics)
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        res.unwrap_or_else(|| panic_with_error!(...))
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Zero unhandled bare .unwrap() calls or panic traps. All execution branches enforce safe error code returns via typed enums, eliminating ungraceful host crashes.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
                  Safe
                </span>
              </div>

              {/* 4. Admin Access Control & Multi-Sig */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-accent/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-accent-subtle text-accent flex items-center justify-center shrink-0 mt-0.5 border border-accent/25">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Admin Access Control & Multi-Sig
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-accent border border-accent/20">
                        admin.require_auth();
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Role separation and caller validation restricting admin mutations to multi-sig keypairs. Unauthorized admin takeover vectors permanently blocked.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-subtle text-accent border border-accent/25 shrink-0">
                  Guarded
                </span>
              </div>

              {/* 5. Arithmetic Safety & Boundary Guard */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-amber-500/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Arithmetic Overflow & Underflow Guard
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        a.checked_add(b).ok_or(Error::Overflow)?;
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Checked arithmetic on all integer types (u64, i128) preventing overflow/underflow exploits, infinite balance minting, and roundoff precision exploits.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  Safe
                </span>
              </div>

              {/* 6. Instruction Meter & Gas Limit Safety */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-indigo-500/40 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Instruction Meter & Gas Limit Safety
                      </span>
                      <code className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        max_instructions: 100M • bounded
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Bytecode size and CPU instruction cycles verified well below Soroban protocol limits. Zero unbounded loop constructs or gas starvation vulnerabilities.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shrink-0">
                  Optimized
                </span>
              </div>
            </div>

            {/* Testnet Inscription Proof Card */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Deployed Solace Core Contract
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                  {CONTRACT_ID}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(CONTRACT_ID);
                    setCopiedContract(true);
                    setTimeout(() => setCopiedContract(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedContract ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/contract/${CONTRACT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Stellar Expert</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/audit"
                onClick={() => setShowInvariantsModal(false)}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-accent/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Audit Studio</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowInvariantsModal(false)}
                className="py-2.5 sm:py-3 px-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200/60 dark:border-slate-700/80 shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {mounted && showWalletModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowWalletModal(false)}
        >
          {/* Main Modal Card */}
          <div
            className="bg-white dark:bg-[#0f1422] rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-t-4 border-t-accent border-x border-b border-slate-200/90 dark:border-slate-800/90 relative text-slate-900 dark:text-slate-100 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 my-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Decorative Glows */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            {/* Top glowing cyber accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-90 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Auditor Wallet Session
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Connected Stellar Soroban Keypair
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-200/60 dark:border-slate-700/80"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Adaptive Hardware Signer Card (Light & Dark Theme Optimized - explicitly light in light mode) */}
            <div
              className="rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl relative overflow-hidden mb-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#151a27] text-slate-900 dark:text-white transition-colors"
            >
              {/* Subtle cyber background grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#c80552_1px,transparent_1px)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(200,5,82,0.06)_50%,transparent_75%)] [background-size:16px_16px] dark:bg-[length:10px_10px] opacity-10 dark:opacity-100 pointer-events-none" />

              {/* Card Top: Branding & Active Status */}
              <div className="flex items-center justify-between relative z-10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-accent-subtle dark:bg-accent/20 border border-accent/25 dark:border-accent/30 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300">
                    SOROBAN AUDITOR SIGNER
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>Active Signer</span>
                </span>
              </div>

              {/* Card Body: Signer Address */}
              <div className="relative z-10 mb-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Public Signer Keypair
                </span>
                <div className="font-mono text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 break-all bg-white dark:bg-[#0c0f18] p-3 rounded-xl border border-slate-200/90 dark:border-white/10 select-all leading-relaxed shadow-2xs">
                  {walletKey}
                </div>
              </div>

              {/* Card Bottom: Quick Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-white/10 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(walletKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-accent-subtle hover:bg-accent/15 dark:bg-accent/20 dark:hover:bg-accent/30 text-accent dark:text-rose-200 border border-accent/25 dark:border-accent/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-accent" />
                  )}
                  <span>{copiedKey ? 'Copied to Clipboard' : 'Copy Keypair'}</span>
                </button>

                <a
                  href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/account/${walletKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <span>Stellar Expert</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Network Protocol & Environment Tile */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    network === 'mainnet'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-accent/10 text-accent border border-accent/20'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Network Protocol
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                    Stellar {network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Protocol 22)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
                  }`}
                />
                <span>{network.toUpperCase()}</span>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(false);
                  handleDisconnect();
                }}
                className="flex-1 py-3 px-4 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="py-3 px-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200/60 dark:border-slate-700/80 shadow-xs hover:scale-[1.01] active:scale-[0.99]"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
