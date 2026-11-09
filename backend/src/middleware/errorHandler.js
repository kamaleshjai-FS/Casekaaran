/**
 * Casekaaran — Centralized Error Handling Middleware
 */
const logger = require('../utils/logger');
const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error(`[Unhandled API Error] ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message);

  return error(res, message, statusCode, err.code || 'INTERNAL_ERROR');
}

module.exports = errorHandler;
