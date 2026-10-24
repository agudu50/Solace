'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Layers,
  Terminal,
  Activity,
  FileText,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export default function Footer() {
  const { network, walletKey } = useWallet();
  const [copied, setCopied] = useState<boolean>(false);
  const contractId = 'CAC2TVMF5TZ3CH3FSORD267USQJTRKX6HFE3YBWSLMYHIDNMDV6PNPN2';

  const handleCopy = () => {
    navigator.clipboard.writeText(contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0c101b]/80 backdrop-blur-md pt-12 pb-16 sm:pb-12 text-xs text-slate-600 dark:text-slate-400 transition-colors">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Brand Info (Cols 1-4) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-2xl overflow-hidden bg-accent shadow-xs border border-accent/30 flex items-center justify-center shrink-0">
                <Image
                  src="/solace-logo.jpg"
                  alt="Solace Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span className="font-black text-lg text-slate-900 dark:text-white block leading-tight">
                  Solace
                </span>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider block">
                  Soroban Security Core
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-sm mb-5">
              Autonomous AI-powered smart contract security auditing, AST invariant verification, and cryptographic on-chain ledger provenance for the Stellar network.
            </p>

            {/* Protocol 22 Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stellar {network === 'mainnet' ? 'Mainnet' : 'Testnet'} (Protocol 22)</span>
            </div>
          </div>

          {/* Platform Navigation (Cols 5-6) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Platform &amp; Tools
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <Link href="/audit" className="hover:text-accent transition flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Security Audit Studio</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-accent transition flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <span>Auditor Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-accent transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Verified Ledger Reports</span>
                </Link>
              </li>
              <li>
                <Link href="/monitor" className="hover:text-accent transition flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  <span>Live Storage Rent Monitor</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Sections (Cols 7-9) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a href="#features" className="hover:text-accent transition">
                  Features &amp; Invariants
                </a>
              </li>
              <li>
                <a href="#scanner" className="hover:text-accent transition">
                  Interactive AST Simulator
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-accent transition">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-accent transition">
                  On-Chain Provenance
                </a>
              </li>
              <li>
                <a href="#audit" className="hover:text-accent transition">
                  Audit Studio
                </a>
              </li>
              <li>
                <a href="#reports" className="hover:text-accent transition">
                  Verified Reports
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-accent transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Stellar Ecosystem (Cols 10-12) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Stellar Ecosystem
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a
                  href="https://developers.stellar.org/docs/smart-contracts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition flex items-center gap-1.5"
                >
                  <span>Soroban Smart Contracts</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition flex items-center gap-1.5"
                >
                  <span>Freighter Wallet</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition flex items-center gap-1.5"
                >
                  <span>solace_core on Stellar Expert</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>

            {/* Contract copy bar */}
            <div className="mt-5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Deployed Contract ID
              </span>
              <div className="flex items-center justify-between gap-1 text-accent">
                <span className="truncate">{contractId.slice(0, 14)}...{contractId.slice(-6)}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer shrink-0"
                  title="Copy Contract ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Solace Protocol. Built for Stellar &amp; Soroban.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/audit" className="hover:text-accent transition">
              Launch Studio
            </Link>
            <span>•</span>
            <Link href="/reports" className="hover:text-accent transition">
              Verify On-Chain Audit
            </Link>
            <span>•</span>
            <a href="#faq" className="hover:text-accent transition">
              Security Standards
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
