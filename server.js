require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// Removed express-session and connect-mongo
// ...existing code...
const cookieFlash = require('./middleware/cookie-flash');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const connectDB = require('./config/db');
const { verifyToken, JWT_COOKIE_NAME } = require('./utils/jwt');
const User = require('./models/User');
const SiteSettings = require('./models/SiteSettings');
// ...existing code...

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production if required secrets are missing
if (isProduction) {
  const requiredEnv = ['MONGODB_URI', 'SESSION_SECRET', 'JWT_SECRET'];
  const missing = requiredEnv.filter((key) => !process.env[key] || !process.env[key].trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

// Connect to MongoDB
connectDB();

// Trust reverse proxy (Render, etc.) — fixes req.ip and rate limiting behind proxies
app.set('trust proxy', 1);

// Security — generate a per-request nonce for inline scripts
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  }
}));
const configuredOrigins = (process.env.CORS_ORIGIN || process.env.APP_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!isProduction) {
  configuredOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001');
}

const allowedOrigins = [...new Set(configuredOrigins)];

const isTrustedOrigin = (value) => {
  try {
    const parsed = new URL(value);
    return allowedOrigins.includes(parsed.origin);
  } catch (err) {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === 'null') {
      return callback(null, !isProduction);
    }
    if (allowedOrigins.length === 0) {
      return callback(null, !isProduction);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// CSRF mitigation for browser requests: enforce same-origin on state-changing methods.
// API routes are exempt — mobile clients use Bearer tokens, not cookies (CSRF doesn't apply).
app.use((req, res, next) => {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for API routes — they use Authorization header, not cookies
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');
  const hasConcreteOrigin = Boolean(origin) && origin !== 'null';

  if (hasConcreteOrigin && !isTrustedOrigin(origin)) {
    console.warn(`[CSRF BLOCKED] Origin mismatch: ${origin} | ${req.method} ${req.originalUrl}`);
    return res.status(403).send('Forbidden request origin');
  }

  if (referer && !isTrustedOrigin(referer)) {
    console.warn(`[CSRF BLOCKED] Referer mismatch: ${referer} | ${req.method} ${req.originalUrl}`);
    return res.status(403).send('Forbidden request referer');
  }

  if (isProduction && origin === 'null' && !referer) {
    console.warn(`[CSRF BLOCKED] Null origin without referer: ${req.method} ${req.originalUrl}`);
    return res.status(403).send('Forbidden request origin');
  }

  next();
});

// Handle CORS denials explicitly (avoid generic 500 responses)
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    console.warn(`[CORS BLOCKED] Origin: ${req.headers.origin || 'unknown'} | Path: ${req.originalUrl}`);
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  next(err);
});
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = res.getHeader('Retry-After') || 900;
    if (req.path.startsWith('/api/')) {
      return res.status(429).json({ success: false, message: 'Too many requests.', retryAfterSeconds: parseInt(retryAfter, 10) });
    }
    res.status(429).render('errors/rate-limit', {
      layout: 'layouts/main',
      title: 'Too Many Requests',
      retryAfter: parseInt(retryAfter, 10)
    });
  }
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                   // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = res.getHeader('Retry-After') || 900;
    if (req.path.startsWith('/api/')) {
      return res.status(429).json({ success: false, message: 'Too many attempts.', retryAfterSeconds: parseInt(retryAfter, 10) });
    }
    res.status(429).render('errors/rate-limit', {
      layout: 'layouts/auth',
      title: 'Too Many Attempts',
      retryAfter: parseInt(retryAfter, 10)
    });
  }
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/verify-otp', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/auth/reset-password', authLimiter);

// Rate limit public submission forms (anti-spam)
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = res.getHeader('Retry-After') || 900;
    res.status(429).render('errors/rate-limit', {
      layout: 'layouts/main',
      title: 'Too Many Submissions',
      retryAfter: parseInt(retryAfter, 10)
    });
  }
});
app.use('/complaint', publicFormLimiter);
app.use('/feedback', publicFormLimiter);
app.use('/track-complaint', publicFormLimiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookie parser (required for JWT httpOnly cookies)
app.use(cookieParser());

// Method override
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// ...existing code...

// ...existing code...

// Cookie-based flash
app.use(cookieFlash);

// Global variables
app.use(async (req, res, next) => {
  // Use cookie-based flash
  const flash = res.locals.getFlash();
  if (flash) {
    if (typeof flash.type === 'string' && flash.type.endsWith('_msg')) {
      res.locals[flash.type] = flash.msg;
    } else {
      res.locals[`${flash.type}_msg`] = flash.msg;
    }

    if (flash.type === 'success' || flash.type === 'success_msg') {
      res.locals.confirmation_msg = flash.msg;
      res.locals.admin_confirmation_msg = flash.msg;
    }
  }
  res.locals.appName = process.env.APP_NAME || 'Public Information Office Naujan';
  res.locals.appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;

  // Resolve user from JWT cookie for all routes (public + admin)
  if (!req.user) {
    try {
      const token = req.cookies[JWT_COOKIE_NAME];
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id)
            .populate('role')
            .populate('department')
            .select('-password');
          if (user && user.isActive) {
            req.user = user;
          }
        }
      }
    } catch (err) {
      // Token invalid or expired — continue as guest
    }
  }
  res.locals.user = req.user || null;

  // Load site logo for navbar/sidebar globally
  try {
    const _ss = await SiteSettings.getSettings();
    res.locals.siteLogo = _ss.heroLogo || '/uploads/images/pio-logo.png';
  } catch (_e) {
    res.locals.siteLogo = '/uploads/images/pio-logo.png';
  }

  next();
});

// REST API routes (v1) — JSON responses for mobile app
app.use('/api/v1', require('./routes/api/v1'));

// Routes
app.use('/', require('./routes/public'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/admin/announcements', require('./routes/announcements'));
app.use('/admin/events', require('./routes/events'));
app.use('/admin/documents', require('./routes/documents'));
app.use('/admin/transparency', require('./routes/transparency'));
app.use('/admin/feedback', require('./routes/feedback'));
app.use('/admin/complaints', require('./routes/complaints'));
app.use('/admin/services', require('./routes/services'));
app.use('/admin/departments', require('./routes/departments'));
app.use('/admin/users', require('./routes/users'));
app.use('/admin/disaster', require('./routes/disaster'));
app.use('/admin/settings', require('./routes/settings'));

// 404 handler
app.use((req, res) => {
  // Return JSON for API requests
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  res.status(404).render('errors/404', {
    layout: 'layouts/main',
    title: 'Page Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Return JSON for API requests
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
  res.status(500).render('errors/500', {
    layout: 'layouts/main',
    title: 'Server Error'
  });
});

const BASE_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_RETRIES = 10;

function startServer(port, retries = 0) {
  const server = app.listen(port, () => {
    console.log(`🏛️  LGU Naujan PIO System running on port ${port}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 URL: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && retries < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.log(`⚠️  Port ${port} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, retries + 1);
      return;
    }

    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
}

startServer(BASE_PORT);
