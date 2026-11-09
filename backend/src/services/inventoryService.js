/**
 * Casekaaran — Atomic Inventory & Stock Reservation Service
 * Prevents overselling under high concurrency
 */
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Atomically reserve stock for an order (15-minute lock)
 */
async function reserveStock(connection, orderId, variantId, quantity) {
  // 1. Atomic decrement
  const [result] = await connection.execute(
    `UPDATE inventory 
     SET quantity = quantity - ? 
     WHERE product_variant_id = ? AND quantity >= ?`,
    [quantity, variantId, quantity]
  );

  if (!result || result.affectedRows === 0) {
    throw new Error(`Insufficient stock for product variant ${variantId}`);
  }

  // 2. Insert reservation record with 15-minute expiration
  await connection.execute(
    `INSERT INTO stock_reservations (order_id, product_variant_id, quantity, expires_at, status)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'ACTIVE')`,
    [orderId, variantId, quantity]
  );

  // 3. Log movement
  await connection.execute(
    `INSERT INTO inventory_movements (product_variant_id, change_quantity, balance_quantity, movement_type, reference_id, notes)
     SELECT ?, -?, quantity, 'ORDER_RESERVED', ?, '15-min stock hold for checkout'
     FROM inventory WHERE product_variant_id = ?`,
    [variantId, quantity, String(orderId), variantId]
  );

  return true;
}

/**
 * Commit reservation when payment succeeds
 */
async function commitStockReservation(connection, orderId) {
  await connection.execute(
    `UPDATE stock_reservations
     SET status = 'COMMITTED'
     WHERE order_id = ? AND status = 'ACTIVE'`,
    [orderId]
  );

  await connection.execute(
    `INSERT INTO inventory_movements (product_variant_id, change_quantity, balance_quantity, movement_type, reference_id, notes)
     SELECT sr.product_variant_id, 0, i.quantity, 'ORDER_DEDUCTED', ?, 'Stock reservation finalized after verified payment'
     FROM stock_reservations sr
     JOIN inventory i ON sr.product_variant_id = i.product_variant_id
     WHERE sr.order_id = ?`,
    [String(orderId), orderId]
  );
}

/**
 * Release expired reservations back to inventory
 */
async function releaseExpiredReservations() {
  try {
    const expired = await db.query(
      `SELECT id, order_id, product_variant_id, quantity
       FROM stock_reservations
       WHERE status = 'ACTIVE' AND expires_at < NOW()`
    );

    if (!expired || expired.length === 0) return 0;

    logger.info(`[Stock Service] Releasing ${expired.length} expired stock reservations back to inventory`);

    for (const res of expired) {
      await db.transaction(async (conn) => {
        // Return stock
        await conn.execute(
          `UPDATE inventory SET quantity = quantity + ? WHERE product_variant_id = ?`,
          [res.quantity, res.product_variant_id]
        );
        // Mark reservation released
        await conn.execute(
          `UPDATE stock_reservations SET status = 'RELEASED' WHERE id = ?`,
          [res.id]
        );
        // Log movement
        await conn.execute(
          `INSERT INTO inventory_movements (product_variant_id, change_quantity, balance_quantity, movement_type, reference_id, notes)
           SELECT ?, ?, quantity, 'ORDER_CANCELLED_RESTOCK', ?, 'Expired checkout reservation released'
           FROM inventory WHERE product_variant_id = ?`,
          [res.product_variant_id, res.quantity, String(res.order_id), res.product_variant_id]
        );
      });
    }

    return expired.length;
  } catch (err) {
    logger.error(`Error releasing expired reservations: ${err.message}`);
    return 0;
  }
}

module.exports = {
  reserveStock,
  commitStockReservation,
  releaseExpiredReservations
};
