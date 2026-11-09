/**
 * Casekaaran — Checkout Controller
 */
const { createGuestOrder } = require('../services/orderService');
const { success, error } = require('../utils/response');

async function processCheckout(req, res, next) {
  try {
    const { customer, address, items, whatsapp_consent } = req.body;

    // Strict input validation
    if (!customer || !customer.full_name || !customer.phone) {
      return error(res, 'Customer name and phone number are required', 400, 'VALIDATION_ERROR');
    }

    if (!address || !address.address_line1 || !address.city || !address.state || !address.pin_code) {
      return error(res, 'Complete delivery address and 6-digit PIN code are required', 400, 'VALIDATION_ERROR');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return error(res, 'Your cart is empty. Please add compatible cases to proceed.', 400, 'EMPTY_CART');
    }

    for (const item of items) {
      if (!item.product_id || !item.phone_model_id || !item.quantity || item.quantity <= 0) {
        return error(res, 'Invalid cart item payload: missing product or phone model compatibility', 400, 'INVALID_ITEM');
      }
    }

    const orderResult = await createGuestOrder({
      customer,
      address,
      items,
      whatsappConsent: Boolean(whatsapp_consent)
    });

    return success(res, orderResult, 'Order initiated successfully. Proceed to payment.', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processCheckout
};
