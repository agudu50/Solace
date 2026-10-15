import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#0f1422]/60 mt-16 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Solace</span>
          <span>•</span>
          <span>Autonomous AI Smart Contract Auditor & Ledger Provenance for Stellar Soroban</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
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
          <span className="font-mono text-slate-400">Stellar Testnet</span>
        </div>
      </div>
    </footer>
  );
}
