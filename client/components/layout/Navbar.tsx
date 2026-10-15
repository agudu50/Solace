'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { connectWallet } from '../../utils/solaceService';

export default function Navbar() {
  const pathname = usePathname();
  const [walletKey, setWalletKey] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');

  const handleConnect = async () => {
    setConnecting(true);
    setNotice('');
    try {
      const key = await connectWallet();
      setWalletKey(key);
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

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Reports', href: '/reports' },
    { label: 'Monitor', href: '/monitor' },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-accent text-white flex items-center justify-center font-black text-lg shadow-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
              Solace
            </span>
            <span className="text-[10px] text-accent font-semibold tracking-wider uppercase mt-0.5">
              Soroban Security
            </span>
          </div>
        </Link>

        {/* Center Pill Navigation (matching reference image) */}
        <nav className="hidden md:flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200/80">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools (Search, Bell, Profile/Wallet) */}
        <div className="flex items-center gap-2.5">
          {/* Search Icon Button */}
          <button
            type="button"
            onClick={() => {
              const hash = prompt('Search contract hash:');
              if (hash) window.location.href = `/reports?hash=${encodeURIComponent(hash)}`;
            }}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm flex items-center justify-center transition"
            title="Search audit by hash"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm flex items-center justify-center transition"
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent"></span>
            </button>
          </div>

          {/* Wallet Button */}
          {walletKey ? (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 pl-3 pr-1 py-1 rounded-full shadow-sm text-xs font-mono text-slate-700">
              <span className="w-2 h-2 rounded-full bg-accent inline-block"></span>
              <span>{walletKey.slice(0, 4)}...{walletKey.slice(-4)}</span>
              <button
                type="button"
                onClick={() => setWalletKey('')}
                className="text-[10px] ml-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                title="Disconnect"
              >
                x
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {connecting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          )}

          {notice && (
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">
              {notice}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
