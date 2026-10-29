'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export default function SignupPage() {
  const router = useRouter();
  const { registerWithEmail, authenticate } = useWallet();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 10, label: 'Too short', color: 'bg-red-400' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(name, email, password);
      setSuccess('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSignup = async () => {
    setError('');
    setWalletLoading(true);
    try {
      await authenticate('solace-auth-login');
      setSuccess('Wallet authenticated! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Wallet connection was cancelled.');
    } finally {
      setWalletLoading(false);
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

      {/* Main Registration Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-[#101522]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />

          {/* Icon Badge */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/25">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-center text-white tracking-tight mb-1.5">
            Create an Account
          </h1>
          <p className="text-xs text-center text-slate-400 leading-relaxed mb-6 font-medium">
            Sign up to run AI-powered Soroban smart contract audits and purchase audit credits.
          </p>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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

              {/* Password strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-slate-200">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] font-mono text-slate-500 uppercase">Or sign up with</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Wallet Signup Button */}
          <button
            type="button"
            onClick={handleWalletSignup}
            disabled={walletLoading}
            className="w-full py-2.5 px-4 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-mono font-medium transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {walletLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Connecting Wallet...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 text-accent" />
                <span>Connect Stellar / Freighter Wallet</span>
              </>
            )}
          </button>

          {/* Link to login */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-600 font-mono">
        Solace Protocol • Secure Password Hashing &amp; Non-Custodial Stellar Authentication
      </footer>
    </div>
  );
}
