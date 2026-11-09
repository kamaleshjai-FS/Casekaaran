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
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Black Panther 3D Relief Armor Case',
      slug: 'black-panther-3d-relief-armor-case',
      material: 'Dual-Layer 3D Textured Polycarbonate & German TPU',
      description: 'Tactile 3D embossed geometric honeycomb relief in stealth matte black. Engineered for drop resistance with air-cushioned corners.',
      base_price: '499.00',
      original_price: '849.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg',
      stock_quantity: 38,
      variant_id: 7,
      variant_sku: '3D-PAN-ARM',
      phone_model_ids: [109, 120, 201, 223, 301, 302],
      compatible_models: 'A15/M15/F15, S24 ULTRA, MI 12 5G / POCO M6 PRO, MI NOTE 13 PRO 5G, NOTHING CMF 1, NOTHING 2A'
    },
    // ------------------------------------------------------------------------
    // 18 DEMO PRODUCTS (3 Designs x 6 Verified Compatibility Groups)
    // ------------------------------------------------------------------------
    // Samsung A15 / M15 / F15 (Model 109)
    {
      id: 11,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Samsung A15 / M15 / F15',
      slug: 'crystal-clear-3d-case-samsung-a15-m15-f15',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Optical 4H scratch-resistant acrylic backplate engineered with 3D micro-dot matrix to prevent watermarks. Precision laser cutouts for Key Island triple camera setup.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 35,
      variant_id: 11,
      variant_sku: 'DEMO-CLR-SAM-A15',
      brand_slug: 'samsung',
      phone_model_ids: [109],
      compatible_models: 'A15/M15/F15'
    },
    {
      id: 12,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Samsung A15 / M15 / F15',
      slug: 'midnight-art-edition-samsung-a15-m15-f15',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Signature physical 3D embossed tactile backplate featuring Italian tricolor racing accent stripe and hexagonal honeycomb shock matrix. Engineered for superior grip.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 40,
      variant_id: 12,
      variant_sku: 'DEMO-ART-SAM-A15',
      brand_slug: 'samsung',
      phone_model_ids: [109],
      compatible_models: 'A15/M15/F15'
    },
    {
      id: 13,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Samsung A15 / M15 / F15',
      slug: 'premium-armor-case-samsung-a15-m15-f15',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'Military drop-defense case engineered with dual-layer polymer protection, reinforced impact corner airbags, and full-coverage Key Island camera frame.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 25,
      variant_id: 13,
      variant_sku: 'DEMO-ARM-SAM-A15',
      brand_slug: 'samsung',
      phone_model_ids: [109],
      compatible_models: 'A15/M15/F15'
    },

    // Samsung S24 Ultra (Model 120)
    {
      id: 14,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Samsung S24 Ultra',
      slug: 'crystal-clear-3d-case-samsung-s24-ultra',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Crystal-clear 4H hardened backplate showcasing the Titanium chassis of the S24 Ultra. Form-fitting laser cutouts for quad camera lenses and S-Pen slot.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 35,
      variant_id: 14,
      variant_sku: 'DEMO-CLR-SAM-S24U',
      brand_slug: 'samsung',
      phone_model_ids: [120],
      compatible_models: 'S24 ULTRA'
    },
    {
      id: 15,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Samsung S24 Ultra',
      slug: 'midnight-art-edition-samsung-s24-ultra',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Flagship tactile 3D relief shell with high-density hexagonal shock absorbers and Scuderia racing accents. Boxy frame alignment matching S24 Ultra geometry.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 45,
      variant_id: 15,
      variant_sku: 'DEMO-ART-SAM-S24U',
      brand_slug: 'samsung',
      phone_model_ids: [120],
      compatible_models: 'S24 ULTRA'
    },
    {
      id: 16,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Samsung S24 Ultra',
      slug: 'premium-armor-case-samsung-s24-ultra',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'Extreme 15-foot military drop-certified armor engineered for Galaxy S24 Ultra. Dual-layer defense with recessed screen edge bumpers and S-Pen chamber.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 30,
      variant_id: 16,
      variant_sku: 'DEMO-ARM-SAM-S24U',
      brand_slug: 'samsung',
      phone_model_ids: [120],
      compatible_models: 'S24 ULTRA'
    },

    // Redmi Note 13 Pro 5G (Model 223)
    {
      id: 17,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Redmi Note 13 Pro 5G',
      slug: 'crystal-clear-3d-case-redmi-note-13-pro-5g',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Pure clarity backplate custom cut for the Redmi Note 13 Pro 5G geometric camera island. Anti-yellowing UV barrier and elevated bumper bezels.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 30,
      variant_id: 17,
      variant_sku: 'DEMO-CLR-REDMI-N13P',
      brand_slug: 'redmi',
      phone_model_ids: [223],
      compatible_models: 'MI NOTE 13 PRO 5G'
    },
    {
      id: 18,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Redmi Note 13 Pro 5G',
      slug: 'midnight-art-edition-redmi-note-13-pro-5g',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Tactile 3D textured backplate with Italian tricolor accent bar and anti-slip honeycomb grid. Molded to Redmi Note 13 Pro 5G exact contours.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 40,
      variant_id: 18,
      variant_sku: 'DEMO-ART-REDMI-N13P',
      brand_slug: 'redmi',
      phone_model_ids: [223],
      compatible_models: 'MI NOTE 13 PRO 5G'
    },
    {
      id: 19,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Redmi Note 13 Pro 5G',
      slug: 'premium-armor-case-redmi-note-13-pro-5g',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'Heavy-duty rugged defense case with raised camera visor ring and shock-absorbing internal matrix. Certified drop protection.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 25,
      variant_id: 19,
      variant_sku: 'DEMO-ARM-REDMI-N13P',
      brand_slug: 'redmi',
      phone_model_ids: [223],
      compatible_models: 'MI NOTE 13 PRO 5G'
    },

    // Redmi 12 5G / POCO M6 Pro (Model 201)
    {
      id: 20,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Redmi 12 5G / POCO M6 Pro',
      slug: 'crystal-clear-3d-case-redmi-12-5g-poco-m6-pro',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Ultra-clear crystal hybrid case engineered for the shared dual-camera visor chassis of Redmi 12 5G and POCO M6 Pro. 100% verified fit.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 35,
      variant_id: 20,
      variant_sku: 'DEMO-CLR-REDMI-12G',
      brand_slug: 'redmi',
      phone_model_ids: [201],
      compatible_models: 'MI 12 5G / POCO M6 PRO'
    },
    {
      id: 21,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Redmi 12 5G / POCO M6 Pro',
      slug: 'midnight-art-edition-redmi-12-5g-poco-m6-pro',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Tactile 3D embossed honeycomb case with signature tricolor racing bar. Tailored precisely for the dual camera array and side fingerprint reader.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 40,
      variant_id: 21,
      variant_sku: 'DEMO-ART-REDMI-12G',
      brand_slug: 'redmi',
      phone_model_ids: [201],
      compatible_models: 'MI 12 5G / POCO M6 PRO'
    },
    {
      id: 22,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Redmi 12 5G / POCO M6 Pro',
      slug: 'premium-armor-case-redmi-12-5g-poco-m6-pro',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'Extreme rugged armor with perimeter shock suspension for Redmi 12 5G and POCO M6 Pro. Built to withstand daily drops and rugged use.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 25,
      variant_id: 22,
      variant_sku: 'DEMO-ARM-REDMI-12G',
      brand_slug: 'redmi',
      phone_model_ids: [201],
      compatible_models: 'MI 12 5G / POCO M6 PRO'
    },

    // Nothing Phone 2A (Model 302)
    {
      id: 23,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Nothing Phone 2A',
      slug: 'crystal-clear-3d-case-nothing-2a',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Optically transparent backplate that showcases the iconic dual central "eyes" and Glyph LED light interface of Nothing Phone 2A without diffusion.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 35,
      variant_id: 23,
      variant_sku: 'DEMO-CLR-NOTH-2A',
      brand_slug: 'nothing',
      phone_model_ids: [302],
      compatible_models: 'NOTHING 2A'
    },
    {
      id: 24,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Nothing Phone 2A',
      slug: 'midnight-art-edition-nothing-2a',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Tactile 3D embossed case engineered with recessed framing around the Nothing Phone 2A Glyph lights. Features signature racing stripe and honeycomb grip.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 40,
      variant_id: 24,
      variant_sku: 'DEMO-ART-NOTH-2A',
      brand_slug: 'nothing',
      phone_model_ids: [302],
      compatible_models: 'NOTHING 2A'
    },
    {
      id: 25,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Nothing Phone 2A',
      slug: 'premium-armor-case-nothing-2a',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'High-impact defense armor custom formed to protect Nothing Phone 2A corner geometry while preserving full functionality of rear LED strips.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 30,
      variant_id: 25,
      variant_sku: 'DEMO-ARM-NOTH-2A',
      brand_slug: 'nothing',
      phone_model_ids: [302],
      compatible_models: 'NOTHING 2A'
    },

    // Nothing CMF 1 (Model 301)
    {
      id: 26,
      case_type_id: 5,
      case_type: 'Clear Hybrid',
      case_type_slug: 'clear-hybrid',
      name: 'Crystal Clear 3D Case for Nothing CMF 1',
      slug: 'crystal-clear-3d-case-nothing-cmf-1',
      material: 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
      description: 'Precision clear hybrid case with dedicated cutout for CMF Phone 1 modular accessory dial and vertical dual camera lenses.',
      base_price: '299.00',
      original_price: '599.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/crystal-clear-3d-case.jpg',
      stock_quantity: 30,
      variant_id: 26,
      variant_sku: 'DEMO-CLR-NOTH-CMF1',
      brand_slug: 'nothing',
      phone_model_ids: [301],
      compatible_models: 'NOTHING CMF 1'
    },
    {
      id: 27,
      case_type_id: 6,
      case_type: '3D Tactile Case',
      case_type_slug: '3d-case',
      name: 'Midnight Art Edition for Nothing CMF 1',
      slug: 'midnight-art-edition-nothing-cmf-1',
      material: 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
      description: 'Artisan 3D tactile case designed around CMF Phone 1 distinctive industrial design. Features Italian tricolor emblem and honeycomb grip.',
      base_price: '399.00',
      original_price: '799.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/midnight-art-edition.jpg',
      stock_quantity: 35,
      variant_id: 27,
      variant_sku: 'DEMO-ART-NOTH-CMF1',
      brand_slug: 'nothing',
      phone_model_ids: [301],
      compatible_models: 'NOTHING CMF 1'
    },
    {
      id: 28,
      case_type_id: 2,
      case_type: 'Military Rugged',
      case_type_slug: 'rugged',
      name: 'Premium Armor Case for Nothing CMF 1',
      slug: 'premium-armor-case-nothing-cmf-1',
      material: 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
      description: 'Military drop-defense armored case engineered for CMF Phone 1 with heavy-duty corner suspension and dual lens protection housing.',
      base_price: '499.00',
      original_price: '899.00',
      is_featured: 1,
      is_active: 1,
      image_url: 'assets/images/3d-cases/premium-armor-case.jpg',
      stock_quantity: 25,
      variant_id: 28,
      variant_sku: 'DEMO-ARM-NOTH-CMF1',
      brand_slug: 'nothing',
      phone_model_ids: [301],
      compatible_models: 'NOTHING CMF 1'
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
      images: [found.image_url],
      compatible_models: found.compatible_models
    }];
  }
  if (normalized.includes('select') && normalized.includes('from products')) {
    let list = [...mockStore.products];

    // Check if filtered by phone_model_id in WHERE clause
    const modelIdMatch = sql.match(/pmc\.phone_model_id\s*=\s*(?:\?|\$(\d+))/i);
    if (modelIdMatch) {
      let paramVal = modelIdMatch[1] ? params[parseInt(modelIdMatch[1], 10) - 1] : params[0];
      if (paramVal !== undefined) {
        const targetId = Number(paramVal);
        list = list.filter(p => p.phone_model_ids && p.phone_model_ids.includes(targetId));
      }
    }

    const modelSlugMatch = sql.match(/pm\.slug\s*=\s*(?:\?|\$(\d+))/i);
    if (modelSlugMatch) {
      let slugVal = modelSlugMatch[1] ? params[parseInt(modelSlugMatch[1], 10) - 1] : params[0];
      if (slugVal) {
        const foundModel = mockStore.models.find(m => m.slug === slugVal);
        if (foundModel) {
          list = list.filter(p => p.phone_model_ids && p.phone_model_ids.includes(foundModel.id));
        }
      }
    }

    const brandSlugMatch = sql.match(/b\.slug\s*=\s*(?:\?|\$(\d+))/i);
    if (brandSlugMatch) {
      let brandVal = brandSlugMatch[1] ? params[parseInt(brandSlugMatch[1], 10) - 1] : params[0];
      if (brandVal) {
        list = list.filter(p => p.brand_slug === brandVal || (p.phone_model_ids && p.phone_model_ids.length > 2));
      }
    }

    return list.map(p => ({
      ...p,
      compatible_models: p.compatible_models || 'Compatible Phone'
    }));
  }
  if (normalized.includes('select') && normalized.includes('from product_images')) {
    const prodId = params[0];
    const found = mockStore.products.find(p => p.id === prodId);
    return [
      { image_url: found ? found.image_url : 'assets/images/3d-cases/trending-3d-ferrari-racing-studio.jpg', is_primary: true },
      { image_url: 'assets/icons/reference-3d-case.jpeg', is_primary: false }
    ];
  }
  if (normalized.includes('select') && normalized.includes('from product_model_compatibility')) {
    const prodId = params[0];
    const found = mockStore.products.find(p => p.id === prodId);
    const modelIds = found ? (found.phone_model_ids || [120]) : [120];
    return mockStore.models.filter(m => modelIds.includes(m.id)).map(m => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      brand_name: 'Samsung',
      brand_slug: 'samsung'
    }));
  }
  if (normalized.includes('select') && normalized.includes('from product_variants')) {
    const prodId = params[0];
    const found = mockStore.products.find(p => p.id === prodId);
    return [{
      id: found ? (found.variant_id || prodId) : prodId,
      sku: found ? (found.variant_sku || `SKU-${prodId}`) : `SKU-${prodId}`,
      additional_price: 0,
      colour_name: 'Midnight Black',
      hex_code: '#0F172A',
      stock: found ? found.stock_quantity : 30
    }];
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
