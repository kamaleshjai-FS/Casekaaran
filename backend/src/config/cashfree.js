/**
 * Casekaaran — Cashfree Payments PG v2023-08-01 Configuration & Client
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || 'TEST_APP_ID';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY';
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';
const CASHFREE_ENV = (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();

const BASE_URL = CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

/**
 * Create Order Session on Cashfree
 */
async function createOrderSession({ orderNumber, amount, customerPhone, customerName, customerEmail }) {
  const payload = {
    order_id: orderNumber,
    order_amount: parseFloat(amount).toFixed(2),
    order_currency: 'INR',
    customer_details: {
      customer_id: customerPhone.replace(/\D/g, ''),
      customer_name: customerName,
      customer_email: customerEmail || 'customer@casekaaran.com',
      customer_phone: customerPhone.replace('+', '')
    },
    order_meta: {
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success.html?order_id=${orderNumber}&phone=${encodeURIComponent(customerPhone)}`,
      notify_url: `${process.env.API_BASE_URL || 'http://localhost:5000/api'}/webhooks/cashfree`
    }
  };

  // If in sandbox mode without real credentials, return simulated payment session
  if (CASHFREE_APP_ID === 'TEST_APP_ID' || CASHFREE_SECRET_KEY === 'TEST_SECRET_KEY') {
    logger.info(`[Cashfree Mock] Generated test session for order ${orderNumber} (${amount} INR)`);
    return {
      cf_order_id: `cf_order_${orderNumber}`,
      order_id: orderNumber,
      payment_session_id: `session_mock_${Date.now()}_${orderNumber}`,
      order_status: 'ACTIVE'
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': CASHFREE_API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Cashfree API error ${res.status}`);
    }

    return data;
  } catch (err) {
    logger.error(`[Cashfree Create Order Failed]: ${err.message}`);
    throw err;
  }
}

/**
 * Verify Webhook Signature using HMAC-SHA256
 */
function verifyWebhookSignature(rawBody, timestamp, signatureHeader) {
  if (!signatureHeader || !rawBody) return false;

  // In test environment
  if (CASHFREE_SECRET_KEY === 'TEST_SECRET_KEY') {
    return true;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(timestamp ? `${timestamp}${rawBody}` : rawBody)
      .digest('base64');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    logger.error(`[Cashfree Signature Verification Error]: ${err.message}`);
    return false;
  }
}

module.exports = {
  createOrderSession,
  verifyWebhookSignature,
  CASHFREE_APP_ID,
  CASHFREE_ENV
};
