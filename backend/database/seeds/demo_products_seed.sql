-- ============================================================================
-- CASEKAARAN DEMO PRODUCTS SEED SCRIPT (SUPABASE / POSTGRESQL 15+)
-- 18 Database-backed Demo Products across 6 Verified Phone Compatibility Groups
-- Using ONLY the 10 existing schema tables:
-- brands, phone_models, case_types, colours, products, product_images,
-- product_model_compatibility, product_variants, inventory, inventory_movements.
--
-- Identification Strategy:
-- 1. Demo SKUs have consistent 'DEMO-' prefix in product_variants.sku
-- 2. Products features JSONB contains {"is_demo": true, "demo_series": "DEMO-2026"}
-- 3. Inventory movements marked with movement_type 'INITIAL' and notes 'Initial demo inventory seed'
--
-- Idempotency:
-- Wrapped in a transaction, using ON CONFLICT and WHERE NOT EXISTS.
-- Safe to execute repeatedly without duplicating products, images, SKUs or movements.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Verify or Upsert Required Brands
-- ----------------------------------------------------------------------------
INSERT INTO brands (id, name, slug, icon, display_order, is_active) VALUES
(2, 'Samsung', 'samsung', 'bi-phone', 2, TRUE),
(10, 'Redmi', 'redmi', 'bi-lightning-charge', 10, TRUE),
(11, 'Nothing', 'nothing', 'bi-circle-half', 11, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, icon = EXCLUDED.icon, is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 2. Verify or Upsert Required Case Types
-- ----------------------------------------------------------------------------
INSERT INTO case_types (id, name, slug, description, is_active) VALUES
(2, 'Military Rugged', 'rugged', 'Dual-layer defense tested against 12-foot drops with reinforced air-cushion corner bumpers.', TRUE),
(5, 'Clear Hybrid', 'clear-hybrid', 'Anti-yellowing optical clarity with 4H scratch-resistant acrylic backplate and 3D shock perimeter.', TRUE),
(6, '3D Tactile Case', '3d-case', 'Physical 3D embossed backplate with Italian tricolor racing stripe and tactile hexagonal honeycomb mesh.', TRUE)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 3. Verify or Upsert Required Colours
-- ----------------------------------------------------------------------------
INSERT INTO colours (id, name, hex_code) VALUES
(1, 'Midnight Black', '#0F172A'),
(2, 'Titanium Grey', '#64748B'),
(3, 'Deep Navy', '#1E3A8A')
ON CONFLICT (name) DO UPDATE 
SET hex_code = EXCLUDED.hex_code;

-- ----------------------------------------------------------------------------
-- 4. Verify or Upsert the 6 Target Phone Models
-- ----------------------------------------------------------------------------
INSERT INTO phone_models (id, brand_id, name, slug, is_popular, display_order, is_active) VALUES
(109, 2, 'A15/M15/F15', 'samsung-a15-m15-f15', TRUE, 9, TRUE),
(120, 2, 'S24 ULTRA', 'samsung-s24-ultra', TRUE, 20, TRUE),
(201, 10, 'MI 12 5G / POCO M6 PRO', 'redmi-mi-12-5g-poco-m6-pro', TRUE, 1, TRUE),
(223, 10, 'MI NOTE 13 PRO 5G', 'redmi-note-13-pro-5g', TRUE, 23, TRUE),
(301, 11, 'NOTHING CMF 1', 'nothing-cmf-1', TRUE, 1, TRUE),
(302, 11, 'NOTHING 2A', 'nothing-2a', TRUE, 2, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, is_popular = TRUE, is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 5. Insert 18 Demo Products (3 Designs x 6 Compatibility Groups)
-- ----------------------------------------------------------------------------
INSERT INTO products (id, case_type_id, name, slug, material, description, features, base_price, original_price, is_featured, is_active) VALUES
-- Samsung A15/M15/F15 (Model 109)
(11, 5, 'Crystal Clear 3D Case for Samsung A15 / M15 / F15', 'crystal-clear-3d-case-samsung-a15-m15-f15', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Optical 4H scratch-resistant acrylic backplate engineered with 3D micro-dot matrix to prevent watermarks. Precision laser cutouts for Key Island triple camera setup.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Anti-Yellowing Formula", "1.5mm Camera Lip Protection", "Tactile Responsive Buttons", "3D Shock Absorbing Air-Pockets"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(12, 6, 'Midnight Art Edition for Samsung A15 / M15 / F15', 'midnight-art-edition-samsung-a15-m15-f15', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Signature physical 3D embossed tactile backplate featuring Italian tricolor racing accent stripe and hexagonal honeycomb shock matrix. Engineered for superior grip.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Physical 3D Embossed Shield", "Italian Tricolor Racing Accent", "Honeycomb Shock Matrix", "Non-Slip Ergonomic Grip"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(13, 2, 'Premium Armor Case for Samsung A15 / M15 / F15', 'premium-armor-case-samsung-a15-m15-f15', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'Military drop-defense case engineered with dual-layer polymer protection, reinforced impact corner airbags, and full-coverage Key Island camera frame.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Mil-STD 810G Certified", "12ft Drop Suspension", "Corner Airbag Defense", "Heavy-Duty Camera Bezel"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE),

-- Samsung S24 Ultra (Model 120)
(14, 5, 'Crystal Clear 3D Case for Samsung S24 Ultra', 'crystal-clear-3d-case-samsung-s24-ultra', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Crystal-clear 4H hardened backplate showcasing the Titanium chassis of the S24 Ultra. Form-fitting laser cutouts for quad camera lenses and S-Pen slot.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Anti-Yellowing Formula", "S-Pen Accessible Cutout", "Quad Camera Ring Protection", "Wireless Charging Compatible"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(15, 6, 'Midnight Art Edition for Samsung S24 Ultra', 'midnight-art-edition-samsung-s24-ultra', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Flagship tactile 3D relief shell with high-density hexagonal shock absorbers and Scuderia racing accents. Boxy frame alignment matching S24 Ultra geometry.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Physical 3D Embossed Shield", "Precision Boxy Fit", "Laser Sensor Port", "Tactile CNC Button Covers"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(16, 2, 'Premium Armor Case for Samsung S24 Ultra', 'premium-armor-case-samsung-s24-ultra', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'Extreme 15-foot military drop-certified armor engineered for Galaxy S24 Ultra. Dual-layer defense with recessed screen edge bumpers and S-Pen chamber.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["15ft Drop Rating", "Titanium-Grade Polycarbonate", "Airbag Corner Dampeners", "Ergonomic Grip Texture"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE),

-- Redmi Note 13 Pro 5G (Model 223)
(17, 5, 'Crystal Clear 3D Case for Redmi Note 13 Pro 5G', 'crystal-clear-3d-case-redmi-note-13-pro-5g', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Pure clarity backplate custom cut for the Redmi Note 13 Pro 5G geometric camera island. Anti-yellowing UV barrier and elevated bumper bezels.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["UV Anti-Yellowing Shield", "Geometric Deco Camera Fit", "Air Pocket Cushioning", "Featherweight 26g"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(18, 6, 'Midnight Art Edition for Redmi Note 13 Pro 5G', 'midnight-art-edition-redmi-note-13-pro-5g', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Tactile 3D textured backplate with Italian tricolor accent bar and anti-slip honeycomb grid. Molded to Redmi Note 13 Pro 5G exact contours.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Physical 3D Relief Grid", "Italian Tricolor Accent", "Precise Mic & IR Blaster Ports", "Matte Anti-Smudge Finish"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(19, 2, 'Premium Armor Case for Redmi Note 13 Pro 5G', 'premium-armor-case-redmi-note-13-pro-5g', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'Heavy-duty rugged defense case with raised camera visor ring and shock-absorbing internal matrix. Certified drop protection.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Mil-STD Certified", "Elevated Camera Visor", "Shock Absorbing Matrix", "Tactile Grip Ribs"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE),

-- Redmi 12 5G / POCO M6 Pro (Model 201)
(20, 5, 'Crystal Clear 3D Case for Redmi 12 5G / POCO M6 Pro', 'crystal-clear-3d-case-redmi-12-5g-poco-m6-pro', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Ultra-clear crystal hybrid case engineered for the shared dual-camera visor chassis of Redmi 12 5G and POCO M6 Pro. 100% verified fit.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Shared Dual-Camera Fit", "Scratch-Resistant 4H Back", "Reinforced Edge Bumper", "Crystal Transparency"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(21, 6, 'Midnight Art Edition for Redmi 12 5G / POCO M6 Pro', 'midnight-art-edition-redmi-12-5g-poco-m6-pro', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Tactile 3D embossed honeycomb case with signature tricolor racing bar. Tailored precisely for the dual camera array and side fingerprint reader.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Physical 3D Embossed Shell", "Side Sensor Easy Access", "Honeycomb Drop Mesh", "Tricolor Racing Emblem"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(22, 2, 'Premium Armor Case for Redmi 12 5G / POCO M6 Pro', 'premium-armor-case-redmi-12-5g-poco-m6-pro', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'Extreme rugged armor with perimeter shock suspension for Redmi 12 5G and POCO M6 Pro. Built to withstand daily drops and rugged use.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Perimeter Airbags", "Dual Layer Polymer Shell", "Camera Deco Shield", "Impact Dispersal Core"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE),

-- Nothing Phone 2A (Model 302)
(23, 5, 'Crystal Clear 3D Case for Nothing Phone 2A', 'crystal-clear-3d-case-nothing-2a', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Optically transparent backplate that showcases the iconic dual central "eyes" and Glyph LED light interface of Nothing Phone 2A without diffusion.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Glyph LED Friendly", "Dual Eye Camera Cutout", "Anti-Yellowing Acrylic", "Raised Bezel Defense"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(24, 6, 'Midnight Art Edition for Nothing Phone 2A', 'midnight-art-edition-nothing-2a', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Tactile 3D embossed case engineered with recessed framing around the Nothing Phone 2A Glyph lights. Features signature racing stripe and honeycomb grip.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Recessed Glyph Windows", "Physical 3D Relief Texture", "Honeycomb Shock Matrix", "Italian Racing Accent"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(25, 2, 'Premium Armor Case for Nothing Phone 2A', 'premium-armor-case-nothing-2a', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'High-impact defense armor custom formed to protect Nothing Phone 2A corner geometry while preserving full functionality of rear LED strips.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Corner Shock Suspension", "Glyph Interface Compatible", "Dual-Layer Drop Defense", "Tactile Button Covers"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE),

-- Nothing CMF 1 (Model 301)
(26, 5, 'Crystal Clear 3D Case for Nothing CMF 1', 'crystal-clear-3d-case-nothing-cmf-1', 
 'Anti-Yellowing Polycarbonate & 3D TPU Shock Bumper',
 'Precision clear hybrid case with dedicated cutout for CMF Phone 1 modular accessory dial and vertical dual camera lenses.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Accessory Dial Cutout", "Modular Backplate Access", "Anti-Yellowing Clarity", "Shock Absorbent TPU Edge"]}'::jsonb,
 299.00, 599.00, TRUE, TRUE),

(27, 6, 'Midnight Art Edition for Nothing CMF 1', 'midnight-art-edition-nothing-cmf-1', 
 'Physical 3D Embossed TPU & Matte Honeycomb Shell',
 'Artisan 3D tactile case designed around CMF Phone 1 distinctive industrial design. Features Italian tricolor emblem and honeycomb grip.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Custom Dial Port", "Physical 3D Embossed Shell", "Honeycomb Shock Dispersal", "Matte Stealth Finish"]}'::jsonb,
 399.00, 799.00, TRUE, TRUE),

(28, 2, 'Premium Armor Case for Nothing CMF 1', 'premium-armor-case-nothing-cmf-1', 
 'Dual-Layer Aerospace Polymer & Reinforced Corner Airbags',
 'Military drop-defense armored case engineered for CMF Phone 1 with heavy-duty corner suspension and dual lens protection housing.',
 '{"is_demo": true, "demo_series": "DEMO-2026", "bullet_points": ["Heavy-Duty Drop Protection", "Corner Airbag Suspension", "Precision Dial Clearance", "Tactile Textured Grip"]}'::jsonb,
 499.00, 899.00, TRUE, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET base_price = EXCLUDED.base_price, 
    original_price = EXCLUDED.original_price, 
    features = EXCLUDED.features,
    is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 6. Insert Product Images (Primary & Reference Angles)
-- ----------------------------------------------------------------------------
-- Clear existing demo images to maintain idempotent state without duplicates
DELETE FROM product_images WHERE product_id BETWEEN 11 AND 28;

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES
-- Samsung A15/M15/F15
(11, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Samsung A15', TRUE, 1),
(11, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(12, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Samsung A15', TRUE, 1),
(12, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(13, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Samsung A15', TRUE, 1),

-- Samsung S24 Ultra
(14, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Samsung S24 Ultra', TRUE, 1),
(14, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(15, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Samsung S24 Ultra', TRUE, 1),
(15, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(16, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Samsung S24 Ultra', TRUE, 1),

-- Redmi Note 13 Pro 5G
(17, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Redmi Note 13 Pro', TRUE, 1),
(17, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(18, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Redmi Note 13 Pro', TRUE, 1),
(18, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(19, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Redmi Note 13 Pro', TRUE, 1),

-- Redmi 12 5G / POCO M6 Pro
(20, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Redmi 12 5G / POCO M6 Pro', TRUE, 1),
(20, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(21, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Redmi 12 5G / POCO M6 Pro', TRUE, 1),
(21, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(22, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Redmi 12 5G / POCO M6 Pro', TRUE, 1),

-- Nothing Phone 2A
(23, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Nothing 2A', TRUE, 1),
(23, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(24, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Nothing 2A', TRUE, 1),
(24, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(25, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Nothing 2A', TRUE, 1),

-- Nothing CMF 1
(26, 'assets/images/3d-cases/crystal-clear-3d-case.jpg', 'Crystal Clear 3D Case Nothing CMF 1', TRUE, 1),
(26, 'assets/icons/reference-3d-case.jpeg', 'Crystal Clear 3D Case Reference', FALSE, 2),
(27, 'assets/images/3d-cases/midnight-art-edition.jpg', 'Midnight Art Edition Nothing CMF 1', TRUE, 1),
(27, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Midnight Art Angle View', FALSE, 2),
(28, 'assets/images/3d-cases/premium-armor-case.jpg', 'Premium Armor Case Nothing CMF 1', TRUE, 1);

-- ----------------------------------------------------------------------------
-- 7. Insert Product Model Compatibility Links
-- ----------------------------------------------------------------------------
INSERT INTO product_model_compatibility (product_id, phone_model_id) VALUES
-- Samsung A15/M15/F15 (Model 109)
(11, 109), (12, 109), (13, 109),
-- Samsung S24 Ultra (Model 120)
(14, 120), (15, 120), (16, 120),
-- Redmi Note 13 Pro 5G (Model 223)
(17, 223), (18, 223), (19, 223),
-- Redmi 12 5G / POCO M6 Pro (Model 201)
(20, 201), (21, 201), (22, 201),
-- Nothing Phone 2A (Model 302)
(23, 302), (24, 302), (25, 302),
-- Nothing CMF 1 (Model 301)
(26, 301), (27, 301), (28, 301)
ON CONFLICT (product_id, phone_model_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Insert Product Variants (SKU prefix 'DEMO-')
-- ----------------------------------------------------------------------------
INSERT INTO product_variants (id, product_id, colour_id, sku, additional_price, is_active) VALUES
-- Samsung A15/M15/F15
(11, 11, 2, 'DEMO-CLR-SAM-A15', 0.00, TRUE),
(12, 12, 1, 'DEMO-ART-SAM-A15', 0.00, TRUE),
(13, 13, 3, 'DEMO-ARM-SAM-A15', 0.00, TRUE),

-- Samsung S24 Ultra
(14, 14, 2, 'DEMO-CLR-SAM-S24U', 0.00, TRUE),
(15, 15, 1, 'DEMO-ART-SAM-S24U', 0.00, TRUE),
(16, 16, 3, 'DEMO-ARM-SAM-S24U', 0.00, TRUE),

-- Redmi Note 13 Pro 5G
(17, 17, 2, 'DEMO-CLR-REDMI-N13P', 0.00, TRUE),
(18, 18, 1, 'DEMO-ART-REDMI-N13P', 0.00, TRUE),
(19, 19, 3, 'DEMO-ARM-REDMI-N13P', 0.00, TRUE),

-- Redmi 12 5G / POCO M6 Pro
(20, 20, 2, 'DEMO-CLR-REDMI-12G', 0.00, TRUE),
(21, 21, 1, 'DEMO-ART-REDMI-12G', 0.00, TRUE),
(22, 22, 3, 'DEMO-ARM-REDMI-12G', 0.00, TRUE),

-- Nothing Phone 2A
(23, 23, 2, 'DEMO-CLR-NOTH-2A', 0.00, TRUE),
(24, 24, 1, 'DEMO-ART-NOTH-2A', 0.00, TRUE),
(25, 25, 3, 'DEMO-ARM-NOTH-2A', 0.00, TRUE),

-- Nothing CMF 1
(26, 26, 2, 'DEMO-CLR-NOTH-CMF1', 0.00, TRUE),
(27, 27, 1, 'DEMO-ART-NOTH-CMF1', 0.00, TRUE),
(28, 28, 3, 'DEMO-ARM-NOTH-CMF1', 0.00, TRUE)
ON CONFLICT (sku) DO UPDATE 
SET is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 9. Insert Initial Inventory Stock Quantities
-- ----------------------------------------------------------------------------
INSERT INTO inventory (product_variant_id, quantity, low_stock_threshold) VALUES
(11, 35, 5), (12, 40, 5), (13, 25, 5),
(14, 35, 5), (15, 45, 5), (16, 30, 5),
(17, 30, 5), (18, 40, 5), (19, 25, 5),
(20, 35, 5), (21, 40, 5), (22, 25, 5),
(23, 35, 5), (24, 40, 5), (25, 30, 5),
(26, 30, 5), (27, 35, 5), (28, 25, 5)
ON CONFLICT (product_variant_id) DO UPDATE 
SET quantity = EXCLUDED.quantity;

-- ----------------------------------------------------------------------------
-- 10. Record Initial Stock Movement in inventory_movements
-- ----------------------------------------------------------------------------
INSERT INTO inventory_movements (product_variant_id, change_quantity, balance_quantity, movement_type, reference_id, notes)
SELECT v.id, inv.quantity, inv.quantity, 'INITIAL', 'DEMO-INIT-' || v.sku, 'Initial demo catalogue stock seed'
FROM product_variants v
JOIN inventory inv ON inv.product_variant_id = v.id
WHERE v.id BETWEEN 11 AND 28
  AND NOT EXISTS (
    SELECT 1 FROM inventory_movements im WHERE im.reference_id = 'DEMO-INIT-' || v.sku
  );

-- ----------------------------------------------------------------------------
-- 11. Update Sequences to prevent ID collisions
-- ----------------------------------------------------------------------------
SELECT setval('products_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM products), 28));
SELECT setval('product_variants_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM product_variants), 28));
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images));

COMMIT;
