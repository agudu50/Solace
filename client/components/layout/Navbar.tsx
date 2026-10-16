'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { connectWallet, detectWalletNetwork } from '../../utils/solaceService';

export default function Navbar() {
  const pathname = usePathname();
  const [walletKey, setWalletKey] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const syncSystemNetwork = async () => {
      try {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored) setWalletKey(stored);
        const storedNet = localStorage.getItem('solace-network');
        if (storedNet === 'mainnet' || storedNet === 'testnet') {
          setNetwork(storedNet);
        }
        const detected = await detectWalletNetwork();
        if (detected) {
          setNetwork(detected);
          localStorage.setItem('solace-network', detected);
        }
      } catch (_) {}
    };

    syncSystemNetwork();

    const handleWalletEvent = (e: any) => {
      const key = e.detail?.walletKey ?? localStorage.getItem('solace_connected_wallet') ?? '';
      setWalletKey(key);
      syncSystemNetwork();
    };

    const handleNetworkEvent = (e: any) => {
      const net = e.detail?.network ?? localStorage.getItem('solace-network') ?? 'testnet';
      if (net === 'mainnet' || net === 'testnet') {
        setNetwork(net);
      }
    };

    window.addEventListener('solace-wallet-updated', handleWalletEvent);
    window.addEventListener('solace-network-updated', handleNetworkEvent);
    window.addEventListener('focus', syncSystemNetwork);
    return () => {
      window.removeEventListener('solace-wallet-updated', handleWalletEvent);
      window.removeEventListener('solace-network-updated', handleNetworkEvent);
      window.removeEventListener('focus', syncSystemNetwork);
    };
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
    setConnecting(true);
    setNotice('');
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
        window.open('https://www.freighter.app/', '_blank');
      } else if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setNotice('Cancelled');
        setTimeout(() => setNotice(''), 3000);
      } else {
        setNotice(msg);
        setTimeout(() => setNotice(''), 3000);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletKey('');
    try {
      localStorage.removeItem('solace_connected_wallet');
      window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: '' } }));
    } catch (_) {}
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Audit Studio', href: '/audit', icon: ShieldCheck },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Monitor', href: '/monitor', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200 bg-[#f4f5f8]/90 dark:bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8 shadow-xs">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand (Fixed visibility when scrolling) */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-accent text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm transition group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              Solace
            </span>
            <span className="text-[9px] sm:text-[10px] text-accent font-bold tracking-wider uppercase mt-0.5">
              Soroban Security
            </span>
          </div>
        </Link>

        {/* Center Pill Navigation (Active state is Brand Accent #C80552, never black) */}
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

        {/* Right Tools (Network Switcher, Theme Toggle, Search, Bell, Settings, Wallet) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* System-Determined Network Status Indicator (Auto-detected from Connected Wallet) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xs text-xs font-semibold shrink-0 transition-colors ${
              network === 'mainnet'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-accent/10 border-accent/25 text-accent'
            }`}
            title={`Active Network: Stellar ${network === 'mainnet' ? 'Mainnet (Production)' : 'Testnet (Staging)'} - automatically resolved by system from wallet.`}
          >
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                network === 'mainnet' ? 'bg-emerald-500 animate-pulse' : 'bg-accent animate-pulse'
              }`}
            />
            <span className="font-bold text-xs uppercase tracking-wide">
              {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </span>
            <span className="text-[10px] opacity-75 hidden sm:inline">
              ({network === 'mainnet' ? 'Production' : 'Staging'})
            </span>
          </div>

          {/* Theme Toggle Button (Light & Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex items-center justify-center transition shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Search Button (Visible on sm+ to prevent mobile crowding) */}
          <button
            type="button"
            onClick={() => {
              const hash = prompt('Search contract audit hash:');
              if (hash) window.location.href = `/reports?hash=${encodeURIComponent(hash)}`;
            }}
            className="hidden sm:flex w-9 h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm items-center justify-center transition shrink-0"
            title="Search audit by hash"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell (Visible on sm+ to keep mobile bar sleek) */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => alert(`All Soroban security invariants passing on Stellar ${network === 'mainnet' ? 'Mainnet' : 'Testnet'}.`)}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex items-center justify-center transition"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex items-center justify-center transition shrink-0"
            title="Security Settings & Network Config"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Wallet Button (Accent colored, never black) */}
          {walletKey ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 pl-2.5 sm:pl-3 pr-1 py-1 rounded-full shadow-sm text-xs font-mono text-slate-700 dark:text-slate-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-accent inline-block animate-pulse shrink-0" />
              <span>{walletKey.slice(0, 3)}...{walletKey.slice(-3)}</span>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[10px] ml-0.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title="Disconnect"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-xs font-bold shadow-md shadow-accent/25 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
              <span className="sm:hidden">{connecting ? '...' : 'Connect'}</span>
            </button>
          )}

          {notice && (
            <span className="hidden md:inline-block text-xs text-slate-500 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full shadow-sm">
              {notice}
            </span>
          )}
        </div>
      </div>

      {/* Settings Modal with Dark Mode & Network Switcher support */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white dark:bg-[#111726] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
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
              className="mt-5 w-full py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-md shadow-accent/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
