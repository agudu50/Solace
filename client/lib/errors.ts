/**
 * Turns raw errors (driver, network, wallet) into something a person can act on.
 * Returns a short title plus the original text as `detail` when it was rewritten,
 * so the technical cause is still visible for debugging.
 */
export interface FriendlyError {
  title: string;
  message: string;
  detail?: string;
  kind: 'error' | 'info';
}

const RULES: { test: RegExp; title: string; message: string; kind?: 'error' | 'info' }[] = [
  {
    // node-postgres / database pool timeouts surfaced by the API
    test: /connection terminated|connection timeout|timeout expired|ETIMEDOUT|pool.*timeout/i,
    title: 'Server timed out',
    message: 'The Solace server took too long to respond. Please try again in a moment.',
  },
  {
    test: /failed to fetch|networkerror|network request failed|ECONNREFUSED|ERR_CONNECTION|load failed/i,
    title: "Can't reach Solace",
    message: 'Check your internet connection, or the API server may be offline.',
  },
  {
    test: /user (declined|rejected)|request (was )?(rejected|denied)|cancel+ed|cancel+ation|rejected by user|^cancelled$/i,
    title: 'Request cancelled',
    message: 'The request was cancelled in Freighter. Nothing was signed.',
    kind: 'info',
  },
  {
    // Challenge took longer than its 5-minute lifetime to sign, or was already used.
    test: /challenge (not found|has expired|.*expired|has already been used)/i,
    title: 'Sign-in request expired',
    message: 'The wallet sign-in request timed out. Click Connect wallet to start a fresh one.',
  },
  {
    test: /FREIGHTER_NOT_INSTALLED|freighter.*not (installed|found|detected)/i,
    title: 'Freighter not found',
    message: 'Install the Freighter browser extension to sign in with a Stellar wallet.',
  },
  {
    test: /NETWORK_MISMATCH/i,
    title: 'Wrong Stellar network',
    message: 'Switch Freighter to Stellar Testnet (Protocol 22) and try again.',
  },
  {
    test: /invalid (email|credentials|password)|incorrect password|unauthori[sz]ed|401/i,
    title: 'Sign-in failed',
    message: 'That email and password combination is not recognised.',
  },
  {
    test: /already (exists|registered|in use)|duplicate key|409/i,
    title: 'Account already exists',
    message: 'An account with this email already exists. Try signing in instead.',
  },
];

export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): FriendlyError {
  const raw =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string'
      ? (err as any).message
      : '';

  for (const r of RULES) {
    if (raw && r.test.test(raw)) {
      return { title: r.title, message: r.message, detail: raw, kind: r.kind ?? 'error' };
    }
  }
  return { title: 'Something went wrong', message: raw || fallback, kind: 'error' };
}
