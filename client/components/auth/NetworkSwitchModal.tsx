'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Globe,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Radio,
  X,
} from 'lucide-react';

interface NetworkSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork?: string;
  requiredNetwork?: string;
  onRecheckAndConnect: () => Promise<boolean>;
}

export default function NetworkSwitchModal({
  isOpen,
  onClose,
  currentNetwork = 'PUBLIC',
  requiredNetwork = 'Stellar Testnet (Protocol 22)',
  onRecheckAndConnect,
}: NetworkSwitchModalProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRecheck = async () => {
    setChecking(true);
    setStatusMessage('Checking Freighter network...');
    setIsError(false);

    try {
      const success = await onRecheckAndConnect();
      if (success) {
        setStatusMessage('Network verified! Connecting wallet...');
        setIsError(false);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setIsError(true);
        setStatusMessage(
          `Freighter is still set to ${currentNetwork.toUpperCase()}. Please select Testnet in Freighter and click Re-check.`
        );
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err?.message || 'Failed to detect Testnet network. Please check your Freighter extension.');
    } finally {
      setChecking(false);
    }
  };

  const formattedCurrentNetwork = currentNetwork ? currentNetwork.toUpperCase() : 'PUBLIC / MAINNET';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-400/20 shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-900 dark:text-white transition-all">
        {/* Top Warning Banner Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-accent" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/20 flex items-center justify-center shrink-0 text-amber-500 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Network Mismatch
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Freighter API</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  Switch to Stellar Testnet
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Solace is currently deployed on <strong>Stellar Testnet (Protocol 22)</strong>. Your Freighter wallet is connected to a different network. Please switch to Testnet in Freighter to continue.
          </p>
        </div>

        {/* Network Comparison Grid */}
        <div className="px-6 sm:px-7 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
            {/* Current Wallet Network */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#182032] border border-rose-300/60 dark:border-rose-900/60 flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Wallet Network</span>
              </div>
              <div className="mt-2 font-mono text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                {formattedCurrentNetwork}
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                Unsupported for Testnet audit proofs
              </span>
            </div>

            {/* Target System Network */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#182032] border border-emerald-300/60 dark:border-emerald-900/60 flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Required System</span>
              </div>
              <div className="mt-2 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                TESTNET
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                Protocol 22 (Soroban ledger)
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Instructions */}
        <div className="px-6 sm:px-7 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            How to switch network in Freighter:
          </div>
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
            <li>
              Click the <strong className="text-slate-900 dark:text-white">Freighter extension icon</strong> in your browser toolbar.
            </li>
            <li>
              Click the <strong className="text-slate-900 dark:text-white">Network dropdown</strong> in the top-right of Freighter.
            </li>
            <li>
              Select <strong className="text-emerald-600 dark:text-emerald-400 font-mono">Testnet</strong> (or <em>Test SDF Network ; September 2015</em>).
            </li>
            <li>
              Click <strong className="text-slate-900 dark:text-white">Re-check & Connect</strong> below.
            </li>
          </ol>
        </div>

        {/* Dynamic Status / Error alert */}
        {statusMessage && (
          <div className="px-6 sm:px-7 pt-2">
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                isError
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <span>{statusMessage}</span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-6 sm:p-7 pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleRecheck}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-extrabold bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Freighter...' : 'Re-check & Connect'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

