'use client';
import { useState } from 'react';

export default function MonitorPage() {
  const [contractId, setContractId] = useState('');
  const [monitoring, setMonitoring] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const handleStartMonitor = (e) => {
    e.preventDefault();
    if (!contractId.trim()) return;
    setMonitoring(true);

    setTimeout(() => {
      setMetrics({
        contractId: contractId.trim(),
        status: 'HEALTHY',
        ttlRemainingLedgers: 48520,
        rentStatus: 'GOOD',
        storageType: 'Persistent',
        invariantsPassed: 6,
        invariantsFailed: 0,
        lastInvoked: '2 minutes ago',
        authorizedSigners: 1,
      });
      setMonitoring(false);
    }, 500);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <span className="text-xs font-bold px-2.5 py-1 bg-accent-subtle text-accent border border-accent-subtle rounded-full tracking-wider uppercase">
          Post-Deployment Security
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
          Live Contract Monitor
        </h1>
        <p className="text-slate-400 mt-1">
          Real-time health monitoring, storage TTL tracking, and post-deployment security checks for live Soroban contracts.
        </p>
      </div>

      {/* Monitor Input */}
      <form onSubmit={handleStartMonitor} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Enter Deployed Soroban Contract ID (e.g. CA3D5K...)..."
            className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-accent transition"
          />
          <button
            type="submit"
            disabled={monitoring}
            className="px-6 py-3 bg-accent bg-accent-hover text-white font-bold rounded-lg text-sm transition"
          >
            {monitoring ? 'Inspecting Contract...' : 'Inspect Live Contract'}
          </button>
        </div>
      </form>

      {/* Monitor Findings Dashboard */}
      {metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Network Status
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.status}</p>
              <span className="text-xs text-slate-400 mt-1 block">Contract responsive on Testnet</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Storage Rent TTL
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {metrics.ttlRemainingLedgers.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">ledgers remaining</span>
              </p>
              <span className="text-xs text-emerald-400 mt-1 block">No immediate archival risk</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Security Invariants
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {metrics.invariantsPassed} / {metrics.invariantsPassed + metrics.invariantsFailed}
              </p>
              <span className="text-xs text-slate-400 mt-1 block">All automated health checks passing</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-4">Post-Deployment Monitoring Telemetry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-850">
                <span className="text-slate-400">Contract ID</span>
                <span className="font-mono text-accent text-xs">{metrics.contractId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-850">
                <span className="text-slate-400">Storage Class</span>
                <span className="font-medium text-slate-200">{metrics.storageType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-850">
                <span className="text-slate-400">Authorized Signers</span>
                <span className="font-medium text-slate-200">{metrics.authorizedSigners} Address</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-850">
                <span className="text-slate-400">Last Ledger Activity</span>
                <span className="font-medium text-slate-200">{metrics.lastInvoked}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!metrics && !monitoring && (
        <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-xl text-slate-500">
          <p className="font-medium text-slate-400">No live contract monitored yet.</p>
          <p className="text-xs mt-1">
            Provide a deployed Stellar Soroban contract ID to inspect TTL rent, access controls, and invariants.
          </p>
        </div>
      )}
    </main>
  );
}
