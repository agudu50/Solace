'use client';
import { useState } from 'react';
import ContractInput from '../components/audit/ContractInput';
import AuditReportView from '../components/audit/AuditReportView';
import { requestAudit } from '../lib/api';

export default function Home() {
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isPostDeployment, setIsPostDeployment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [onChainPayload, setOnChainPayload] = useState(null);
  const [contractHash, setContractHash] = useState('');
  const [error, setError] = useState('');

  const handleAudit = async () => {
    if (!codeSnippet.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    setOnChainPayload(null);
    setContractHash('');

    try {
      const data = await requestAudit({ codeSnippet, isPostDeployment });
      if (data.success) {
        setReport(data.data || data.report);
        setOnChainPayload(data.onChainPayload || null);
        setContractHash(data.contractHash || '');
      } else {
        setError(data.error || 'Failed to generate audit report.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to the backend server. Ensure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold px-2.5 py-1 bg-accent-subtle text-accent border border-accent-subtle rounded-full tracking-wider uppercase">
            Powered by Gemini 3.8 Flash & Stellar Soroban
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-white">Solace AI</h1>
          <p className="text-slate-400 mt-1">Autonomous smart contract security auditing, bug detection, and hardening.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <ContractInput
          codeSnippet={codeSnippet}
          setCodeSnippet={setCodeSnippet}
          isPostDeployment={isPostDeployment}
          setIsPostDeployment={setIsPostDeployment}
          loading={loading}
          error={error}
          onAudit={handleAudit}
        />

        {/* Results Section */}
        <AuditReportView
          report={report}
          loading={loading}
          onChainPayload={onChainPayload}
          contractHash={contractHash}
        />
      </div>
    </main>
  );
}
