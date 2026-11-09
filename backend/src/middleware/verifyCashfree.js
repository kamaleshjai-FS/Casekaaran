/**
 * Casekaaran — Cashfree Webhook Signature Verification Middleware
 */
const { verifyWebhookSignature } = require('../config/cashfree');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

function verifyCashfreeWebhook(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

  // In test development environment, allow bypass if header not provided
  if (!signature && process.env.NODE_ENV !== 'production') {
    logger.warn('[Cashfree Webhook] Signature header missing in dev environment. Allowing passthrough.');
    return next();
  }

  const isValid = verifyWebhookSignature(rawBody, timestamp, signature);

  if (!isValid) {
    logger.error('[Cashfree Webhook] Webhook signature verification failed!');
    return error(res, 'Invalid webhook signature', 400, 'INVALID_SIGNATURE');
  }

  next();
}

module.exports = verifyCashfreeWebhook;
