/**
 * Casekaaran — Product Catalog Controller
 */
const db = require('../config/database');
const { success, error } = require('../utils/response');

async function getProducts(req, res, next) {
  try {
    const { brand, model, case_type, sort = 'newest', search, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT p.id, p.name, p.slug, p.base_price, p.original_price, p.material, p.is_featured,
             ct.name as case_type, ct.slug as case_type_slug,
             pi.image_url,
             COALESCE(SUM(inv.quantity), 0) as stock_quantity,
             GROUP_CONCAT(DISTINCT pm.name SEPARATOR ', ') as compatible_models
      FROM products p
      JOIN case_types ct ON p.case_type_id = ct.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN inventory inv ON inv.product_variant_id = pv.id
      LEFT JOIN product_model_compatibility pmc ON pmc.product_id = p.id
      LEFT JOIN phone_models pm ON pmc.phone_model_id = pm.id
      LEFT JOIN brands b ON pm.brand_id = b.id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (brand) {
      sql += ` AND b.slug = ?`;
      params.push(brand);
    }

    if (model) {
      sql += ` AND pm.slug = ?`;
      params.push(model);
    }

    if (case_type) {
      sql += ` AND ct.slug = ?`;
      params.push(case_type);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR pm.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY p.id`;

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ` ORDER BY p.base_price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.base_price DESC`;
        break;
      case 'popular':
        sql += ` ORDER BY p.is_featured DESC, stock_quantity DESC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY p.created_at DESC`;
        break;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const products = await db.query(sql, params);

    // Format output
    const formatted = products.map(p => ({
      ...p,
      base_price: parseFloat(p.base_price),
      original_price: parseFloat(p.original_price),
      compatible_models: typeof p.compatible_models === 'string' ? p.compatible_models.split(', ') : (p.compatible_models || [])
    }));

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
}

async function getProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const products = await db.query(
      `SELECT p.id, p.name, p.slug, p.base_price, p.original_price, p.material, p.description, p.features,
              ct.name as case_type,
              COALESCE(SUM(inv.quantity), 0) as stock
       FROM products p
       JOIN case_types ct ON p.case_type_id = ct.id
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       LEFT JOIN inventory inv ON inv.product_variant_id = pv.id
       WHERE p.slug = ? AND p.is_active = TRUE
       GROUP BY p.id`,
      [slug]
    );

    if (!products || products.length === 0) {
      return error(res, 'Product not found', 404, 'NOT_FOUND');
    }

    const product = products[0];

    // Fetch images
    const images = await db.query(
      `SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC`,
      [product.id]
    );

    // Fetch compatible phone models
    const compatibleModels = await db.query(
      `SELECT pm.id, pm.name, pm.slug, b.name as brand_name
       FROM product_model_compatibility pmc
       JOIN phone_models pm ON pmc.phone_model_id = pm.id
       JOIN brands b ON pm.brand_id = b.id
       WHERE pmc.product_id = ? AND pm.is_active = TRUE
       ORDER BY pm.display_order ASC`,
      [product.id]
    );

    // Fetch available variants & colors
    const variants = await db.query(
      `SELECT pv.id, pv.sku, pv.additional_price, c.name as colour_name, c.hex_code, inv.quantity as stock
       FROM product_variants pv
       JOIN colours c ON pv.colour_id = c.id
       LEFT JOIN inventory inv ON inv.product_variant_id = pv.id
       WHERE pv.product_id = ? AND pv.is_active = TRUE`,
      [product.id]
    );

    return success(res, {
      ...product,
      base_price: parseFloat(product.base_price),
      original_price: parseFloat(product.original_price),
      images: images.map(i => i.image_url),
      compatible_models: compatibleModels,
      variants
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductBySlug
};
