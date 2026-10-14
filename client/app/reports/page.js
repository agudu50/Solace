'use client';
import { useState } from 'react';

export default function ReportsPage() {
  const [searchHash, setSearchHash] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const mockReports = [
    {
      hash: 'ec6a4eb00b6281f6f765ff3d94bf187d153dd42a78627164dbf837e83023defe',
      contract: 'Solace Core Contract',
      auditType: 'PRE_DEPLOYMENT',
      riskScore: 12,
      isSecure: true,
      auditor: 'GDZ...AUDITOR',
      timestamp: '2026-10-14 22:15 UTC',
    },
    {
      hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      contract: 'Vault Lending Pool',
      auditType: 'POST_DEPLOYMENT',
      riskScore: 78,
      isSecure: false,
      auditor: 'GDZ...AUDITOR',
      timestamp: '2026-10-14 21:40 UTC',
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchHash.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const found = mockReports.find((r) =>
        r.hash.toLowerCase().includes(searchHash.trim().toLowerCase())
      );
      setSearchResult(found || { notFound: true });
      setSearching(false);
    }, 400);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <span className="text-xs font-bold px-2.5 py-1 bg-accent-subtle text-accent border border-accent-subtle rounded-full tracking-wider uppercase">
          Ledger Provenance
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
          Verified On-Chain Reports
        </h1>
        <p className="text-slate-400 mt-1">
          Cryptographically signed smart contract audit reports stored persistently on Stellar via{' '}
          <span className="font-mono text-accent">SolaceContract::record_audit</span>.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Search by contract hash (e.g. ec6a4eb00b6...)..."
            className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-accent transition"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-accent bg-accent-hover text-white font-bold rounded-lg text-sm transition"
          >
            {searching ? 'Querying Ledger...' : 'Lookup Report'}
          </button>
        </div>
      </form>

      {/* Search Result */}
      {searchResult && (
        <div className="mb-8">
          {searchResult.notFound ? (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400">
              No on-chain audit record found for hash <span className="font-mono text-accent">{searchHash}</span>.
            </div>
          ) : (
            <div className="p-5 bg-slate-900 border border-accent-subtle rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent-subtle">
                    Query Result
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{searchResult.contract}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{searchResult.hash}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${searchResult.isSecure ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  {searchResult.isSecure ? 'SECURE' : 'VULNERABLE'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Risk Score</span>
                  <p className="text-white font-bold text-sm mt-0.5">{searchResult.riskScore}/100</p>
                </div>
                <div>
                  <span className="text-slate-500">Audit Type</span>
                  <p className="text-white font-bold text-sm mt-0.5">{searchResult.auditType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Auditor Address</span>
                  <p className="text-white font-mono text-sm mt-0.5">{searchResult.auditor}</p>
                </div>
                <div>
                  <span className="text-slate-500">Recorded Timestamp</span>
                  <p className="text-white font-sm mt-0.5">{searchResult.timestamp}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Ledger Records */}
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Verified Audits</h2>
      <div className="space-y-4">
        {mockReports.map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{item.contract}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.auditType}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded w-fit ${item.isSecure ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                {item.isSecure ? 'SECURE' : 'ACTION REQUIRED'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-3 truncate">Hash: {item.hash}</p>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-850">
              <span>Auditor: <span className="font-mono text-slate-400">{item.auditor}</span></span>
              <span>{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
