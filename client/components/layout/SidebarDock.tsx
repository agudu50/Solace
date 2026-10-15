'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarDockProps {
  onOpenAudit?: () => void;
}

export default function SidebarDock({ onOpenAudit }: SidebarDockProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col items-center justify-between w-16 bg-white rounded-3xl p-3 shadow-sm border border-slate-200/80 my-4 ml-6 self-start sticky top-24 shrink-0">
      {/* Top Group */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Dashboard Grid (Active / Home) */}
        <Link
          href="/"
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
            pathname === '/'
              ? 'bg-accent text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Security Dashboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </Link>

        {/* Audit Studio Button */}
        <button
          type="button"
          onClick={onOpenAudit}
          className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          title="Run Code Audit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        {/* Reports / Analytics */}
        <Link
          href="/reports"
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
            pathname === '/reports'
              ? 'bg-accent text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Verified Reports"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </Link>

        {/* Live Monitor */}
        <Link
          href="/monitor"
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
            pathname === '/monitor'
              ? 'bg-accent text-white shadow-md'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Live Contract Monitor"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </Link>

        {/* Ledger Inscriptions */}
        <a
          href="https://stellar.expert/explorer/testnet/contract/CBXV73FFYM45PJQYUB2VTGU2WUQL4JUSL6OG3SEWSGXW4WJH5YSNQKDQ"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          title="Stellar Expert Explorer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </a>
      </div>

      {/* Bottom Group */}
      <div className="flex flex-col items-center gap-3 w-full pt-8">
        <button
          type="button"
          onClick={() => alert('Solace Core Contract v0.1.0 on Stellar Testnet')}
          className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          title="Settings / Info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
