/**
 * Casekaaran — WhatsApp Business Cloud API Notification Service
 */
const { GRAPH_URL, TOKEN, isMock } = require('../config/whatsapp');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Send localized template message via official Meta Graph API
 */
async function sendWhatsAppNotification({ orderId, orderNumber, phone, eventType, customerName, templateName, params = [], lang = 'en' }) {
  const cleanPhone = phone.replace(/\D/g, ''); // E.164 without plus

  // Template body parameters
  const templatePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang === 'hi' ? 'hi' : 'en' },
      components: [
        {
          type: 'body',
          parameters: params.map(val => ({ type: 'text', text: String(val) }))
        }
      ]
    }
  };

  logger.info(`[WhatsApp Service] Enqueuing notification for ${phone} | Event: ${eventType} | Template: ${templateName}`);

  // If in mock/dev mode
  if (isMock()) {
    logger.info(`[WhatsApp Mock Delivery] Delivered to ${cleanPhone}: "${templateName}" [Order: ${orderNumber}]`);
    await recordNotificationLog(orderId, phone, eventType, templateName, 'DELIVERED', `mock_msg_${Date.now()}`);
    return { success: true, message_id: `mock_msg_${Date.now()}` };
  }

  try {
    const res = await fetch(GRAPH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || `WhatsApp API error ${res.status}`;
      logger.error(`[WhatsApp API Failed]: ${errMsg}`);
      await recordNotificationLog(orderId, phone, eventType, templateName, 'FAILED', null, errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id || null;
    await recordNotificationLog(orderId, phone, eventType, templateName, 'SENT', messageId);
    return { success: true, message_id: messageId };
  } catch (err) {
    logger.error(`[WhatsApp Network Error]: ${err.message}`);
    await recordNotificationLog(orderId, phone, eventType, templateName, 'FAILED', null, err.message);
    return { success: false, error: err.message };
  }
}

async function recordNotificationLog(orderId, phone, eventType, templateName, status, msgId = null, errorMsg = null) {
  try {
    await db.query(
      `INSERT INTO notification_logs (order_id, recipient_phone, event_type, template_name, status, whatsapp_message_id, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId || 0, phone, eventType, templateName, status, msgId, errorMsg]
    );
  } catch (e) {
    logger.warn(`Failed to insert notification_log: ${e.message}`);
  }
}

module.exports = {
  sendWhatsAppNotification
};
