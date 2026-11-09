/**
 * Casekaaran — Frontend Configuration Constants
 */
const CONFIG = {
  // Production vs Local fallback
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api', // When deployed, reverse-proxy or same origin
  DEFAULT_LANG: 'en',
  CURRENCY_SYMBOL: '₹',
  STORAGE_KEYS: {
    CART: 'casekaaran_cart',
    LANG: 'casekaaran_lang',
    ADMIN_TOKEN: 'casekaaran_admin_session',
    ACTIVE_BRAND: 'casekaaran_active_brand',
    ACTIVE_MODEL: 'casekaaran_active_model'
  },
  CASHFREE_MODE: 'sandbox', // 'sandbox' or 'production'
  WHATSAPP_SUPPORT_NUMBER: '+919876543210'
};

// Freeze configuration
Object.freeze(CONFIG);
