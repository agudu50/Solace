'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, FileCode, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface ContractOption {
  contract?: string;
  contractName?: string;
  hash: string;
  subtitle?: string;
  isSecure?: boolean;
  riskScore?: number;
  date?: string;
  auditType?: string;
}

export default function ContractSwitcherDropdown({
  contracts,
  activeHash,
  onSelect,
}: {
  contracts: any[];
  activeHash?: string;
  onSelect: (contract: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeContract = contracts.find((c) => c.hash === activeHash) || contracts[0];
  const activeName = activeContract?.contract || activeContract?.contractName || 'Select Contract';
  const activeShortHash = activeContract?.hash ? `#${activeContract.hash.slice(0, 6)}` : '';

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b22] text-xs font-medium text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-[#20212b] transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-accent/40"
      >
        <FileCode className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="font-semibold max-w-[130px] sm:max-w-[180px] truncate">
          {activeName}
        </span>
        {activeShortHash && (
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            {activeShortHash}
          </span>
        )}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      {/* Enhanced Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-1.5 w-72 sm:w-84 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#16171d]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.06]"
          >
            {/* Menu Header */}
            <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Audited Contracts
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                {contracts.length} in history
              </span>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto modern-code-scrollbar p-1.5 space-y-1">
              {contracts.map((c, idx) => {
                const isSelected = c.hash === activeHash;
                const name = c.contract || c.contractName || 'Soroban Contract';
                const file = c.subtitle || `${name.toLowerCase().replace(/\s+/g, '_')}.rs`;
                const isSecure = c.isSecure ?? true;
                const score = c.riskScore ?? (isSecure ? 95 : 60);

                return (
                  <button
                    key={`${c.hash}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/10 border border-accent/25 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs truncate">
                          {name}
                        </span>
                        {isSelected && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="truncate">{file}</span>
                        <span>•</span>
                        <span>#{c.hash ? c.hash.slice(0, 6) : '——'}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                            isSecure
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/15 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {isSecure ? 'Verified Secure' : 'Action Required'}
                        </span>
                        <span className="text-slate-400">Score: {score}/100</span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
