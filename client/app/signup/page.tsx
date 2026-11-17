'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Wallet, Loader2, ChevronLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/ToastContext';
import AuthShowcase from '../../components/auth/AuthShowcase';
import { Chip } from '../../components/dashboard/Panel';
import { EASE_OUT, SplitWords } from '../../components/landing/motion';
import { btn } from '../../components/landing/primitives';

const inputBase =
  'w-full h-10 rounded-md border bg-white dark:bg-[#0e0e0e] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2';
const inputOk = 'border-slate-200 dark:border-white/10 focus:border-accent focus:ring-accent/20';
const inputBad = 'border-red-400 dark:border-red-500/60 focus:border-red-500 focus:ring-red-500/20';

type Field = 'name' | 'email' | 'password' | 'confirm';

function getPasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: '' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  return { score, label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}

const STRENGTH_COLOR = ['bg-red-400', 'bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const { registerWithEmail, authenticate, walletKey, user, sessionLoading } = useWallet();
  const toast = useToast();

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!sessionLoading && (walletKey || user)) {
      router.replace(redirectTarget);
    }
  }, [sessionLoading, walletKey, user, redirectTarget, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  // Inline errors appear after the first submit attempt, then update live.
  const [submitted, setSubmitted] = useState(false);

  const strength = getPasswordStrength(password);

  const errors: Partial<Record<Field, string>> = {};
  if (!name.trim()) errors.name = 'Please enter your full name.';
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';
  if (password !== confirmPassword) errors.confirm = 'Passwords do not match.';
  const show = (f: Field) => (submitted ? errors[f] : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      const first = (['name', 'email', 'password', 'confirm'] as Field[]).find((f) => errors[f]);
      if (first) document.getElementById(`signup-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(name, email, password);
      toast.success('Account created', 'Redirecting…');
      setTimeout(() => {
        router.push(redirectTarget);
      }, 800);
    } catch (err: any) {
      toast.error(err, 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSignup = async () => {
    setWalletLoading(true);
    try {
      await authenticate('solace-auth-login');
      toast.success('Wallet verified', 'Redirecting…');
      setTimeout(() => {
        router.push(redirectTarget);
      }, 800);
    } catch (err: any) {
      toast.error(err, 'Wallet connection was cancelled.');
    } finally {
      setWalletLoading(false);
    }
  };

  const loginHref =
    redirectTarget !== '/dashboard' ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login';

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 grid-lines pointer-events-none [mask-image:radial-gradient(ellipse_60%_70%_at_30%_40%,#000_20%,transparent_100%)]"
      />

      <main className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
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
            <SplitWords text="Create your account" />
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            Run AI-powered Soroban contract audits and buy prepaid audit credits.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
            className="mt-8 space-y-4"
          >
            <FieldRow id="signup-name" label="Full name" icon={User} error={show('name')}>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                aria-invalid={Boolean(show('name'))}
                aria-describedby={show('name') ? 'signup-name-err' : undefined}
                className={`${inputBase} ${show('name') ? inputBad : inputOk}`}
              />
            </FieldRow>

            <FieldRow id="signup-email" label="Email" icon={Mail} error={show('email')}>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                aria-invalid={Boolean(show('email'))}
                aria-describedby={show('email') ? 'signup-email-err' : undefined}
                className={`${inputBase} ${show('email') ? inputBad : inputOk}`}
              />
            </FieldRow>

            <FieldRow id="signup-password" label="Password" icon={Lock} error={show('password')}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                aria-invalid={Boolean(show('password'))}
                aria-describedby="signup-password-strength"
                className={`${inputBase} pr-10 ${show('password') ? inputBad : inputOk}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </FieldRow>

            {/* Strength meter */}
            <AnimatePresence initial={false}>
              {password && (
                <motion.div
                  id="signup-password-strength"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="overflow-hidden -mt-1"
                >
                  <div className="grid grid-cols-4 gap-1.5" aria-hidden>
                    {[1, 2, 3, 4].map((seg) => (
                      <span key={seg} className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <motion.span
                          className={`block h-full ${STRENGTH_COLOR[strength.score]}`}
                          initial={false}
                          animate={{ scaleX: strength.score >= seg ? 1 : 0 }}
                          style={{ originX: 0 }}
                          transition={{ duration: 0.3, ease: EASE_OUT }}
                        />
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                    <span>Strength</span>
                    <span className="text-slate-900 dark:text-white">{strength.label}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <FieldRow id="signup-confirm" label="Confirm password" icon={Lock} error={show('confirm')}>
              <input
                id="signup-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={Boolean(show('confirm'))}
                aria-describedby={show('confirm') ? 'signup-confirm-err' : undefined}
                className={`${inputBase} pr-10 ${show('confirm') ? inputBad : inputOk}`}
              />
              <AnimatePresence>
                {confirmPassword && confirmPassword === password && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500"
                    aria-label="Passwords match"
                  >
                    <Check className="w-3 h-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </FieldRow>

            <button type="submit" disabled={loading} className={`${btn.primary} w-full group !mt-6`}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="eyebrow">Or</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <button type="button" onClick={handleWalletSignup} disabled={walletLoading} className={`${btn.secondary} w-full`}>
              {walletLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  Connecting wallet…
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-accent" />
                  Continue with Freighter wallet
                </>
              )}
            </button>

            <p className="pt-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500">
              Already have an account?{' '}
              <Link href={loginHref} className="text-slate-900 dark:text-white font-medium hover:text-accent transition-colors">
                Sign in
              </Link>
            </p>
          </motion.form>
        </div>

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

function FieldRow({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400'}`} />
        {children}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-err`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden text-xs text-red-600 dark:text-red-400 pt-1.5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-[#f7f7f6] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
