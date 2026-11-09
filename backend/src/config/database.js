/**
 * Casekaaran — MySQL Database Connection Pool
 * Uses mysql2/promise for async/await execution and transactions
 */
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool = null;
let isMockMode = false;
let initPromise = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'casekaaran_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '25', 10),
  queueLimit: 500,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

/**
 * Initialize MySQL Connection Pool
 */
async function initDb() {
  if (pool) return pool;
  if (isMockMode) return null;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const p = mysql.createPool(dbConfig);
      const connection = await p.getConnection();
      await connection.ping();
      connection.release();
      pool = p;
      logger.info(`[MySQL] Successfully connected to database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
      return pool;
    } catch (err) {
      logger.warn(`[MySQL] Managed MySQL instance not reachable at ${dbConfig.host}:${dbConfig.port} (${err.message}). Activating In-Memory Fallback Driver for local preview and testing.`);
      isMockMode = true;
      pool = null;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Execute parameterized query
 */
async function query(sql, params = []) {
  if (!pool && !isMockMode) {
    await initDb();
  }

  if (pool && !isMockMode) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      logger.error(`[MySQL Query Error] SQL: ${sql} | Error: ${err.message}`);
      throw err;
    }
  }

  // In-Memory Fallback Execution for offline preview
  return executeMockQuery(sql, params);
}

/**
 * Transaction Helper
 */
async function transaction(callback) {
  if (!pool && !isMockMode) {
    await initDb();
  }

  if (pool && !isMockMode) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Fallback transaction
  return await callback({
    execute: async (sql, params) => [executeMockQuery(sql, params)],
    query: async (sql, params) => [executeMockQuery(sql, params)]
  });
}

// In-Memory store for mock fallback
const mockStore = {
  brands: [
    { id: 1, name: 'Apple', slug: 'apple', icon: 'bi-apple', display_order: 1, is_active: 1 },
    { id: 2, name: 'Samsung', slug: 'samsung', icon: 'bi-phone', display_order: 2, is_active: 1 },
    { id: 3, name: 'OnePlus', slug: 'oneplus', icon: 'bi-phone', display_order: 3, is_active: 1 },
    { id: 4, name: 'Google Pixel', slug: 'google-pixel', icon: 'bi-google', display_order: 4, is_active: 1 },
    { id: 5, name: 'Xiaomi', slug: 'xiaomi', icon: 'bi-phone', display_order: 5, is_active: 1 },
    { id: 6, name: 'Motorola', slug: 'motorola', icon: 'bi-phone', display_order: 6, is_active: 1 }
  ],
  models: [
    { id: 101, brand_id: 1, name: 'iPhone 16 Pro Max', slug: 'iphone-16-pro-max', is_popular: 1, is_active: 1 },
    { id: 102, brand_id: 1, name: 'iPhone 16 Pro', slug: 'iphone-16-pro', is_popular: 1, is_active: 1 },
    { id: 103, brand_id: 1, name: 'iPhone 15 Pro', slug: 'iphone-15-pro', is_popular: 1, is_active: 1 },
    { id: 104, brand_id: 1, name: 'iPhone 15', slug: 'iphone-15', is_popular: 1, is_active: 1 },
    { id: 201, brand_id: 2, name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', is_popular: 1, is_active: 1 },
    { id: 301, brand_id: 3, name: 'OnePlus 12', slug: 'oneplus-12', is_popular: 1, is_active: 1 },
    { id: 401, brand_id: 4, name: 'Pixel 9 Pro', slug: 'pixel-9-pro', is_popular: 1, is_active: 1 }
  ],
  products: [
    {
      id: 1,
      case_type_id: 1,
      case_type: 'MagSafe Matte',
      name: 'AeroShield MagSafe Matte Case',
      slug: 'aeroshield-magsafe-matte-case',
      material: 'Polycarbonate & German TPU Edge Bumper',
      description: 'Engineered specifically for extreme drop protection with an integrated N52 Neodymium MagSafe magnetic ring.',
      base_price: '699.00',
      original_price: '999.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/product-aeroshield-magsafe.jpg',
      stock_quantity: 50
    },
    {
      id: 2,
      case_type_id: 2,
      case_type: 'Rugged Armor',
      name: 'Titan Armor Military Drop Defense Case',
      slug: 'titan-armor-military-drop-defense',
      material: 'Dual-Layer Aerospace Polymer',
      description: 'Engineered to withstand the toughest impacts. Featuring dual-layer perimeter defense.',
      base_price: '799.00',
      original_price: '1199.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/product-titan-armor.jpg',
      stock_quantity: 35
    },
    {
      id: 3,
      case_type_id: 3,
      case_type: 'Liquid Silicone',
      name: 'SilkyTouch Liquid Silicone Case',
      slug: 'silkytouch-liquid-silicone-case',
      material: 'Food-Grade Microfiber Lined Silicone',
      description: 'Ultra-soft liquid silicone exterior feels sublime in hand while absorbing shock.',
      base_price: '499.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/product-silkytouch-silicone.jpg',
      stock_quantity: 60
    },
    {
      id: 4,
      case_type_id: 4,
      case_type: 'Vegan Leather',
      name: 'Heritage Handcrafted Vegan Leather Case',
      slug: 'heritage-vegan-leather-case',
      material: 'Grain Textured Vegan Leather',
      description: 'Timeless luxury meets everyday durability wrapped in water-resistant vegan leather.',
      base_price: '899.00',
      original_price: '1299.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/product-heritage-leather.jpg',
      stock_quantity: 25
    }
  ],
  orders: [],
  payments: [],
  stock_reservations: [],
  webhook_events: new Set()
};

function executeMockQuery(sql, params) {
  const normalized = sql.toLowerCase();

  if (normalized.includes('select') && normalized.includes('from brands')) {
    return mockStore.brands;
  }
  if (normalized.includes('select') && normalized.includes('from phone_models')) {
    if (params.length > 0 && typeof params[0] === 'string') {
      const brand = mockStore.brands.find(b => b.slug === params[0]);
      if (brand) {
        return mockStore.models.filter(m => m.brand_id === brand.id);
      }
    }
    return mockStore.models;
  }
  if (normalized.includes('select') && normalized.includes('from products') && normalized.includes('where p.slug =')) {
    const slug = params[0];
    const found = mockStore.products.find(p => p.slug === slug) || mockStore.products[0];
    return [{
      ...found,
      images: JSON.stringify([found.image_url]),
      compatible_models: JSON.stringify(mockStore.models.slice(0, 4))
    }];
  }
  if (normalized.includes('select') && normalized.includes('from products')) {
    return mockStore.products.map(p => ({
      ...p,
      compatible_models: ['iPhone 16 Pro Max', 'iPhone 15 Pro', 'Galaxy S24 Ultra']
    }));
  }
  if (normalized.includes('insert into orders')) {
    const orderId = mockStore.orders.length + 1;
    mockStore.orders.push({ id: orderId, ...params });
    return { insertId: orderId, affectedRows: 1 };
  }
  if (normalized.includes('insert into customers')) {
    return { insertId: 101, affectedRows: 1 };
  }
  if (normalized.includes('insert into customer_addresses')) {
    return { insertId: 201, affectedRows: 1 };
  }
  if (normalized.includes('insert into payments')) {
    return { insertId: 301, affectedRows: 1 };
  }
  if (normalized.includes('insert into stock_reservations')) {
    return { insertId: 401, affectedRows: 1 };
  }
  if (normalized.includes('update inventory')) {
    return { affectedRows: 1 };
  }
  return [];
}

module.exports = {
  initDb,
  query,
  transaction,
  isMockMode: () => isMockMode
};
