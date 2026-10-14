'use client';
import { SAMPLE_SOROBAN_CONTRACT } from '../../lib/constants';

interface ContractInputProps {
  codeSnippet: string;
  setCodeSnippet: (val: string) => void;
  isPostDeployment: boolean;
  setIsPostDeployment: (val: boolean) => void;
  loading: boolean;
  error?: string;
  onAudit: () => void;
}

export default function ContractInput({
  codeSnippet,
  setCodeSnippet,
  isPostDeployment,
  setIsPostDeployment,
  loading,
  error,
  onAudit,
}: ContractInputProps) {
  const handleLoadSample = () => {
    setCodeSnippet(SAMPLE_SOROBAN_CONTRACT);
  };

  const handleClear = () => {
    setCodeSnippet('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold text-slate-200">Contract Code Input</h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="text-xs text-accent hover:opacity-80 transition underline underline-offset-2 disabled:opacity-50"
          >
            Load Sample Contract
          </button>
          {codeSnippet && (
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-300 transition disabled:opacity-50"
            >
              Clear
            </button>
          )}

          {/* Mode Toggle */}
          <label className="flex items-center cursor-pointer gap-2 text-sm text-slate-400 border-l border-slate-800 pl-3">
            <input
              type="checkbox"
              checked={isPostDeployment}
              onChange={(e) => setIsPostDeployment(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-accent focus:ring-accent h-4 w-4"
            />
            Post-Deployment Mode
          </label>
        </div>
      </div>

      <textarea
        value={codeSnippet}
        onChange={(e) => setCodeSnippet(e.target.value)}
        placeholder={`// Paste your Rust / Soroban smart contract code here...
pub fn my_contract_func(env: Env, sender: Address) {
    sender.require_auth();
    // ...
}`}
        className="w-full flex-grow min-h-[340px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:border-accent transition resize-none"
      />

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <button
        type="button"
        onClick={onAudit}
        disabled={loading || !codeSnippet.trim()}
        className="mt-4 w-full py-3 px-4 bg-accent bg-accent-hover disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition shadow-lg"
      >
        {loading ? 'Gemini 3.8 Flash Analyzing Code...' : 'Run Security Audit'}
      </button>
    </div>
  );
}
