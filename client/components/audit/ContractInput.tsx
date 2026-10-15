'use client';
import React, { useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedFileName, setLoadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleLoadSample = () => {
    setCodeSnippet(SAMPLE_SOROBAN_CONTRACT);
    setLoadedFileName('sample_vault.rs');
  };

  const handleClear = () => {
    setCodeSnippet('');
    setLoadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileRead = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCodeSnippet(text);
        setLoadedFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setCodeSnippet(text);
        setLoadedFileName('pasted_contract.rs');
      }
    } catch {
      // Fallback: clipboard permission denied
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
      return;
    }

    const text = e.dataTransfer.getData('text');
    if (text) {
      setCodeSnippet(text);
      setLoadedFileName('dropped_snippet.rs');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-900 border ${
        isDragging ? 'border-accent bg-accent/5' : 'border-slate-800'
      } rounded-xl p-6 shadow-xl flex flex-col h-full transition`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".rs,.rust,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-200">Contract Code Input</h2>
          {loadedFileName && (
            <span className="text-[11px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-accent-subtle">
              {loadedFileName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Upload .rs File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 disabled:opacity-50"
          >
            Upload .rs File
          </button>

          {/* Paste from Clipboard Button */}
          <button
            type="button"
            onClick={handlePasteClipboard}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 disabled:opacity-50"
          >
            Paste Code
          </button>

          {/* Load Sample Contract */}
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="text-xs text-accent hover:opacity-80 transition underline underline-offset-2 disabled:opacity-50"
          >
            Sample Contract
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
            Post-Deployment
          </label>
        </div>
      </div>

      {/* Editor & Drop Zone */}
      <div className="relative flex-grow flex flex-col">
        <textarea
          value={codeSnippet}
          onChange={(e) => {
            setCodeSnippet(e.target.value);
            if (!loadedFileName) setLoadedFileName('custom_contract.rs');
          }}
          placeholder={`// Paste your Rust / Soroban smart contract code, upload a .rs file, or drag & drop here...
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct MyContract;

#[contractimpl]
impl MyContract {
    pub fn execute(env: Env, caller: Address) {
        caller.require_auth();
    }
}`}
          className={`w-full flex-grow min-h-[340px] bg-slate-950 border ${
            isDragging ? 'border-accent ring-2 ring-accent/20' : 'border-slate-800'
          } rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:border-accent transition resize-none`}
        />

        {isDragging && (
          <div className="absolute inset-0 bg-slate-950/80 border-2 border-dashed border-accent rounded-lg flex flex-col items-center justify-center pointer-events-none">
            <p className="text-accent font-bold text-base">Drop your .rs smart contract file here</p>
            <p className="text-slate-400 text-xs mt-1">Accepts .rs, .rust, or text files</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <button
        type="button"
        onClick={onAudit}
        disabled={loading || !codeSnippet.trim()}
        className="mt-4 w-full py-3 px-4 bg-accent bg-accent-hover disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
            <span>Auditing Smart Contract...</span>
          </>
        ) : (
          'Audit Smart Contract'
        )}
      </button>
    </div>
  );
}
