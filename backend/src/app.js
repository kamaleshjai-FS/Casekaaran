/**
 * Casekaaran — Express Application Setup
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { publicLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Allows loading icons, Google Fonts and Cashfree SDK
}));

// 2. CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow all web clients (Vercel, preview, custom domain, localhost)
    callback(null, true);
  },
  credentials: true
}));

// 3. Compression & Cookie Parser
app.use(compression());
app.use(cookieParser());

// 4. Body Parser with rawBody capture for Cashfree Webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhooks/cashfree')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// 5. Rate Limiting for Public APIs
app.use('/api', publicLimiter);

// 6. Mount REST API Routes
app.use('/api', routes);

// 7. Serve Frontend Static Files (Unified deployment or local preview)
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Fallback to index.html for SPA storefront routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
