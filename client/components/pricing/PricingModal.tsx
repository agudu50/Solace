'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Zap,
  Layers,
  Coins,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AuditPackage,
  PREPAID_PACKAGES,
  fetchAuditPackages,
  purchaseCreditPackage,
  fetchUserCreditBalance,
  UserCreditBalance,
  CreditPurchaseReceipt,
} from '../../utils/solaceService';
import { useWallet } from '../../context/WalletContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess?: (receipt: CreditPurchaseReceipt) => void;
}

export default function PricingModal({ isOpen, onClose, onPurchaseSuccess }: PricingModalProps) {
  const { walletKey, network, connect } = useWallet();
  const [packages, setPackages] = useState<AuditPackage[]>(PREPAID_PACKAGES);
  const [selectedPkgId, setSelectedPkgId] = useState<number>(2); // Default to Growth (60 XLM)
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [purchaseStep, setPurchaseStep] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<CreditPurchaseReceipt | null>(null);
  const [creditBalance, setCreditBalance] = useState<UserCreditBalance | null>(null);

  useEffect(() => {
    fetchAuditPackages().then(setPackages);
  }, []);

  useEffect(() => {
    if (walletKey) {
      fetchUserCreditBalance(walletKey).then(setCreditBalance);
    }
  }, [walletKey]);

  if (!isOpen) return null;

  const handlePurchase = async (pkgId: number) => {
    setError('');
    setSuccessReceipt(null);

    let activeWallet = walletKey;
    if (!activeWallet) {
      try {
        setPurchaseStep('Connecting Freighter Wallet...');
        activeWallet = await connect();
      } catch (err: any) {
        setError(err?.message || 'Wallet connection was cancelled.');
        setPurchaseStep('');
        return;
      }
      if (!activeWallet) {
        setPurchaseStep('');
        return;
      }
    }

    const pkg = packages.find((p) => p.id === pkgId) || packages[0];
    setPurchasing(true);
    setPurchaseStep(`Prompting Freighter to authorize ${pkg.priceXLM} XLM for ${pkg.credits} audit credits...`);

    try {
      const receipt = await purchaseCreditPackage(activeWallet, pkg.id, network);
      setSuccessReceipt(receipt);
      setCreditBalance(receipt.creditBalance);
      setPurchaseStep('');
      if (onPurchaseSuccess) {
        onPurchaseSuccess(receipt);
      }
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err?.message || 'Transaction was declined or failed on Stellar.');
      setPurchaseStep('');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Prepaid Soroban Audit Bundles
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upfront XLM prepaid credits • Credits never expire • Use at your own pace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {/* Informational Callout: Non-Expiring Model */}
          <div className="mb-6 p-4 rounded-2xl bg-accent-subtle border border-accent/25 flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-accent block text-sm mb-0.5">
                Prepaid Bundles, Not Recurring Subscriptions
              </span>
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Purchased audit credits <strong>never expire</strong> at the end of the month or due to inactivity. Every package adds directly to your available balance. Perform audits anytime you deploy or update a smart contract.
              </p>
              {walletKey && creditBalance && (
                <div className="mt-2 pt-2 border-t border-accent/20 flex items-center gap-3 font-mono">
                  <span className="text-slate-600 dark:text-slate-300">
                    Your Current Available Balance:
                  </span>
                  <span className="font-black text-accent text-sm">
                    {creditBalance.availableCredits} {creditBalance.availableCredits === 1 ? 'Credit' : 'Credits'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {successReceipt && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-sm block text-emerald-700 dark:text-emerald-300 mb-0.5">
                  Package Purchased Successfully!
                </span>
                <p className="font-medium">
                  {successReceipt.creditsGranted} audit credits have been permanently credited to your wallet balance.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                  <span>Tx: {successReceipt.transactionHash.slice(0, 16)}...</span>
                  <a
                    href={successReceipt.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline flex items-center gap-1"
                  >
                    <span>Inspect on Stellar Expert</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 3 Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {packages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              const isPopular = pkg.id === 2;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`relative p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-accent shadow-xl shadow-accent/10 bg-accent/5 dark:bg-accent/10 ring-2 ring-accent'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0d14] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {pkg.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 font-bold">
                        {pkg.credits} Audits
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                          {pkg.priceXLM}
                        </span>
                        <span className="text-sm font-bold text-accent font-mono">XLM</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        Effective: {pkg.pricePerAuditXLM} XLM / smart contract audit
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
                      {pkg.description}
                    </p>

                    <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 mb-6 text-xs text-slate-600 dark:text-slate-300">
                      {pkg.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(pkg.id);
                    }}
                    disabled={purchasing}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${
                      isSelected
                        ? 'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/20'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {purchasing && selectedPkgId === pkg.id
                        ? 'Confirming with Freighter...'
                        : `Purchase ${pkg.name} (${pkg.priceXLM} XLM)`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active progress indicator */}
          {purchasing && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>{purchaseStep}</span>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Stellar Protocol 22 Standard • Verified On-Chain Contract CAC2TV...NPN2</span>
            <span>Zero Lock-in • Credits roll over indefinitely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
