import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#0f1422]/60 mt-16 py-6 text-xs text-slate-700 dark:text-slate-300 transition-colors">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">Solace</span>
          <span>•</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">Autonomous AI Smart Contract Auditor & Ledger Provenance for Stellar Soroban</span>
        </div>
        <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-semibold">
          <Link href="/" className="hover:text-accent transition">
            Dashboard
          </Link>
          <Link href="/reports" className="hover:text-accent transition">
            Verified Reports
          </Link>
          <Link href="/monitor" className="hover:text-accent transition">
            Live Monitor
          </Link>
          <span>•</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Stellar Testnet</span>
        </div>
      </div>
    </footer>
  );
}
