/**
 * Casekaaran — Payment & Webhook Controller
 */
const { handleCashfreeWebhook } = require('../services/paymentService');
const db = require('../config/database');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['x-webhook-signature'] || 'dev_sig';
    const payload = req.body;
    const eventId = payload?.event_time || payload?.data?.payment?.cf_payment_id || `evt_${Date.now()}_${Math.random()}`;
    const eventType = payload?.type || 'PAYMENT_SUCCESS_WEBHOOK';

    logger.info(`[Webhook Controller] Received Cashfree event: ${eventType} (ID: ${eventId})`);

    const result = await handleCashfreeWebhook({
      eventId: String(eventId),
      eventType,
      signature,
      payload
    });

    return res.status(200).json({ status: 'OK', ...result });
  } catch (err) {
    logger.error(`[Webhook Controller Error]: ${err.message}`);
    // Always return 200 or 400 with clean JSON to prevent Cashfree continuous spamming on non-retryable format errors
    return res.status(400).json({ status: 'FAILED', message: err.message });
  }
}

async function getOrderStatus(req, res, next) {
  try {
    const { orderNumber } = req.params;

    const orders = await db.query(
      `SELECT o.order_number, o.order_status, o.payment_status, o.shipping_status, o.total_amount, o.created_at,
              sd.courier_name, sd.tracking_number, sd.tracking_url
       FROM orders o
       LEFT JOIN shipping_details sd ON sd.order_id = o.id
       WHERE o.order_number = ?`,
      [orderNumber]
    );

    if (!orders || orders.length === 0) {
      return error(res, 'Order not found', 404, 'NOT_FOUND');
    }

    return success(res, orders[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleWebhook,
  getOrderStatus
};
