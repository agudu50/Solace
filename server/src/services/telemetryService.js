/**
 * In-memory, real-time telemetry for the admin console:
 *   - presence: who has a Solace tab open right now (heartbeats)
 *   - request metrics: volume, error rate and latency over the last 15 minutes
 *
 * Kept in process memory on purpose: it is live, short-lived data. It resets on
 * restart and is per-process (run a shared store such as Redis if you ever
 * scale the API to several instances).
 */

const PRESENCE_TTL_MS = 75 * 1000; // client beats every 30s; allow one missed beat
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SAMPLES = 20000;

/** visitorId -> { lastSeen, path, wallet, email, role, firstSeen } */
const visitors = new Map();
/** ring of { t, ms, status, route } */
const samples = [];

export function recordHeartbeat(visitorId, { path, user }) {
  if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 64) return;
  const now = Date.now();
  const prev = visitors.get(visitorId);
  visitors.set(visitorId, {
    firstSeen: prev?.firstSeen ?? now,
    lastSeen: now,
    path: typeof path === 'string' ? path.slice(0, 200) : prev?.path || '/',
    wallet: user?.address || null,
    email: user?.email || null,
    role: user?.role || null,
  });
}

export function getPresence() {
  const now = Date.now();
  const online = [];
  for (const [id, v] of visitors) {
    if (now - v.lastSeen > PRESENCE_TTL_MS) visitors.delete(id);
    else online.push({ id, ...v });
  }
  const byPage = {};
  online.forEach((v) => {
    byPage[v.path] = (byPage[v.path] || 0) + 1;
  });
  return {
    online: online.length,
    signedIn: online.filter((v) => v.wallet || v.email).length,
    anonymous: online.filter((v) => !v.wallet && !v.email).length,
    byPage: Object.entries(byPage)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count),
    visitors: online
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .map(({ id, path, wallet, email, role, firstSeen, lastSeen }) => ({
        id: id.slice(0, 8),
        path,
        wallet,
        email,
        role,
        sessionSeconds: Math.round((lastSeen - firstSeen) / 1000),
        lastSeenSecondsAgo: Math.round((now - lastSeen) / 1000),
      })),
  };
}

/** Normalises '/api/admin/users/GABC…/status' → '/api/admin/users/:id/status'. */
export function routeKey(url) {
  return (url || '').split('?')[0].replace(/\/(G[A-Z0-9]{55}|iss_[a-f0-9]+|[0-9a-f]{24,}|\d+)(?=\/|$)/g, '/:id');
}

export function recordRequest({ url, status, ms }) {
  if ((url || '').startsWith('/api/presence')) return; // heartbeats would drown out real traffic
  samples.push({ t: Date.now(), ms, status, route: routeKey(url) });
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
}

export function getMetrics() {
  const now = Date.now();
  while (samples.length && now - samples[0].t > WINDOW_MS) samples.shift();

  const n = samples.length;
  const latencies = samples.map((s) => s.ms).sort((a, b) => a - b);
  const pct = (p) => (n ? latencies[Math.min(n - 1, Math.floor((p / 100) * n))] : 0);
  const errors5xx = samples.filter((s) => s.status >= 500).length;
  const errors4xx = samples.filter((s) => s.status >= 400 && s.status < 500).length;

  // Requests per minute for the last 15 minutes (oldest first)
  const perMinute = Array.from({ length: 15 }, () => ({ requests: 0, errors: 0 }));
  samples.forEach((s) => {
    const idx = 14 - Math.floor((now - s.t) / 60000);
    if (idx >= 0 && idx < 15) {
      perMinute[idx].requests += 1;
      if (s.status >= 500) perMinute[idx].errors += 1;
    }
  });

  const routes = {};
  samples.forEach((s) => {
    const r = (routes[s.route] ||= { route: s.route, count: 0, errors: 0, totalMs: 0 });
    r.count += 1;
    r.totalMs += s.ms;
    if (s.status >= 500) r.errors += 1;
  });

  return {
    windowMinutes: 15,
    requests: n,
    errors5xx,
    errors4xx,
    errorRate: n ? errors5xx / n : 0,
    latency: { p50: pct(50), p95: pct(95) },
    perMinute,
    topRoutes: Object.values(routes)
      .map((r) => ({ route: r.route, count: r.count, errors: r.errors, avgMs: Math.round(r.totalMs / r.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    uptimeSeconds: Math.round(process.uptime()),
  };
}
