'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Wallet,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import AuthShowcase from '../../components/auth/AuthShowcase';
import { Segmented } from '../../components/audit/StudioParts';
import { Chip } from '../../components/dashboard/Panel';
import { EASE_OUT, SplitWords } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

const input =
  'w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0e0e] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const { walletKey, user, loginWithEmail, authenticate, freighterReady, sessionLoading } = useWallet();

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!sessionLoading && (walletKey || user)) {
      router.replace(redirectTarget);
    }
  }, [sessionLoading, walletKey, user, redirectTarget, router]);

  const [activeTab, setActiveTab] = useState<'email' | 'wallet'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Wallet auth state
  const [walletLoading, setWalletLoading] = useState(false);
  const [authStep, setAuthStep] = useState('');

  // Feedback goes to the global toast stack
  const toast = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.show({ tone: 'error', title: 'Missing details', message: 'Please provide your email and password.' });
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Signed in', 'Redirecting…');
      setTimeout(() => {
        router.push(redirectTarget);
      }, 800);
    } catch (err: any) {
      toast.error(err, 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setWalletLoading(true);
    setAuthStep('Requesting authentication challenge…');

    try {
      setAuthStep('Waiting for Freighter signature…');
      await authenticate('solace-auth-login');
      toast.success('Wallet verified', 'Redirecting…');
      setTimeout(() => {
        router.push(redirectTarget);
      }, 800);
    } catch (err: any) {
      toast.error(err, 'Wallet connection was cancelled or rejected.');
    } finally {
      setWalletLoading(false);
      setAuthStep('');
    }
  };

  const switchTab = (t: 'email' | 'wallet') => setActiveTab(t);

  const signupHref =
    redirectTarget !== '/dashboard' ? `/signup?redirect=${encodeURIComponent(redirectTarget)}` : '/signup';

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 grid-lines pointer-events-none [mask-image:radial-gradient(ellipse_60%_70%_at_30%_40%,#000_20%,transparent_100%)]"
      />

      <main className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
        {/* Form column */}
        <div className="flex flex-col justify-center w-full max-w-md mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="flex items-center justify-between mb-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to home
            </Link>
            <Chip tone="accent" pulse>Protocol 22 · Testnet</Chip>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-medium tracking-tightest leading-[1.05] text-slate-900 dark:text-white">
            <SplitWords text="Welcome back" />
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            Sign in to manage your contract audits, review invariant checks and check your credit balance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
            className="mt-8"
          >
            <Segmented
              id="login-method"
              label="Sign-in method"
              value={activeTab}
              onChange={switchTab}
              options={[
                { value: 'email', label: <><Mail className="w-3.5 h-3.5" />Email</> },
                { value: 'wallet', label: <><Wallet className="w-3.5 h-3.5" />Stellar wallet</> },
              ]}
            />

            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'email' ? (
                <motion.form
                  key="email"
                  onSubmit={handleEmailLogin}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@example.com"
                        className={input}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={`${input} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`${btn.primary} w-full group`}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">You stay signed in until you close the browser.</p>
                </motion.form>
              ) : (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="mt-6 space-y-4"
                >
                  <dl className="rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] divide-y divide-slate-200 dark:divide-white/10 text-xs">
                    {[
                      ['Network', <span key="n" className="text-slate-900 dark:text-white">Stellar Testnet · Protocol 22</span>],
                      [
                        'Freighter',
                        <span key="f" className={`inline-flex items-center gap-1.5 ${freighterReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${freighterReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          {freighterReady ? 'Detected' : 'Checking…'}
                        </span>,
                      ],
                      ['Security', <span key="s" className="text-slate-900 dark:text-white">Non-custodial · zero key exposure</span>],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex items-center justify-between gap-4 px-3.5 h-10">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-mono text-right truncate">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Connect Freighter and sign a one-time challenge with your key. Your private key never leaves the extension.
                  </p>

                  <button type="button" onClick={handleWalletLogin} disabled={walletLoading} className={`${btn.primary} w-full`}>
                    {walletLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="truncate">{authStep || 'Authenticating wallet…'}</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Connect and sign in
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                New to Solace?{' '}
                <Link href={signupHref} className="text-slate-900 dark:text-white font-medium hover:text-accent transition-colors">
                  Create an account
                </Link>
              </span>
              <Link href="/admin/login" className="font-mono text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                Admin console →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* 3D showcase */}
        <motion.div
          initial={{ opacity: 0, rotateY: -12, x: 24 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: EASE_OUT }}
          style={{ transformPerspective: 1600 }}
          className="hidden lg:block"
        >
          <AuthShowcase />
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-[#f7f7f6] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
