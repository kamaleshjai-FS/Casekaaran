/**
 * Casekaaran — Application Constants & Lifecycle States
 */
module.exports = {
  // Order Statuses
  ORDER_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
  },

  // Payment Statuses
  PAYMENT_STATUS: {
    INITIATED: 'INITIATED',
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
    REFUNDED: 'REFUNDED'
  },

  // Shipping Statuses
  SHIPPING_STATUS: {
    NOT_SHIPPED: 'NOT_SHIPPED',
    PACKED: 'PACKED',
    SHIPPED: 'SHIPPED',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED'
  },

  // Stock Reservation TTL (15 minutes in milliseconds)
  RESERVATION_TTL_MS: 15 * 60 * 1000,

  // Discount Types
  DISCOUNT_TYPE: {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT'
  },

  // WhatsApp Notification Events
  WHATSAPP_EVENTS: {
    ORDER_PENDING: 'order_pending',
    PAYMENT_VERIFIED: 'payment_verified',
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_PACKED: 'order_packed',
    ORDER_SHIPPED: 'order_shipped',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    REFUND_INITIATED: 'refund_initiated'
  },

  // Google Sheets Sheet Names
  SHEET_NAMES: {
    WAITING_LIST: 'Waiting List',
    PAID_ORDERS: 'Paid Orders',
    INVENTORY: 'Inventory'
  }
};
