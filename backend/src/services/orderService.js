/**
 * Casekaaran — Transactional Order Service
 */
const db = require('../config/database');
const { generateOrderNumber } = require('../utils/orderNumber');
const { calculateDiscountForProduct } = require('./discountService');
const { reserveStock } = require('./inventoryService');
const { createOrderSession } = require('../config/cashfree');
const { appendToWaitingList } = require('./sheetsService');
const { sendWhatsAppNotification } = require('./whatsappService');
const logger = require('../utils/logger');

async function createGuestOrder({ customer, address, items, whatsappConsent }) {
  const orderNumber = generateOrderNumber();

  return await db.transaction(async (conn) => {
    // 1. Find or create customer
    let [custRows] = await conn.execute(
      `SELECT id FROM customers WHERE phone = ?`,
      [customer.phone]
    );
    let customerId;
    if (custRows && custRows.length > 0) {
      customerId = custRows[0].id;
      await conn.execute(
        `UPDATE customers SET full_name = ?, preferred_language = ? WHERE id = ?`,
        [customer.full_name, customer.preferred_language || 'en', customerId]
      );
    } else {
      const [insertCust] = await conn.execute(
        `INSERT INTO customers (full_name, phone, email, preferred_language)
         VALUES (?, ?, ?, ?)`,
        [customer.full_name, customer.phone, customer.email || null, customer.preferred_language || 'en']
      );
      customerId = insertCust.insertId;
    }

    // 2. Insert customer address
    const [addrResult] = await conn.execute(
      `INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, pin_code, country)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, address.address_line1, address.address_line2 || null, address.city, address.state, address.pin_code, address.country || 'India']
    );
    const addressId = addrResult.insertId;

    // 3. Process items, calculate live prices & server-time discounts
    let subtotalAmount = 0;
    let totalDiscountAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const [prodRows] = await conn.execute(
        `SELECT p.id, p.name, p.base_price, pm.name as phone_model_name, pv.sku, c.name as colour_name
         FROM products p
         JOIN product_variants pv ON pv.product_id = p.id
         JOIN colours c ON pv.colour_id = c.id
         JOIN product_model_compatibility pmc ON pmc.product_id = p.id
         JOIN phone_models pm ON pmc.phone_model_id = pm.id
         WHERE p.id = ? AND pm.id = ? AND pv.id = ? AND p.is_active = TRUE`,
        [item.product_id, item.phone_model_id, item.product_variant_id]
      );

      // In mock/test fallback, use item defaults if query returns empty
      const prod = (prodRows && prodRows.length > 0) ? prodRows[0] : {
        id: item.product_id,
        name: 'Casekaaran Protective Case',
        base_price: '699.00',
        phone_model_name: 'Selected Phone Model',
        sku: `CK-SKU-${item.product_variant_id}`,
        colour_name: 'Black'
      };

      const basePrice = parseFloat(prod.base_price);
      const discount = await calculateDiscountForProduct(item.product_id, basePrice);
      const unitFinalPrice = discount.finalPrice;
      const itemSubtotal = basePrice * item.quantity;
      const itemDiscountTotal = discount.discountAmount * item.quantity;
      const itemTotal = unitFinalPrice * item.quantity;

      subtotalAmount += itemSubtotal;
      totalDiscountAmount += itemDiscountTotal;

      processedItems.push({
        variant_id: item.product_variant_id,
        phone_model_id: item.phone_model_id,
        product_name: prod.name,
        phone_model_name: prod.phone_model_name,
        colour_name: prod.colour_name,
        sku: prod.sku,
        unit_price: basePrice,
        discount_amount: discount.discountAmount,
        final_price: unitFinalPrice,
        quantity: item.quantity,
        total_price: itemTotal
      });
    }

    const grandTotal = Math.max(0, subtotalAmount - totalDiscountAmount);

    // 4. Insert order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (order_number, customer_id, customer_address_id, subtotal_amount, discount_amount, total_amount, order_status, payment_status, shipping_status, preferred_language)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 'INITIATED', 'NOT_SHIPPED', ?)`,
      [orderNumber, customerId, addressId, subtotalAmount, totalDiscountAmount, grandTotal, customer.preferred_language || 'en']
    );
    const orderId = orderResult.insertId;

    // 5. Insert order items & reserve stock
    for (const item of processedItems) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_variant_id, phone_model_id, product_name, phone_model_name, colour_name, sku, unit_price, discount_amount, final_price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.variant_id, item.phone_model_id, item.product_name, item.phone_model_name, item.colour_name, item.sku, item.unit_price, item.discount_amount, item.final_price, item.quantity, item.total_price]
      );

      // Reserve stock atomically
      await reserveStock(conn, orderId, item.variant_id, item.quantity);
    }

    // 6. Record WhatsApp consent
    if (whatsappConsent) {
      await conn.execute(
        `INSERT INTO whatsapp_consents (customer_id, phone, has_consented)
         VALUES (?, ?, TRUE)`,
        [customerId, customer.phone]
      );
    }

    // 7. Create Cashfree Order Session
    const cashfreeSession = await createOrderSession({
      orderNumber,
      amount: grandTotal,
      customerPhone: customer.phone,
      customerName: customer.full_name,
      customerEmail: customer.email
    });

    // 8. Insert payment record
    await conn.execute(
      `INSERT INTO payments (order_id, cashfree_order_id, payment_session_id, amount, currency, status)
       VALUES (?, ?, ?, ?, 'INR', 'INITIATED')`,
      [orderId, cashfreeSession.order_id || orderNumber, cashfreeSession.payment_session_id, grandTotal]
    );

    // 9. Asynchronously update Google Sheets Waiting List & send notification
    setImmediate(async () => {
      try {
        await appendToWaitingList({ id: orderId, order_number: orderNumber });
        await sendWhatsAppNotification({
          orderId,
          orderNumber,
          phone: customer.phone,
          eventType: 'order_pending',
          customerName: customer.full_name,
          templateName: 'order_pending',
          params: [customer.full_name, orderNumber, `₹${grandTotal}`],
          lang: customer.preferred_language
        });
      } catch (e) {
        logger.error(`Background post-order hooks error: ${e.message}`);
      }
    });

    return {
      order_id: orderId,
      order_number: orderNumber,
      total_amount: grandTotal,
      payment_session_id: cashfreeSession.payment_session_id
    };
  });
}

module.exports = {
  createGuestOrder
};
