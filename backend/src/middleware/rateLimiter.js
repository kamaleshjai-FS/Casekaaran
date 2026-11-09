/**
 * Casekaaran — Rate Limiting Middleware
 * Protects against brute force logins and spam checkouts
 */
const rateLimit = require('express-rate-limit');

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Sustains high browsing traffic
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again shortly.' } }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'AUTH_RATE_LIMIT', message: 'Too many failed login attempts. Please wait 15 minutes.' } }
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'CHECKOUT_RATE_LIMIT', message: 'Checkout rate limit reached. Please wait a moment.' } }
});

module.exports = {
  publicLimiter,
  loginLimiter,
  checkoutLimiter
};
