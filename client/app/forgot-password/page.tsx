'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  KeyRound,
} from 'lucide-react';
import { requestPasswordReset, resetPasswordWithToken } from '../../utils/solaceService';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setSuccess('Password reset token generated! You can now set your new password.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken.trim()) {
      setError('Reset token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithToken(resetToken, newPassword);
      setSuccess('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-accent selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[160px] pointer-events-none" />

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
          href="/login"
          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Main Recovery Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-[#101522]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />

          {/* Icon Badge */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/25">
            <KeyRound className="w-6 h-6 text-accent" />
          </div>

          <h1 className="text-2xl font-black text-center text-white tracking-tight mb-1.5">
            Reset Your Password
          </h1>
          <p className="text-xs text-center text-slate-400 leading-relaxed mb-6 font-medium">
            {step === 'request'
              ? 'Enter your registered email address to receive a secure password recovery token.'
              : 'Enter your recovery token and choose a new secure password.'}
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

          {/* STEP 1: REQUEST TOKEN */}
          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting Token...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Reset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: RESET PASSWORD */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recovery Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste recovery token"
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-[#0a0d16] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-accent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Remembered your credentials?{' '}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-600 font-mono">
        Solace Protocol • Zero-Trust Password Security &amp; Single-Use Tokens
      </footer>
    </div>
  );
}
