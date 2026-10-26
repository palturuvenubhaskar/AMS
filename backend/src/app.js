require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.set('trust proxy', 1);
const http = require('http');

const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigin = process.env.CORS_ORIGIN;
    if (
      !origin || 
      /^http:\/\/localhost:\d+$/.test(origin) || 
      origin.endsWith('.vercel.app') || 
      origin === allowedOrigin ||
      allowedOrigin === '*'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again later.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ping & Health check
app.get(['/ping', '/api/ping'], (req, res) => {
  const rawUrl = process.env.DATABASE_URL || '';
  const maskedUrl = rawUrl.replace(/:([^@/]+)@/, ':****@');
  const passMatch = rawUrl.match(/:([^@/]+)@/);
  const passLength = passMatch ? passMatch[1].length : 0;
  const isTemplatePass = rawUrl.includes('YOUR-PASSWORD');

  res.json({
    status: 'pong',
    hasDbUrl: !!process.env.DATABASE_URL,
    maskedUrl,
    passLength,
    isTemplatePass,
    timestamp: new Date().toISOString()
  });
});

app.get(['/health', '/api/health'], async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        status: 'error',
        db: 'disconnected',
        error: 'DATABASE_URL environment variable is not configured in Vercel settings.'
      });
    }
    const db = require('./config/db');
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Routes
app.use(['/api/auth', '/auth'], authLimiter, authRoutes);
app.use('/api', apiRoutes);

// Frontend static build serving & SPA fallback
const distPath = path.resolve(__dirname, '../../dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

if (require.main === module) {
  // Start server only if run directly (e.g., node app.js)
  app.listen(PORT, () => {
    console.log(`\n🚀 AMS-FRS Backend running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
  });
}

app.app = app;
module.exports = app;
