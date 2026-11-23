'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Wallet,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertOctagon,
  ChevronLeft,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  Terminal,
  Cpu,
  Copy,
  Check,
  ShieldCheck,
  Fingerprint,
  ScrollText,
} from 'lucide-react';
import { useWallet } from '../../../context/WalletContext';
import { authenticateWalletSession } from '../../../utils/solaceService';

const DEV_ADMIN_ADDRESS = 'GBWSB2OVP5JIWGJND5C46TAIM7AQH5YJ56576CGOPG3AXAFNHO7FDYPI';
const SHOW_DEV_SIGNER = process.env.NODE_ENV !== 'production';
const STELLAR_ADDRESS_RE = /G[A-Z2-7]{55}/;

type AuthErrorKind = 'unauthorized' | 'no-freighter' | 'cancelled' | 'network' | 'generic';

interface AuthError {
  kind: AuthErrorKind;
  title: string;
  message: string;
  wallet?: string;
}

const STEPS = [
  { label: 'Connect', icon: Wallet },
  { label: 'Challenge', icon: ScrollText },
  { label: 'Sign', icon: Fingerprint },
  { label: 'Verify role', icon: ShieldCheck },
];

const shorten = (addr: string) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : '');

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? 'Copied' : label}
      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function CommandLine({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 p-2 pl-3 rounded-xl bg-slate-100 dark:bg-[#0e0e0e] border border-slate-200 dark:border-slate-800/80">
      <span className="text-slate-400 dark:text-slate-600 font-mono text-[11px] select-none">$</span>
      <code className="flex-1 min-w-0 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 break-all text-left">
        {command}
      </code>
      <CopyButton value={command} />
    </div>
  );
}

function classifyError(err: any, fallbackWallet: string): AuthError {
  const msg: string = err?.message || 'Authentication failed.';
  const lower = msg.toLowerCase();

  if (msg.includes('UNAUTHORIZED_ADMIN_WALLET') || lower.includes('not authorized for administrator')) {
    const wallet = msg.match(STELLAR_ADDRESS_RE)?.[0] || fallbackWallet;
    return {
      kind: 'unauthorized',
      title: 'Wallet not authorized',
      message: 'Your signature was valid, but this wallet has not been provisioned as an administrator.',
      wallet,
    };
  }
  if (msg.includes('FREIGHTER_NOT_INSTALLED')) {
    return {
      kind: 'no-freighter',
      title: 'Freighter not found',
      message: 'Install the Freighter browser extension, then reload this page.',
    };
  }
  if (msg.includes('NETWORK_MISMATCH')) {
    return {
      kind: 'network',
      title: 'Wrong network',
      message: msg.replace('NETWORK_MISMATCH: ', ''),
    };
  }
  if (lower.includes('cancel') || lower.includes('reject') || lower.includes('declined')) {
    return {
      kind: 'cancelled',
      title: 'Signature cancelled',
      message: 'The signing request was dismissed in Freighter. Try again and approve the challenge.',
    };
  }
  return { kind: 'generic', title: 'Authentication failed', message: msg };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { walletKey, isAdmin, freighterReady, authenticate, setWalletKeyDirectly } = useWallet();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    if (isAdmin) router.push('/admin');
  }, [isAdmin, router]);

  const grantAccess = () => {
    setStep(STEPS.length);
    setSuccess(true);
    setTimeout(() => router.push('/admin'), 900);
  };

  const handleAdminAuthenticate = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    setStep(0);
    // Advance through the visible stages while the wallet round-trip is in flight;
    // the Freighter popup appears during "Sign".
    const timers = [setTimeout(() => setStep(1), 350), setTimeout(() => setStep(2), 900)];

    try {
      const authUser = await authenticate('solace-admin-login');
      timers.forEach(clearTimeout);
      setStep(3);

      if (authUser.role === 'admin' || authUser.role === 'super_admin') {
        grantAccess();
      } else {
        setError({
          kind: 'unauthorized',
          title: 'Wallet not authorized',
          message: 'Your signature was valid, but this wallet does not hold an administrator role.',
          wallet: authUser.address || walletKey || undefined,
        });
        setStep(-1);
      }
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setError(classifyError(err, walletKey));
      setStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleDevSigner = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    setStep(1);
    try {
      const authRes = await authenticateWalletSession(DEV_ADMIN_ADDRESS, 'solace-admin-login');
      setStep(3);
      if (authRes.user.role === 'admin' || authRes.user.role === 'super_admin') {
        setWalletKeyDirectly(DEV_ADMIN_ADDRESS);
        grantAccess();
      } else {
        setError({
          kind: 'generic',
          title: 'Authentication failed',
          message: 'The development signer is not assigned an administrative role.',
        });
        setStep(-1);
      }
    } catch (err: any) {
      setError(classifyError(err, DEV_ADMIN_ADDRESS));
      setStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const freighterStatus =
    freighterReady === null
      ? { dot: 'bg-amber-400 animate-pulse', text: 'Detecting Freighter…' }
      : freighterReady
        ? { dot: 'bg-emerald-500', text: 'Freighter detected' }
        : { dot: 'bg-red-500', text: 'Freighter not installed' };

  const showStepper = loading || success;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-accent selection:text-white transition-colors duration-200">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,rgb(148_163_184/0.35)_1px,transparent_0)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-accent/10 blur-3xl"
      />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Solace</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <Lock className="w-3 h-3" />
            Admin gate
          </span>
        </div>

        <div className="max-w-md w-full bg-white/95 dark:bg-[#161616]/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/80 relative overflow-hidden transition-colors duration-200">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />

          <div className="p-6 sm:p-8 text-center">
            {/* Icon */}
            <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-2xl border transition-colors ${
                  success ? 'border-emerald-500/40' : 'border-accent/30 animate-[spin_10s_linear_infinite]'
                }`}
              />
              <div
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-colors ${
                  success
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 shadow-emerald-500/20'
                    : 'bg-accent/15 dark:bg-accent/20 border border-accent/30 dark:border-accent/40 text-accent shadow-accent/20'
                }`}
              >
                {success ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {success ? 'Access granted' : 'Administrator sign-in'}
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              {success
                ? 'Opening the platform console…'
                : 'Sign a one-time challenge with your provisioned Stellar wallet. No passwords, and your keys never leave Freighter.'}
            </p>

            {/* Environment status */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full ${freighterStatus.dot}`} />
                {freighterStatus.text}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">
                Testnet · Protocol 22
              </span>
              {walletKey && (
                <span
                  title={walletKey}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Wallet className="w-3 h-3" />
                  {shorten(walletKey)}
                </span>
              )}
            </div>

            {freighterReady === false && (
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Install Freighter <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Error */}
            {error && !loading && (
              <div
                role="alert"
                className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/80 text-left"
              >
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-800 dark:text-red-200">{error.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-red-700/90 dark:text-red-200/80">
                      {error.message}
                    </p>
                  </div>
                </div>

                {error.kind === 'unauthorized' && error.wallet && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 p-2 pl-3 rounded-xl bg-white/70 dark:bg-black/30 border border-red-200/70 dark:border-red-900/60">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-red-700/70 dark:text-red-300/60">
                        Wallet
                      </span>
                      <code className="flex-1 min-w-0 truncate text-[11px] font-mono text-slate-800 dark:text-slate-200">
                        {error.wallet}
                      </code>
                      <CopyButton value={error.wallet} />
                    </div>
                    <p className="text-[11px] text-red-700/80 dark:text-red-200/70">
                      A server operator can grant access from the <code className="font-mono">server</code> folder:
                    </p>
                    <CommandLine command={`npm run provision-admin -- ${error.wallet}`} />
                  </div>
                )}

                {error.kind === 'no-freighter' && (
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
                  >
                    Get Freighter <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Progress */}
            {showStepper && (
              <ol className="mb-5 grid grid-cols-4 gap-1" aria-label="Authentication progress">
                {STEPS.map(({ label, icon: Icon }, i) => {
                  const done = step > i;
                  const active = step === i;
                  return (
                    <li key={label} className="flex flex-col items-center gap-1.5">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                          done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : active
                              ? 'bg-accent/15 border-accent text-accent'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        {done ? (
                          <Check className="w-4 h-4" />
                        ) : active ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          done || active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {loading && step === 2 && (
              <p className="-mt-2 mb-4 text-[11px] text-slate-500 dark:text-slate-400">
                Approve the signature request in the Freighter popup.
              </p>
            )}

            {/* Primary action */}
            <button
              type="button"
              onClick={handleAdminAuthenticate}
              disabled={loading || success}
              className="w-full py-3.5 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl shadow-accent/30 transition-all duration-200 flex items-center justify-center gap-2 enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>{error ? 'Try again' : 'Sign in with Freighter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Development signer (hidden in production builds) */}
            {SHOW_DEV_SIGNER && (
              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDevSigner}
                  disabled={loading || success}
                  className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-medium transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  <span>Use development super-admin signer</span>
                </button>
                <p className="mt-1.5 text-[10px] text-slate-500 font-mono" title={DEV_ADMIN_ADDRESS}>
                  {shorten(DEV_ADMIN_ADDRESS)} · dev builds only
                </p>
              </div>
            )}
          </div>

          {/* Provisioning help */}
          <details className="group border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-black/20">
            <summary className="flex items-center justify-between gap-2 px-6 sm:px-8 py-3.5 cursor-pointer list-none text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                How do I add an administrator?
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 sm:px-8 pb-5 space-y-3 text-left">
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Admin roles can only be granted from the server environment. Run one of these from the{' '}
                <code className="font-mono text-slate-700 dark:text-slate-300">server</code> folder:
              </p>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Admin</p>
                <CommandLine command="npm run provision-admin -- <STELLAR_WALLET>" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Super-admin</p>
                <CommandLine command="npm run provision-admin -- <STELLAR_WALLET> --role super_admin" />
              </div>
            </div>
          </details>
        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-4 px-4 text-[11px] text-slate-500 dark:text-slate-600 font-mono">
        Role-based access · Ed25519 signature verification · Zero key exposure
      </footer>
    </div>
  );
}
