/**
 * Casekaaran — Product Catalog Controller
 * Database-backed search and retrieval across products, images, compatibility, variants & inventory
 */
const db = require('../config/database');
const { success, error } = require('../utils/response');

async function getProducts(req, res, next) {
  try {
    const { 
      brand, 
      model, 
      phone_model_id, 
      case_type, 
      sort = 'newest', 
      search, 
      in_stock_only,
      page = 1, 
      limit = 50 
    } = req.query;

    let sql = `
      SELECT p.id, p.name, p.slug, p.base_price, p.original_price, p.material, p.is_featured,
             ct.name as case_type, ct.slug as case_type_slug,
             COALESCE(
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1),
               (SELECT pi2.image_url FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.display_order ASC LIMIT 1)
             ) as image_url,
             COALESCE(
               (SELECT SUM(inv.quantity) FROM product_variants pv JOIN inventory inv ON inv.product_variant_id = pv.id WHERE pv.product_id = p.id),
               0
             ) as stock_quantity,
             (SELECT pv2.id FROM product_variants pv2 WHERE pv2.product_id = p.id LIMIT 1) as variant_id,
             (SELECT pv2.sku FROM product_variants pv2 WHERE pv2.product_id = p.id LIMIT 1) as variant_sku,
             COALESCE(
               (SELECT STRING_AGG(DISTINCT pm.name, ', ') 
                FROM product_model_compatibility pmc 
                JOIN phone_models pm ON pmc.phone_model_id = pm.id 
                WHERE pmc.product_id = p.id),
               ''
             ) as compatible_models
      FROM products p
      JOIN case_types ct ON p.case_type_id = ct.id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    // Filter by Brand slug
    if (brand) {
      sql += ` AND EXISTS (
        SELECT 1 FROM product_model_compatibility pmc 
        JOIN phone_models pm ON pmc.phone_model_id = pm.id 
        JOIN brands b ON pm.brand_id = b.id 
        WHERE pmc.product_id = p.id AND b.slug = ?
      )`;
      params.push(brand);
    }

    // Filter by Phone Model ID or Model Slug
    if (phone_model_id || (model && !isNaN(model) && model.trim() !== '')) {
      const modelId = parseInt(phone_model_id || model, 10);
      sql += ` AND EXISTS (
        SELECT 1 FROM product_model_compatibility pmc 
        WHERE pmc.product_id = p.id AND pmc.phone_model_id = ?
      )`;
      params.push(modelId);
    } else if (model) {
      sql += ` AND EXISTS (
        SELECT 1 FROM product_model_compatibility pmc 
        JOIN phone_models pm ON pmc.phone_model_id = pm.id 
        WHERE pmc.product_id = p.id AND pm.slug = ?
      )`;
      params.push(model);
    }

    // Filter by Case Type slug
    if (case_type) {
      sql += ` AND ct.slug = ?`;
      params.push(case_type);
    }

    // Search by product name or phone model name
    if (search) {
      sql += ` AND (p.name LIKE ? OR EXISTS (
        SELECT 1 FROM product_model_compatibility pmc 
        JOIN phone_models pm ON pmc.phone_model_id = pm.id 
        WHERE pmc.product_id = p.id AND pm.name LIKE ?
      ))`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Only active products with positive inventory if requested
    if (in_stock_only === 'true' || in_stock_only === true) {
      sql += ` AND COALESCE((SELECT SUM(inv.quantity) FROM product_variants pv JOIN inventory inv ON inv.product_variant_id = pv.id WHERE pv.product_id = p.id), 0) > 0`;
    }

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
        sql += ` ORDER BY p.id ASC`;
        break;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    const products = await db.query(sql, params);

    // Format output
    const formatted = products.map(p => ({
      ...p,
      base_price: parseFloat(p.base_price),
      original_price: parseFloat(p.original_price),
      stock_quantity: parseInt(p.stock_quantity, 10) || 0,
      compatible_models: typeof p.compatible_models === 'string' 
        ? (p.compatible_models ? p.compatible_models.split(', ') : [])
        : (p.compatible_models || [])
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
              ct.name as case_type, ct.slug as case_type_slug,
              COALESCE(
                (SELECT SUM(inv.quantity) FROM product_variants pv JOIN inventory inv ON inv.product_variant_id = pv.id WHERE pv.product_id = p.id),
                0
              ) as stock
       FROM products p
       JOIN case_types ct ON p.case_type_id = ct.id
       WHERE p.slug = ? AND p.is_active = TRUE`,
      [slug]
    );

    if (!products || products.length === 0) {
      return error(res, 'Product not found', 404, 'NOT_FOUND');
    }

    const product = products[0];

    // Fetch images
    const images = await db.query(
      `SELECT image_url, alt_text, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC`,
      [product.id]
    );

    // Fetch compatible phone models
    const compatibleModels = await db.query(
      `SELECT pm.id, pm.name, pm.slug, b.name as brand_name, b.slug as brand_slug
       FROM product_model_compatibility pmc
       JOIN phone_models pm ON pmc.phone_model_id = pm.id
       JOIN brands b ON pm.brand_id = b.id
       WHERE pmc.product_id = ? AND pm.is_active = TRUE
       ORDER BY pm.display_order ASC`,
      [product.id]
    );

    // Fetch available variants, colors & current inventory
    const variants = await db.query(
      `SELECT pv.id, pv.sku, pv.additional_price, c.name as colour_name, c.hex_code, COALESCE(inv.quantity, 0) as stock
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
      stock: parseInt(product.stock, 10) || 0,
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
