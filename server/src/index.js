import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
      statusText = statusCode === 400 ? 'Bad Request' : statusCode === 404 ? 'Not Found' : 'Client Error';
    } else if (statusCode >= 500) {
      statusColor = red;
      statusText = 'Server Error';
    }

    const methodColor = req.method === 'POST' ? cyan : magenta;

    console.log(
      `${gray}[${timestamp}]${reset} ${bold}${methodColor}${req.method.padEnd(5)}${reset} ${req.originalUrl.padEnd(20)} ${bold}${statusColor}${statusCode} ${statusText}${reset} ${gray}(${duration}ms)${reset}`
    );
  });

  next();
});

// Routes
app.use('/api', auditRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Solace AI Security Audit Server',
    version: '0.1.0',
    endpoints: {
      health: 'GET /api/health',
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

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`  SOLACE AI SECURITY SERVER RUNNING`);
  console.log(`  Port:    http://localhost:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  Audit:   POST http://localhost:${PORT}/api/audit`);
  console.log('='.repeat(60));
});

export default app;
