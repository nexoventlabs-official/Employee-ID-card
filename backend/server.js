require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const employeesRouter = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// CORS_ORIGIN may be "*" or a comma-separated list of allowed origins.
const allowedOrigins =
  CORS_ORIGIN === '*'
    ? '*'
    : CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (allowedOrigins === '*' || !origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} not allowed`));
    },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'employee-id-card-backend' });
});

// Sample dashboard stats (in-memory; persistence not required for demo)
let stats = {
  totalGenerated: 0,
  totalUploads: 0,
  lastBatch: null,
};

app.get('/api/stats', (_req, res) => res.json(stats));

app.post('/api/stats/increment', (req, res) => {
  const { generated = 0 } = req.body || {};
  stats.totalGenerated += Number(generated) || 0;
  res.json(stats);
});

app.use('/api/employees', employeesRouter(stats));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
