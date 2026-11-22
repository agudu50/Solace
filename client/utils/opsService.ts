/**
 * Issues, presence and live metrics.
 * Public: reportIssue, sendHeartbeat. Admin-only (server enforces): the rest.
 */

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('solace_auth_token');
    if (token) h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function call<T>(path: string, init: RequestInit = {}, fallbackError = 'Request failed.'): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: headers(), credentials: 'include' });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok || (data as any).success === false) throw new Error((data as any).error || fallbackError);
  return data as T;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface Issue {
  id: string;
  source: 'user' | 'system';
  kind: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  page: string | null;
  wallet_address: string | null;
  email: string | null;
  occurrences: number;
  status: IssueStatus;
  resolution_note: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface Presence {
  online: number;
  signedIn: number;
  anonymous: number;
  byPage: { path: string; count: number }[];
  visitors: {
    id: string;
    path: string;
    wallet: string | null;
    email: string | null;
    role: string | null;
    sessionSeconds: number;
    lastSeenSecondsAgo: number;
  }[];
}

export interface Metrics {
  windowMinutes: number;
  requests: number;
  errors5xx: number;
  errors4xx: number;
  errorRate: number;
  latency: { p50: number; p95: number };
  perMinute: { requests: number; errors: number }[];
  topRoutes: { route: string; count: number; errors: number; avgMs: number }[];
  uptimeSeconds: number;
}

export async function reportIssue(input: { title: string; description?: string; kind?: string; page?: string; context?: string }) {
  return call<{ id: string }>('/api/issues', { method: 'POST', body: JSON.stringify(input) }, 'Could not send your report.');
}

export async function sendHeartbeat(visitorId: string, path: string) {
  try {
    await fetch(`${API_BASE_URL}/api/presence`, {
      method: 'POST',
      headers: headers(),
      credentials: 'include',
      body: JSON.stringify({ visitorId, path }),
      keepalive: true,
    });
  } catch (_) {
    /* presence is best-effort */
  }
}

export async function fetchAdminIssues(status?: IssueStatus) {
  const q = status ? `?status=${status}` : '';
  return (await call<{ issues: Issue[] }>(`/api/admin/issues${q}`, {}, 'Failed to load issues.')).issues;
}

export async function updateAdminIssue(id: string, status: IssueStatus, note?: string) {
  return (
    await call<{ issue: Issue }>(
      `/api/admin/issues/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ status, note }) },
      'Failed to update issue.',
    )
  ).issue;
}

export async function fetchAdminPresence() {
  return (await call<{ presence: Presence }>('/api/admin/presence', {}, 'Failed to load presence.')).presence;
}

export async function fetchAdminMetrics() {
  return (await call<{ metrics: Metrics }>('/api/admin/metrics', {}, 'Failed to load metrics.')).metrics;
}
