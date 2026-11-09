/**
 * Casekaaran — Time-Based Discount Campaign Engine
 * Discounts are authoritatively calculated based on server time (UTC)
 */
const db = require('../config/database');
const logger = require('../utils/logger');

async function calculateDiscountForProduct(productId, basePrice) {
  try {
    const rows = await db.query(
      `SELECT d.id, d.name, d.discount_type, d.value
       FROM discounts d
       JOIN discount_products dp ON d.id = dp.discount_id
       WHERE dp.product_id = ?
         AND d.is_active = TRUE
         AND d.starts_at <= NOW()
         AND d.ends_at >= NOW()
       ORDER BY d.value DESC
       LIMIT 1`,
      [productId]
    );

    if (!rows || rows.length === 0) {
      return { discountAmount: 0, finalPrice: parseFloat(basePrice), discountName: null };
    }

    const discount = rows[0];
    let discountAmount = 0;

    if (discount.discount_type === 'PERCENTAGE') {
      discountAmount = (parseFloat(basePrice) * parseFloat(discount.value)) / 100;
    } else {
      discountAmount = parseFloat(discount.value);
    }

    discountAmount = Math.min(discountAmount, parseFloat(basePrice));
    const finalPrice = Math.max(0, parseFloat(basePrice) - discountAmount);

    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      discountName: discount.name
    };
  } catch (err) {
    logger.error(`Error calculating discount for product ${productId}: ${err.message}`);
    return { discountAmount: 0, finalPrice: parseFloat(basePrice), discountName: null };
  }
}

module.exports = {
  calculateDiscountForProduct
};
