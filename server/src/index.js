import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import auditRoutes from './routes/auditRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initDb } from './db/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database (Neon PostgreSQL with resilient fallback)
initDb().catch((err) => console.error('[!] Database initialization error:', err));

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and netlify previews
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Live Terminal Request Logger (logs method, path, 200 OK, latency)
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // ANSI color definitions
    const green = '\x1b[32m';
    const yellow = '\x1b[33m';
    const red = '\x1b[31m';
    const cyan = '\x1b[36m';
    const magenta = '\x1b[35m';
    const gray = '\x1b[90m';
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';

    let statusColor = green;
    let statusText = 'OK';
    if (statusCode >= 400 && statusCode < 500) {
      statusColor = yellow;
      statusText = statusCode === 400 ? 'Bad Request' : statusCode === 401 ? 'Unauthorized (Guest Session Check)' : statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Client Error';
    } else if (statusCode >= 500) {
      statusColor = red;
      statusText = 'Server Error';
    }

    const methodColor = req.method === 'POST' ? cyan : magenta;

    console.log(
      `${gray}[${timestamp}]${reset} ${bold}${methodColor}${req.method.padEnd(5)}${reset} ${req.originalUrl.padEnd(25)} ${bold}${statusColor}${statusCode} ${statusText}${reset} ${gray}(${duration}ms)${reset}`
    );
  });

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', auditRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Solace AI Security Audit Server',
    version: '0.2.0',
    authModel: 'Wallet-Only (Ed25519 Cryptographic Challenge)',
    endpoints: {
      health: 'GET /api/health',
      authChallenge: 'POST /api/auth/challenge',
      authVerify: 'POST /api/auth/verify',
      authMe: 'GET /api/auth/me',
      authLogout: 'POST /api/auth/logout',
      adminStats: 'GET /api/admin/stats',
      adminUsers: 'GET /api/admin/users',
      adminAudits: 'GET /api/admin/audits',
      adminPurchases: 'GET /api/admin/purchases',
      adminLogs: 'GET /api/admin/logs',
      audit: 'POST /api/audit',
    },
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[!] Server Error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`  SOLACE AI SECURITY SERVER RUNNING`);
  console.log(`  Port:    http://0.0.0.0:${PORT}`);
  console.log(`  Health:  /api/health`);
  console.log(`  Audit:   POST /api/audit`);
  console.log('='.repeat(60));
});

export default app;
