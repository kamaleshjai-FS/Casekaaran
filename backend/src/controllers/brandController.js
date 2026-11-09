/**
 * Casekaaran — Brand & Model Controller
 */
const db = require('../config/database');
const { success, error } = require('../utils/response');

async function getBrands(req, res, next) {
  try {
    const brands = await db.query(
      `SELECT id, name, slug, icon, logo_url, display_order, is_active
       FROM brands
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`
    );
    return success(res, brands);
  } catch (err) {
    next(err);
  }
}

async function getBrandModels(req, res, next) {
  try {
    const { brandSlug } = req.params;
    const models = await db.query(
      `SELECT pm.id, pm.name, pm.slug, pm.is_popular, pm.display_order,
              COUNT(DISTINCT pmc.product_id) as cases_count
       FROM phone_models pm
       JOIN brands b ON pm.brand_id = b.id
       LEFT JOIN product_model_compatibility pmc ON pmc.phone_model_id = pm.id
       WHERE b.slug = ? AND pm.is_active = TRUE
       GROUP BY pm.id
       ORDER BY pm.is_popular DESC, pm.display_order ASC, pm.name ASC`,
      [brandSlug]
    );
    return success(res, models);
  } catch (err) {
    next(err);
  }
}

async function getPopularModels(req, res, next) {
  try {
    const popular = await db.query(
      `SELECT pm.id, pm.name, pm.slug, b.name as brand_name, b.slug as brand_slug,
              COUNT(DISTINCT pmc.product_id) as cases_count
       FROM phone_models pm
       JOIN brands b ON pm.brand_id = b.id
       LEFT JOIN product_model_compatibility pmc ON pmc.phone_model_id = pm.id
       WHERE pm.is_popular = TRUE AND pm.is_active = TRUE
       GROUP BY pm.id
       ORDER BY pm.display_order ASC
       LIMIT 12`
    );
    return success(res, popular);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBrands,
  getBrandModels,
  getPopularModels
};
