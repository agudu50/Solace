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
      className={`bg-white border ${
        isDragging ? 'border-accent ring-2 ring-accent/20' : 'border-slate-200'
      } rounded-2xl p-5 shadow-sm flex flex-col h-full transition`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".rs,.rust,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Contract Code Input</h2>
          {loadedFileName && (
            <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded-full font-semibold border border-accent-subtle">
              {loadedFileName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload .rs File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 disabled:opacity-50 font-medium"
          >
            Upload .rs File
          </button>

          {/* Paste from Clipboard Button */}
          <button
            type="button"
            onClick={handlePasteClipboard}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 disabled:opacity-50 font-medium"
          >
            Paste Code
          </button>

          {/* Load Sample Contract */}
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            className="text-xs text-accent hover:underline font-semibold disabled:opacity-50"
          >
            Sample Contract
          </button>

          {codeSnippet && (
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
            >
              Clear
            </button>
          )}

          {/* Mode Toggle */}
          <label className="flex items-center cursor-pointer gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-2">
            <input
              type="checkbox"
              checked={isPostDeployment}
              onChange={(e) => setIsPostDeployment(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-accent focus:ring-accent h-3.5 w-3.5"
            />
            <span>Post-Deploy</span>
          </label>
        </div>
      </div>

      {/* Editor & Drop Zone (sleek dark code canvas for readability) */}
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
          className={`w-full flex-grow min-h-[300px] bg-slate-900 border ${
            isDragging ? 'border-accent ring-2 ring-accent/20' : 'border-slate-800'
          } rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-accent transition resize-none leading-relaxed`}
        />

        {isDragging && (
          <div className="absolute inset-0 bg-slate-900/90 border-2 border-dashed border-accent rounded-xl flex flex-col items-center justify-center pointer-events-none">
            <p className="text-accent font-bold text-sm">Drop your .rs smart contract file here</p>
            <p className="text-slate-400 text-xs mt-1">Accepts .rs, .rust, or text files</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}

      <button
        type="button"
        onClick={onAudit}
        disabled={loading || !codeSnippet.trim()}
        className="mt-4 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-full transition shadow-sm flex items-center justify-center gap-2 text-xs"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            <span>Auditing Smart Contract...</span>
          </>
        ) : (
          'Audit Smart Contract'
        )}
      </button>
    </div>
  );
}
