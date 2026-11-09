/**
 * Casekaaran — Admin Dashboard Operations Controller
 */
const db = require('../config/database');
const { sendWhatsAppNotification } = require('../services/whatsappService');
const { appendToPaidOrders, appendToWaitingList } = require('../services/sheetsService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get Dashboard KPIs
 */
async function getDashboardStats(req, res, next) {
  try {
    const [orderStats] = await db.query(
      `SELECT 
         COUNT(*) as totalOrders,
         COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END), 0) as paidOrders,
         COALESCE(SUM(CASE WHEN payment_status = 'PENDING' OR payment_status = 'INITIATED' THEN 1 ELSE 0 END), 0) as pendingPayments,
         COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) as totalRevenue
       FROM orders`
    );

    const [prodStats] = await db.query(
      `SELECT 
         COUNT(*) as activeProducts
       FROM products WHERE is_active = TRUE`
    );

    const [invStats] = await db.query(
      `SELECT COUNT(*) as lowStockCount 
       FROM inventory WHERE quantity <= low_stock_threshold`
    );

    const recentOrders = await db.query(
      `SELECT o.id, o.order_number, o.total_amount, o.order_status, o.payment_status, o.shipping_status, o.created_at,
              c.full_name as customer_name, c.phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    return success(res, {
      totalOrders: parseInt(orderStats?.totalOrders || 0, 10),
      paidOrders: parseInt(orderStats?.paidOrders || 0, 10),
      pendingPayments: parseInt(orderStats?.pendingPayments || 0, 10),
      totalRevenue: parseFloat(orderStats?.totalRevenue || 0),
      activeProducts: parseInt(prodStats?.activeProducts || 0, 10),
      lowStockCount: parseInt(invStats?.lowStockCount || 0, 10),
      recentOrders: recentOrders || []
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Orders
 */
async function getOrders(req, res, next) {
  try {
    const orders = await db.query(
      `SELECT o.id, o.order_number, o.total_amount, o.order_status, o.payment_status, o.shipping_status, o.created_at,
              c.full_name as customer_name, c.phone, c.email,
              sd.courier_name, sd.tracking_number
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       LEFT JOIN shipping_details sd ON sd.order_id = o.id
       ORDER BY o.created_at DESC`
    );

    return success(res, orders);
  } catch (err) {
    next(err);
  }
}

/**
 * Update Order Shipping Status & Trigger WhatsApp Notification
 */
async function updateOrderShipping(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const { shipping_status, courier_name, tracking_number } = req.body;

    const validStatuses = ['NOT_SHIPPED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'];
    if (!validStatuses.includes(shipping_status)) {
      return error(res, 'Invalid shipping status provided', 400, 'INVALID_STATUS');
    }

    const [orders] = await db.query(
      `SELECT o.id, o.order_number, c.phone, c.full_name, c.preferred_language 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.order_number = ?`,
      [orderNumber]
    );

    if (!orders || orders.length === 0) {
      return error(res, 'Order not found', 404, 'NOT_FOUND');
    }

    const order = orders[0];

    // Update order shipping status
    await db.query(
      `UPDATE orders SET shipping_status = ? WHERE id = ?`,
      [shipping_status, order.id]
    );

    // Update or insert shipping details
    await db.query(
      `INSERT INTO shipping_details (order_id, courier_name, tracking_number, tracking_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE courier_name = VALUES(courier_name), tracking_number = VALUES(tracking_number)`,
      [order.id, courier_name || null, tracking_number || null, tracking_number ? `https://track.casekaaran.com/${tracking_number}` : null]
    );

    // Trigger WhatsApp notification according to event
    let templateName = 'order_shipped';
    let params = [order.full_name, order.order_number];

    if (shipping_status === 'PACKED') {
      templateName = 'order_packed';
    } else if (shipping_status === 'SHIPPED') {
      templateName = 'order_shipped';
      params.push(courier_name || 'Express Courier', tracking_number || 'Available soon');
    } else if (shipping_status === 'OUT_FOR_DELIVERY') {
      templateName = 'out_for_delivery';
    } else if (shipping_status === 'DELIVERED') {
      templateName = 'order_delivered';
    }

    // Fire non-blocking WhatsApp event
    setImmediate(async () => {
      try {
        await sendWhatsAppNotification({
          orderId: order.id,
          orderNumber: order.order_number,
          phone: order.phone,
          eventType: shipping_status.toLowerCase(),
          customerName: order.full_name,
          templateName,
          params,
          lang: order.preferred_language
        });
      } catch (e) {
        logger.error(`Error sending shipping WhatsApp notification: ${e.message}`);
      }
    });

    return success(res, { order_number: orderNumber, shipping_status }, 'Shipping status updated and WhatsApp notification sent');
  } catch (err) {
    next(err);
  }
}

/**
 * Update Inventory Stock
 */
async function updateInventoryStock(req, res, next) {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return error(res, 'Valid non-negative stock quantity required', 400, 'VALIDATION_ERROR');
    }

    await db.query(
      `UPDATE inventory SET quantity = ? WHERE product_variant_id = ?`,
      [parseInt(quantity, 10), variantId]
    );

    return success(res, { variantId, quantity }, 'Inventory updated');
  } catch (err) {
    next(err);
  }
}

/**
 * Get Notification Logs
 */
async function getNotificationLogs(req, res, next) {
  try {
    const logs = await db.query(
      `SELECT nl.id, o.order_number, nl.recipient_phone, nl.event_type, nl.template_name, nl.status, nl.created_at
       FROM notification_logs nl
       JOIN orders o ON nl.order_id = o.id
       ORDER BY nl.created_at DESC
       LIMIT 50`
    );
    return success(res, logs);
  } catch (err) {
    next(err);
  }
}

/**
 * Manual Google Sheets Sync Trigger
 */
async function triggerSheetsSync(req, res, next) {
  try {
    const paidOrders = await db.query(
      `SELECT o.id, o.order_number, o.total_amount, c.full_name, c.phone 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.payment_status = 'PAID'
       LIMIT 20`
    );

    for (const ord of paidOrders) {
      await appendToPaidOrders(ord);
    }

    return success(res, { syncedCount: paidOrders.length }, 'Google Sheets synchronized successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getOrders,
  updateOrderShipping,
  updateInventoryStock,
  getNotificationLogs,
  triggerSheetsSync
};
