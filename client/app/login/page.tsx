'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, authenticate, freighterReady } = useWallet();

  const [activeTab, setActiveTab] = useState<'email' | 'wallet'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Wallet auth state
  const [walletLoading, setWalletLoading] = useState(false);
  const [authStep, setAuthStep] = useState('');

  // Feedback state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      setSuccess('Authenticated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError('');
    setSuccess('');
    setWalletLoading(true);
    setAuthStep('Requesting cryptographic authentication challenge...');

    try {
      setAuthStep('Prompting Freighter signature...');
      await authenticate('solace-auth-login');
      setSuccess('Wallet verified cryptographically! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Wallet connection was cancelled or rejected.');
    } finally {
      setWalletLoading(false);
      setAuthStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-accent selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl overflow-hidden bg-accent shadow-lg shadow-accent/30 flex items-center justify-center p-1 border border-accent/40 group-hover:scale-105 transition-transform">
            <Image src="/solace-logo.jpg" alt="Solace Logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-white tracking-tight">SOLACE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/20 text-accent font-bold border border-accent/30">
                SECURITY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">SOROBAN AUDIT PLATFORM</p>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-[#101522]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-black text-center text-white tracking-tight mb-1.5">
            Welcome to Solace
          </h1>
          <p className="text-xs text-center text-slate-400 leading-relaxed mb-6 font-medium">
            Log in to manage your smart contract security audits, inspect AST invariant checks, and view credit balances.
          </p>

          {/* Dual Method Tabs */}
          <div className="flex bg-[#0a0d16] p-1 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email &amp; Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('wallet');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Stellar Wallet</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-200 font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: EMAIL & PASSWORD */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-accent focus:ring-accent"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: BLOCKCHAIN WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-[#0a0d16] border border-slate-800/80 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Supported Network:</span>
                  <span className="text-accent font-bold">Stellar Testnet (Protocol 22)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Freighter Extension:</span>
                  <span className={freighterReady ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {freighterReady ? 'Detected' : 'Standby / Checking'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Security Model:</span>
                  <span className="text-slate-300">Non-Custodial (Zero Key Exposure)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                Click below to connect your Freighter wallet and cryptographically sign an authentication challenge with your private key.
              </p>

              <button
                type="button"
                onClick={handleWalletLogin}
                disabled={walletLoading}
                className="w-full py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {walletLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="truncate">{authStep || 'Authenticating Wallet...'}</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect &amp; Authenticate Wallet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Link to sign up */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="text-accent font-bold hover:underline">
              Create an account
            </Link>
          </div>

          {/* Admin link */}
          <div className="mt-3 text-center">
            <Link
              href="/admin/login"
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono transition"
            >
              Administrator Console &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-600 font-mono">
        Solace Protocol • Zero Key Exposure • Ed25519 Cryptographic Proof of Ownership
      </footer>
    </div>
  );
}
