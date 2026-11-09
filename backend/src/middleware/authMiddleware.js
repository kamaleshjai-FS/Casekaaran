/**
 * Casekaaran — Admin Authentication & Authorization Middleware
 * Verifies JWT from Secure HTTP-Only Cookies or Authorization header
 */
const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-casekaaran-jwt-secret-key-change-in-production-2026';
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'casekaaran_admin_token';

function authenticateAdmin(req, res, next) {
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // In local development preview mode, allow mock admin session if flag is passed
    if (process.env.NODE_ENV !== 'production' && req.headers['x-admin-dev-bypass'] === 'active') {
      req.admin = { id: 1, username: 'admin', role: 'SUPER_ADMIN' };
      return next();
    }
    return error(res, 'Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired session. Please sign in again.', 401, 'INVALID_SESSION');
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.admin) {
      return error(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.admin.role) && req.admin.role !== 'SUPER_ADMIN') {
      return error(res, 'Access denied. Insufficient permissions.', 403, 'FORBIDDEN');
    }

    next();
  };
}

module.exports = {
  authenticateAdmin,
  requireRole
};
