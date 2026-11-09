/**
 * Casekaaran — Supabase PostgreSQL Database Driver & Connection Pool
 * Built for Supabase / PostgreSQL with automatic fallback and query normalization
 */
const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;
let isMockMode = false;
let initPromise = null;

// Determine connection config from DATABASE_URL / SUPABASE_DB_URL or individual env vars
function getPgConfig() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (connectionString) {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    ssl: (process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('supabase')) ? { rejectUnauthorized: false } : undefined,
    max: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

/**
 * Translate MySQL SQL constructs to PostgreSQL / Supabase syntax
 */
function translateSql(sql) {
  let paramIndex = 1;
  // Convert ? to $1, $2, $3...
  let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

  // String Aggregation: GROUP_CONCAT(...) -> STRING_AGG(...)
  pgSql = pgSql.replace(/GROUP_CONCAT\s*\(\s*DISTINCT\s+([^)]+?)\s+SEPARATOR\s+('[^']+')\s*\)/gi, "STRING_AGG(DISTINCT $1, $2)");
  pgSql = pgSql.replace(/GROUP_CONCAT\s*\(\s*([^)]+?)\s+SEPARATOR\s+('[^']+')\s*\)/gi, "STRING_AGG($1, $2)");

  // Date Math: DATE_ADD(NOW(), INTERVAL 15 MINUTE) -> NOW() + INTERVAL '15 minutes'
  pgSql = pgSql.replace(/DATE_ADD\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+MINUTE\s*\)/gi, "NOW() + INTERVAL '$1 minutes'");

  // Upsert: ON DUPLICATE KEY UPDATE -> ON CONFLICT
  pgSql = pgSql.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE\s+courier_name\s*=\s*VALUES\s*\(\s*courier_name\s*\)\s*,\s*tracking_number\s*=\s*VALUES\s*\(\s*tracking_number\s*\)/gi, 
    "ON CONFLICT (order_id) DO UPDATE SET courier_name = EXCLUDED.courier_name, tracking_number = EXCLUDED.tracking_number");

  // Ensure INSERT statements capture returning ID if not present
  const trimmed = pgSql.trim();
  if (/^INSERT\s+INTO/i.test(trimmed) && !/RETURNING/i.test(trimmed)) {
    pgSql = `${trimmed} RETURNING id`;
  }

  return pgSql;
}

/**
 * Initialize Supabase PostgreSQL Connection Pool
 */
async function initDb() {
  if (pool) return pool;
  if (isMockMode) return null;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const config = getPgConfig();
      // If no valid DB credentials configured and not in production, use fallback
      if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL && (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '')) {
        throw new Error('No Supabase database credentials specified in environment');
      }

      const p = new Pool(config);
      const client = await p.connect();
      await client.query('SELECT 1');
      client.release();

      pool = p;
      logger.info(`[Supabase / Postgres] Successfully connected to database pool.`);
      return pool;
    } catch (err) {
      logger.warn(`[Supabase / Postgres] Remote instance not connected (${err.message}). Activating In-Memory Fallback Driver for local preview and testing.`);
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
      const pgSql = translateSql(sql);
      const res = await pool.query(pgSql, params);
      const rows = res.rows || [];
      rows.insertId = rows[0]?.id || 0;
      rows.affectedRows = res.rowCount || 0;
      return rows;
    } catch (err) {
      logger.error(`[PostgreSQL Query Error] SQL: ${sql} | Error: ${err.message}`);
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
    const client = await pool.connect();
    await client.query('BEGIN');

    const clientWrapper = {
      execute: async (sql, params = []) => {
        const pgSql = translateSql(sql);
        const res = await client.query(pgSql, params);
        const rows = res.rows || [];
        const meta = {
          insertId: rows[0]?.id || 0,
          affectedRows: res.rowCount || 0
        };
        rows.insertId = meta.insertId;
        rows.affectedRows = meta.affectedRows;
        return [rows, meta];
      },
      query: async (sql, params = []) => {
        const pgSql = translateSql(sql);
        const res = await client.query(pgSql, params);
        return [res.rows || []];
      }
    };

    try {
      const result = await callback(clientWrapper);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback transaction
  return await callback({
    execute: async (sql, params) => [executeMockQuery(sql, params)],
    query: async (sql, params) => [executeMockQuery(sql, params)]
  });
}

// In-Memory store for mock fallback
let phoneData = null;
try {
  phoneData = require('../../../frontend/js/phone-models-data');
} catch (e) {
  phoneData = null;
}

const mockStore = {
  brands: [
    { id: 1, name: 'Apple', slug: 'apple', icon: 'bi-apple', display_order: 1, is_active: 1 },
    { id: 2, name: 'Samsung', slug: 'samsung', icon: 'bi-phone', display_order: 2, is_active: 1 },
    { id: 3, name: 'OnePlus', slug: 'oneplus', icon: 'bi-phone', display_order: 3, is_active: 1 },
    { id: 4, name: 'Google Pixel', slug: 'google-pixel', icon: 'bi-google', display_order: 4, is_active: 1 },
    { id: 5, name: 'Xiaomi', slug: 'xiaomi', icon: 'bi-phone', display_order: 5, is_active: 1 },
    { id: 6, name: 'Motorola', slug: 'motorola', icon: 'bi-phone', display_order: 6, is_active: 1 },
    { id: 7, name: 'Redmi', slug: 'redmi', icon: 'bi-lightning-charge', display_order: 7, is_active: 1 },
    { id: 8, name: 'Nothing', slug: 'nothing', icon: 'bi-circle-half', display_order: 8, is_active: 1 }
  ],
  models: [
    { id: 1, brand_id: 1, name: 'iPhone 16 Pro Max', slug: 'iphone-16-pro-max', is_popular: 1, is_active: 1 },
    { id: 2, brand_id: 1, name: 'iPhone 16 Pro', slug: 'iphone-16-pro', is_popular: 1, is_active: 1 },
    { id: 3, brand_id: 1, name: 'iPhone 15 Pro', slug: 'iphone-15-pro', is_popular: 1, is_active: 1 },
    { id: 4, brand_id: 1, name: 'iPhone 15', slug: 'iphone-15', is_popular: 1, is_active: 1 },
    { id: 30, brand_id: 3, name: 'OnePlus 12', slug: 'oneplus-12', is_popular: 1, is_active: 1 },
    { id: 40, brand_id: 4, name: 'Pixel 9 Pro', slug: 'pixel-9-pro', is_popular: 1, is_active: 1 },
    // Samsung models from phoneData
    ...(phoneData && phoneData.models && phoneData.models.samsung ? phoneData.models.samsung.map(m => ({
      id: m.id,
      brand_id: 2,
      name: m.name,
      slug: m.slug,
      is_popular: 1,
      is_active: 1
    })) : [
      { id: 201, brand_id: 2, name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', is_popular: 1, is_active: 1 }
    ]),
    // Redmi models from phoneData
    ...(phoneData && phoneData.models && phoneData.models.redmi ? phoneData.models.redmi.map(m => ({
      id: m.id,
      brand_id: 7,
      name: m.name,
      slug: m.slug,
      is_popular: 1,
      is_active: 1
    })) : []),
    // Nothing models from phoneData
    ...(phoneData && phoneData.models && phoneData.models.nothing ? phoneData.models.nothing.map(m => ({
      id: m.id,
      brand_id: 8,
      name: m.name,
      slug: m.slug,
      is_popular: 1,
      is_active: 1
    })) : [])
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
    },
    {
      id: 5,
      case_type_id: 5,
      case_type: '3D Tactile Case',
      name: 'Scuderia Racing 3D Honeycomb Case',
      slug: 'scuderia-racing-3d-honeycomb-case',
      material: '3D Tactile Embossed TPU & Honeycomb Shock Shell',
      description: 'Physical 3D embossed Scuderia shield with Italian tricolor racing stripe and tactile hexagonal honeycomb mesh. Engineered with raised camera bezels and reinforced shock-absorbing bumper edges.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/trending-3d-ferrari-racing-studio.jpg',
      stock_quantity: 45
    },
    {
      id: 6,
      case_type_id: 5,
      case_type: '3D Tactile Case',
      name: 'Black Panther 3D Relief Armor Case',
      slug: 'black-panther-3d-relief-armor-case',
      material: 'Dual-Layer 3D Textured Polycarbonate & German TPU',
      description: 'Tactile 3D embossed geometric honeycomb relief in stealth matte black. Engineered for drop resistance with air-cushioned corners.',
      base_price: '499.00',
      original_price: '849.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg',
      stock_quantity: 38
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
    let result = mockStore.models;
    if (params && params.length > 0 && typeof params[0] === 'string') {
      const targetSlug = params[0].toLowerCase();
      const brand = mockStore.brands.find(b => b.slug === targetSlug || b.name.toLowerCase() === targetSlug);
      if (brand) {
        result = mockStore.models.filter(m => m.brand_id === brand.id);
      }
    }
    return result.map(m => {
      const b = mockStore.brands.find(br => br.id === m.brand_id);
      return {
        ...m,
        brand_name: b ? b.name : 'Brand',
        brand_slug: b ? b.slug : '',
        cases_count: 12
      };
    });
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
