/**
 * Casekaaran — Authoritative Payment Verification & Webhook Handler
 */
const db = require('../config/database');
const { commitStockReservation } = require('./inventoryService');
const { appendToPaidOrders } = require('./sheetsService');
const { sendWhatsAppNotification } = require('./whatsappService');
const logger = require('../utils/logger');

async function handleCashfreeWebhook({ eventId, eventType, signature, payload }) {
  // 1. Check Webhook Idempotency
  const [existing] = await db.query(
    `SELECT id, is_processed FROM payment_webhook_events WHERE event_id = ?`,
    [eventId]
  );

  if (existing && existing.length > 0) {
    logger.info(`[Payment Webhook] Duplicate event ${eventId} ignored (Idempotent OK).`);
    return { success: true, message: 'Event already processed' };
  }

  // 2. Record incoming webhook event
  await db.query(
    `INSERT INTO payment_webhook_events (event_id, event_type, signature_header, payload, is_processed)
     VALUES (?, ?, ?, ?, FALSE)`,
    [eventId, eventType, signature, JSON.stringify(payload)]
  );

  const orderData = payload?.data?.order || {};
  const paymentData = payload?.data?.payment || {};
  const cfOrderId = orderData.order_id;
  const paymentAmount = parseFloat(paymentData.payment_amount || orderData.order_amount);
  const paymentStatus = paymentData.payment_status; // 'SUCCESS', 'FAILED'

  if (!cfOrderId) {
    throw new Error('Missing order_id in webhook payload');
  }

  // 3. Process authoritative payment transition
  return await db.transaction(async (conn) => {
    const [orders] = await conn.execute(
      `SELECT o.id, o.order_number, o.total_amount, o.order_status, o.payment_status, c.phone, c.full_name, c.preferred_language
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.order_number = ?`,
      [cfOrderId]
    );

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${cfOrderId} not found for webhook`);
    }

    const order = orders[0];

    // Verify Amount
    if (Math.abs(parseFloat(order.total_amount) - paymentAmount) > 0.01) {
      logger.error(`[Payment Anomaly] Amount mismatch for ${cfOrderId}: Expected ${order.total_amount}, Got ${paymentAmount}`);
      await conn.execute(
        `UPDATE payments SET status = 'FAILED', failure_reason = 'Amount mismatch anomaly' WHERE cashfree_order_id = ?`,
        [cfOrderId]
      );
      return { success: false, message: 'Amount mismatch anomaly' };
    }

    if (paymentStatus === 'SUCCESS') {
      // Transition Payment -> PAID
      await conn.execute(
        `UPDATE payments 
         SET status = 'PAID', cashfree_payment_id = ?, paid_at = NOW() 
         WHERE cashfree_order_id = ?`,
        [String(paymentData.cf_payment_id || 'cf_test_pay'), cfOrderId]
      );

      // Transition Order -> CONFIRMED
      await conn.execute(
        `UPDATE orders 
         SET order_status = 'CONFIRMED', payment_status = 'PAID' 
         WHERE id = ?`,
        [order.id]
      );

      // Finalize stock reservation
      await commitStockReservation(conn, order.id);

      // Mark webhook processed
      await conn.execute(
        `UPDATE payment_webhook_events SET is_processed = TRUE, processed_at = NOW() WHERE event_id = ?`,
        [eventId]
      );

      // Trigger asynchronous post-payment jobs
      setImmediate(async () => {
        try {
          await appendToPaidOrders(order);
          await sendWhatsAppNotification({
            orderId: order.id,
            orderNumber: order.order_number,
            phone: order.phone,
            eventType: 'order_confirmed',
            customerName: order.full_name,
            templateName: 'order_confirmed',
            params: [order.full_name, order.order_number, `₹${order.total_amount}`],
            lang: order.preferred_language
          });
        } catch (e) {
          logger.error(`Error in post-payment background triggers: ${e.message}`);
        }
      });

      logger.info(`[Payment Webhook] Order ${cfOrderId} successfully verified as PAID & CONFIRMED.`);
      return { success: true, message: 'Payment verified and order confirmed' };
    } else {
      // Payment Failed
      await conn.execute(
        `UPDATE payments SET status = 'FAILED', failure_reason = ? WHERE cashfree_order_id = ?`,
        [paymentData.payment_message || 'Payment rejected by bank', cfOrderId]
      );
      return { success: true, message: 'Payment marked as failed' };
    }
  });
}

module.exports = {
  handleCashfreeWebhook
};
