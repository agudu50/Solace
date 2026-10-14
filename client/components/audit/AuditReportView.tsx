'use client';
import { useState } from 'react';
import { AuditReportData } from '../../lib/api';

interface OnChainPayload {
  functionName?: string;
  contractId?: string | null;
  parameters?: Record<string, any>;
  cliCommand?: string;
}

interface AuditReportViewProps {
  report: AuditReportData | null;
  loading: boolean;
  onChainPayload?: OnChainPayload | null;
  contractHash?: string;
}

export default function AuditReportView({
  report,
  loading,
  onChainPayload,
  contractHash,
}: AuditReportViewProps) {
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  const handleCopyCli = () => {
    if (onChainPayload?.cliCommand) {
      navigator.clipboard.writeText(onChainPayload.cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-200">Audit Dashboard & Findings</h2>
        {contractHash && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px]" title={contractHash}>
            Hash: {contractHash.slice(0, 10)}...{contractHash.slice(-6)}
          </span>
        )}
      </div>

      {!report && !loading && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-500">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold mb-3">
            01
          </div>
          <p className="font-medium text-slate-400">No audit executed yet.</p>
          <p className="text-xs mt-1 text-slate-500">
            Paste your smart contract snippet or load the sample, then click Run Security Audit.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-slate-800 rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
          <p className="text-slate-300 font-medium">Scanning for Soroban vulnerabilities...</p>
          <p className="text-xs text-slate-500 mt-1">Evaluating authorization, storage TTL, and logic safety.</p>
        </div>
      )}

      {report && !loading && (
        <div className="flex-grow space-y-6 overflow-y-auto max-h-[560px] pr-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Risk Score</span>
              <p className={`text-3xl font-black mt-1 ${report.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                {report.riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security Status</span>
              <p className={`text-xl font-bold mt-2 ${report.isSecure ? 'text-emerald-400' : 'text-amber-400'}`}>
                {report.isSecure ? 'Secure' : 'Vulnerabilities Found'}
              </p>
            </div>
          </div>

          {/* Overview Summary */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1">Executive Summary</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
          </div>

          {/* Vulnerabilities List */}
          {report.vulnerabilities && report.vulnerabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3">
                Detected Vulnerabilities ({report.vulnerabilities.length})
              </h3>
              <div className="space-y-3">
                {report.vulnerabilities.map((vuln, idx) => (
                  <div key={idx} className="bg-red-950/20 border border-red-900/40 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200 text-sm">{vuln.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        vuln.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                        vuln.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {vuln.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{vuln.description}</p>
                    <div className="mt-3 bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs">
                      <span className="font-semibold text-accent block mb-0.5">Recommended Fix:</span>
                      <span className="text-slate-300 font-mono">{vuln.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Deployment Recommendations */}
          {report.postDeploymentRecommendations && report.postDeploymentRecommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3">
                Post-Deployment Recommendations
              </h3>
              <ul className="space-y-2 bg-slate-950 border border-slate-800 p-4 rounded-lg text-xs text-slate-300 list-disc list-inside">
                {report.postDeploymentRecommendations.map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* On-Chain Ledger Sync Payload */}
          {onChainPayload?.cliCommand && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase text-accent tracking-wider">
                  Soroban Ledger Recording CLI
                </span>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {copiedCli ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2 rounded bg-slate-900 border border-slate-850">
                {onChainPayload.cliCommand}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
