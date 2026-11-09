/**
 * Casekaaran — Unified API Client & Toast Alert Service
 */
const API = (function () {
  /**
   * Display toast notification
   */
  function showToast(title, desc = '', type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `ck-toast ${type}`;
    toast.innerHTML = `
      <div style="flex:1;">
        <div class="ck-toast-title">${title}</div>
        ${desc ? `<div class="ck-toast-desc">${desc}</div>` : ''}
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Base HTTP Request
   */
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include' // Needed for secure HTTP-only session cookies
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      // In development / demo offline mode, provide mock fallback if API is unreachable
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        console.warn(`[API] Server unreachable at ${url}. Returning local fallback if available.`);
        return getLocalFallback(endpoint, options);
      }
      throw err;
    }
  }

  /**
   * Safe Fallback Data for offline static UI testing
   */
  function getLocalFallback(endpoint, options) {
    if (endpoint.includes('/brands')) {
      return {
        success: true,
        data: [
          { id: 1, name: 'Apple', slug: 'apple', icon: 'bi-apple', is_active: 1 },
          { id: 2, name: 'Samsung', slug: 'samsung', icon: 'bi-phone', is_active: 1 },
          { id: 3, name: 'OnePlus', slug: 'oneplus', icon: 'bi-phone', is_active: 1 },
          { id: 4, name: 'Google Pixel', slug: 'google-pixel', icon: 'bi-google', is_active: 1 },
          { id: 5, name: 'Xiaomi', slug: 'xiaomi', icon: 'bi-phone', is_active: 1 },
          { id: 6, name: 'Motorola', slug: 'motorola', icon: 'bi-phone', is_active: 1 }
        ]
      };
    }
    if (endpoint.includes('/models')) {
      return {
        success: true,
        data: [
          { id: 101, brand_id: 1, name: 'iPhone 16 Pro Max', slug: 'iphone-16-pro-max', is_popular: 1, cases_count: 8 },
          { id: 102, brand_id: 1, name: 'iPhone 16 Pro', slug: 'iphone-16-pro', is_popular: 1, cases_count: 8 },
          { id: 103, brand_id: 1, name: 'iPhone 15 Pro', slug: 'iphone-15-pro', is_popular: 1, cases_count: 12 },
          { id: 104, brand_id: 1, name: 'iPhone 15', slug: 'iphone-15', is_popular: 1, cases_count: 14 },
          { id: 201, brand_id: 2, name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', is_popular: 1, cases_count: 10 },
          { id: 202, brand_id: 2, name: 'Galaxy S24', slug: 'galaxy-s24', is_popular: 1, cases_count: 9 },
          { id: 301, brand_id: 3, name: 'OnePlus 12', slug: 'oneplus-12', is_popular: 1, cases_count: 7 },
          { id: 401, brand_id: 4, name: 'Pixel 9 Pro', slug: 'pixel-9-pro', is_popular: 1, cases_count: 6 }
        ]
      };
    }
    if (endpoint.includes('/products')) {
      return {
        success: true,
        data: [
          {
            id: 1,
            name: 'AeroShield MagSafe Matte Case',
            slug: 'aeroshield-magsafe-matte-case',
            base_price: 699,
            original_price: 999,
            image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
            case_type: 'MagSafe Matte',
            material: 'Polycarbonate & Shock-Absorbing TPU',
            compatible_models: ['iPhone 16 Pro Max', 'iPhone 15 Pro', 'Galaxy S24 Ultra'],
            stock_quantity: 24,
            is_featured: 1
          },
          {
            id: 2,
            name: 'Titan Armor Military Drop Defense Case',
            slug: 'titan-armor-military-drop-defense',
            base_price: 799,
            original_price: 1199,
            image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&auto=format&fit=crop&q=80',
            case_type: 'Rugged Armor',
            material: 'Dual-Layer Aerospace Polymer',
            compatible_models: ['iPhone 15 Pro', 'OnePlus 12', 'Galaxy S24 Ultra'],
            stock_quantity: 15,
            is_featured: 1
          },
          {
            id: 3,
            name: 'SilkyTouch Liquid Silicone Case',
            slug: 'silkytouch-liquid-silicone-case',
            base_price: 499,
            original_price: 799,
            image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
            case_type: 'Liquid Silicone',
            material: 'Food-Grade Microfiber Lined Silicone',
            compatible_models: ['iPhone 15', 'Pixel 9 Pro', 'Galaxy S24'],
            stock_quantity: 42,
            is_featured: 1
          },
          {
            id: 4,
            name: 'Heritage Handcrafted Vegan Leather Case',
            slug: 'heritage-vegan-leather-case',
            base_price: 899,
            original_price: 1299,
            image_url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80',
            case_type: 'Premium Leather',
            material: 'Grain Textured Vegan Leather',
            compatible_models: ['iPhone 16 Pro', 'Galaxy S24 Ultra'],
            stock_quantity: 8,
            is_featured: 1
          }
        ]
      };
    }
    return { success: false, message: 'Mock endpoint not implemented' };
  }

  return {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
    toast: showToast
  };
})();

window.API = API;
