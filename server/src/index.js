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
