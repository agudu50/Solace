import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/60 mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Solace</span>
          <span>•</span>
          <span>AI-Powered Smart Contract Security Auditing for Stellar</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/" className="hover:text-accent transition">
            Audit Studio
          </Link>
          <Link href="/reports" className="hover:text-accent transition">
            Verified Ledger
          </Link>
          <Link href="/monitor" className="hover:text-accent transition">
            Live Monitor
          </Link>
          <span>•</span>
          <span className="font-mono text-slate-500">Gemini 3.8 Flash</span>
        </div>
      </div>
    </footer>
  );
}
