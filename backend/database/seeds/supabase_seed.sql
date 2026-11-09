-- ============================================================================
-- CASEKAARAN SUPABASE SEED DATA (POSTGRESQL 15+)
-- Baseline production data: Admin, Brands, 62 Phone Models, 3D Cases & Inventory
-- ============================================================================

-- 1. Initial Admin User (password: Admin@Casekaaran2026)
INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
VALUES (
    'admin',
    'admin@casekaaran.com',
    '$2a$12$6f5b741tD1Y7u537c6.2iOPBvRz83zI.KxYx05F7sN2uVnBwzF6iq',
    'Casekaaran Master Admin',
    'SUPER_ADMIN',
    TRUE
) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Smartphone Brands
INSERT INTO brands (id, name, slug, icon, display_order, is_active) VALUES
(1, 'Apple', 'apple', 'bi-apple', 1, TRUE),
(2, 'Samsung', 'samsung', 'bi-phone', 2, TRUE),
(3, 'OnePlus', 'oneplus', 'bi-phone', 3, TRUE),
(4, 'Google Pixel', 'google-pixel', 'bi-google', 4, TRUE),
(5, 'Xiaomi', 'xiaomi', 'bi-phone', 5, TRUE),
(6, 'Motorola', 'motorola', 'bi-phone', 6, TRUE),
(7, 'Realme', 'realme', 'bi-phone', 7, TRUE),
(8, 'Vivo', 'vivo', 'bi-phone', 8, TRUE),
(9, 'Oppo', 'oppo', 'bi-phone', 9, TRUE),
(10, 'Redmi', 'redmi', 'bi-lightning-charge', 10, TRUE),
(11, 'Nothing', 'nothing', 'bi-circle-half', 11, TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 3. Case Types
INSERT INTO case_types (id, name, slug, description, is_active) VALUES
(1, 'MagSafe Matte', 'magsafe', 'Slim tactile polycarbonate back with built-in neodymium magnetic ring for seamless wireless charging.', TRUE),
(2, 'Military Rugged', 'rugged', 'Dual-layer bumper defense tested against 12-foot drops with reinforced air-cushion corner bumpers.', TRUE),
(3, 'Liquid Silicone', 'silicone', 'Silky-touch food-grade silicone lined with plush microfiber interior to prevent micro-scratches.', TRUE),
(4, 'Vegan Leather', 'leather', 'Handcrafted premium textured grain leather offering sophisticated executive elegance.', TRUE),
(5, 'Clear Hybrid', 'clear-hybrid', 'Anti-yellowing optical clarity with 4H scratch-resistant acrylic backplate and TPU shock perimeter.', TRUE),
(6, '3D Tactile Case', '3d-case', 'Physical 3D embossed backplate with Italian tricolor racing stripe and tactile hexagonal honeycomb mesh.', TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 4. Colours
INSERT INTO colours (id, name, hex_code) VALUES
(1, 'Midnight Black', '#0F172A'),
(2, 'Titanium Grey', '#64748B'),
(3, 'Deep Navy', '#1E3A8A'),
(4, 'Forest Green', '#14532D'),
(5, 'Crimson Red', '#991B1B')
ON CONFLICT (name) DO UPDATE SET hex_code = EXCLUDED.hex_code;

-- 5. Phone Models (Samsung: 23, Redmi: 33, Nothing: 6, and Apple populars)
INSERT INTO phone_models (id, brand_id, name, slug, is_popular, display_order, is_active) VALUES
-- Apple
(1, 1, 'iPhone 16 Pro Max', 'iphone-16-pro-max', TRUE, 1, TRUE),
(2, 1, 'iPhone 16 Pro', 'iphone-16-pro', TRUE, 2, TRUE),
(3, 1, 'iPhone 15 Pro', 'iphone-15-pro', TRUE, 3, TRUE),
(4, 1, 'iPhone 15', 'iphone-15', TRUE, 4, TRUE),

-- Samsung (23 Verified Models)
(101, 2, 'SAM M11/A11', 'samsung-m11-a11', FALSE, 1, TRUE),
(102, 2, 'SAM M31/F41', 'samsung-m31-f41', FALSE, 2, TRUE),
(103, 2, 'SAM A12/M12/F12', 'samsung-a12-m12-f12', TRUE, 3, TRUE),
(104, 2, 'SAM F23', 'samsung-f23', FALSE, 4, TRUE),
(105, 2, 'SAM A06/M06/F06', 'samsung-a06-m06-f06', FALSE, 5, TRUE),
(106, 2, 'SAM A07/M07/F07/M17E/F70E', 'samsung-a07-m07-f07', FALSE, 6, TRUE),
(107, 2, 'A13/A23', 'samsung-a13-a23', TRUE, 7, TRUE),
(108, 2, 'A14/M14', 'samsung-a14-m14', TRUE, 8, TRUE),
(109, 2, 'A15/M15/F15', 'samsung-a15-m15-f15', TRUE, 9, TRUE),
(110, 2, 'A16/M16/F16', 'samsung-a16-m16-f16', FALSE, 10, TRUE),
(111, 2, 'A17/M17/F17/A26/M36', 'samsung-a17-m17-f17-a26-m36', FALSE, 11, TRUE),
(112, 2, 'A27/M47', 'samsung-a27-m47', FALSE, 12, TRUE),
(113, 2, 'A34', 'samsung-a34', FALSE, 13, TRUE),
(114, 2, 'A35 5G/A55 5G', 'samsung-a35-a55-5g', TRUE, 14, TRUE),
(115, 2, 'A36 5G/A56 5G', 'samsung-a36-a56-5g', FALSE, 15, TRUE),
(116, 2, 'A37', 'samsung-a37', FALSE, 16, TRUE),
(117, 2, 'S20FE', 'samsung-s20fe', FALSE, 17, TRUE),
(118, 2, 'S21FE', 'samsung-s21fe', FALSE, 18, TRUE),
(119, 2, 'S24FE', 'samsung-s24fe', TRUE, 19, TRUE),
(120, 2, 'S24 ULTRA', 'samsung-s24-ultra', TRUE, 20, TRUE),
(121, 2, 'S25 ULTRA', 'samsung-s25-ultra', TRUE, 21, TRUE),
(122, 2, 'S26 ULTRA', 'samsung-s26-ultra', FALSE, 22, TRUE),
(123, 2, 'S26', 'samsung-s26', FALSE, 23, TRUE),

-- Redmi (33 Verified Models, Brand ID 10)
(201, 10, 'MI 12 5G / POCO M6 PRO', 'redmi-mi-12-5g-poco-m6-pro', TRUE, 1, TRUE),
(202, 10, 'MI 13 5G / POCO M6 PLUS', 'redmi-mi-13-5g-poco-m6-plus', TRUE, 2, TRUE),
(203, 10, 'MI 13C 5G / 4G', 'redmi-mi-13c-5g-4g', TRUE, 3, TRUE),
(204, 10, 'MI NOTE 7 / NOTE 7 PRO', 'redmi-note-7-pro', FALSE, 4, TRUE),
(205, 10, 'MI 8 / 8A / 8A DUAL', 'redmi-8-8a-dual', FALSE, 5, TRUE),
(206, 10, 'MI NOTE 8', 'redmi-note-8', FALSE, 6, TRUE),
(207, 10, 'MI NOTE 8 PRO', 'redmi-note-8-pro', FALSE, 7, TRUE),
(208, 10, 'MI 12C 4G / POCO C55', 'redmi-12c-poco-c55', TRUE, 8, TRUE),
(209, 10, 'MI 9A / 9I', 'redmi-9a-9i', FALSE, 9, TRUE),
(210, 10, 'MI 9C', 'redmi-9c', FALSE, 10, TRUE),
(211, 10, 'MI 9 POWER', 'redmi-9-power', FALSE, 11, TRUE),
(212, 10, 'MI 9 PRIME / POCO M2', 'redmi-9-prime-poco-m2', FALSE, 12, TRUE),
(213, 10, 'MI NOTE 9 4G', 'redmi-note-9-4g', FALSE, 13, TRUE),
(214, 10, 'MI NOTE 9 PRO 4G / POCO M2 PRO', 'redmi-note-9-pro-poco-m2-pro', TRUE, 14, TRUE),
(215, 10, 'MI 10C / 10 POWER', 'redmi-10c-10-power', FALSE, 15, TRUE),
(216, 10, 'MI NOTE 10 4G / NOTE 10S', 'redmi-note-10-note-10s', FALSE, 16, TRUE),
(217, 10, 'MI NOTE 10T / POCO M3 PRO', 'redmi-note-10t-poco-m3-pro', FALSE, 17, TRUE),
(218, 10, 'MI NOTE 11T 5G / POCO M4 PRO 5G', 'redmi-note-11t-poco-m4-pro-5g', TRUE, 18, TRUE),
(219, 10, 'MI NOTE 11 / NOTE 11S', 'redmi-note-11-note-11s', TRUE, 19, TRUE),
(220, 10, 'MI NOTE 11 PRO 4G', 'redmi-note-11-pro-4g', FALSE, 20, TRUE),
(221, 10, 'MI NOTE 12', 'redmi-note-12', TRUE, 21, TRUE),
(222, 10, 'MI NOTE 13 5G', 'redmi-note-13-5g', TRUE, 22, TRUE),
(223, 10, 'MI NOTE 13 PRO 5G', 'redmi-note-13-pro-5g', TRUE, 23, TRUE),
(224, 10, 'MI NOTE 13 PRO+', 'redmi-note-13-pro-plus', TRUE, 24, TRUE),
(225, 10, 'MI NOTE 14', 'redmi-note-14', FALSE, 25, TRUE),
(226, 10, 'MI NOTE 14 PRO 5G', 'redmi-note-14-pro-5g', TRUE, 26, TRUE),
(227, 10, 'MI NOTE 15 5G', 'redmi-note-15-5g', FALSE, 27, TRUE),
(228, 10, 'MI NOTE 15 PRO', 'redmi-note-15-pro', FALSE, 28, TRUE),
(229, 10, 'MI 15A', 'redmi-15a', FALSE, 29, TRUE),
(230, 10, 'MI 15C / POCO C85', 'redmi-15c-poco-c85', FALSE, 30, TRUE),
(231, 10, 'MI 15 5G', 'redmi-15-5g', FALSE, 31, TRUE),
(232, 10, 'MI A4/14C/POCO M7/POCO C75', 'redmi-a4-14c-poco-m7-c75', TRUE, 32, TRUE),
(233, 10, 'MI A5 / POCO C71', 'redmi-a5-poco-c71', FALSE, 33, TRUE),

-- Nothing (6 Verified Models, Brand ID 11)
(301, 11, 'NOTHING CMF 1', 'nothing-cmf-1', TRUE, 1, TRUE),
(302, 11, 'NOTHING 2A', 'nothing-2a', TRUE, 2, TRUE),
(303, 11, 'NOTHING 3A', 'nothing-3a', TRUE, 3, TRUE),
(304, 11, 'NOTHING 3A PRO', 'nothing-3a-pro', FALSE, 4, TRUE),
(305, 11, 'NOTHING 4A', 'nothing-4a', FALSE, 5, TRUE),
(306, 11, 'NOTHING 4A PRO', 'nothing-4a-pro', FALSE, 6, TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_popular = EXCLUDED.is_popular;

-- Reset primary key sequences to prevent conflicts
SELECT setval('brands_id_seq', (SELECT MAX(id) FROM brands));
SELECT setval('case_types_id_seq', (SELECT MAX(id) FROM case_types));
SELECT setval('colours_id_seq', (SELECT MAX(id) FROM colours));
SELECT setval('phone_models_id_seq', (SELECT MAX(id) FROM phone_models));

-- 6. Products
INSERT INTO products (id, case_type_id, name, slug, material, description, features, base_price, original_price, is_featured, is_active) VALUES
(1, 1, 'AeroShield MagSafe Matte Case', 'aeroshield-magsafe-matte-case', 'Polycarbonate & German TPU Edge Bumper', 'Engineered specifically for extreme drop protection with an integrated N52 Neodymium MagSafe magnetic ring. Tested up to 12ft military-grade drops with raised 1.2mm camera bezels to prevent scratches.', '["N52 MagSafe Ring", "12ft Drop Tested", "Anti-fingerprint Matte Finish", "Tactile CNC Metal Buttons"]'::jsonb, 699.00, 999.00, TRUE, TRUE),
(2, 2, 'Titan Armor Military Drop Defense Case', 'titan-armor-military-drop-defense', 'Dual-Layer Aerospace Polymer & Shock Honeycomb', 'Engineered to withstand the toughest impacts. Featuring dual-layer perimeter defense, reinforced internal shock absorbers, and a deep camera housing shield.', '["Mil-STD 810G Certified", "15ft Drop Rating", "Corner Airbag Suspension", "Enhanced Ergonomic Grip"]'::jsonb, 799.00, 1199.00, TRUE, TRUE),
(3, 3, 'SilkyTouch Liquid Silicone Case', 'silkytouch-liquid-silicone-case', 'Food-Grade Microfiber Lined Silicone', 'Ultra-soft liquid silicone exterior feels sublime in hand while absorbing shock. Interior Japanese microfiber lining keeps your phone pristine.', '["Silky Soft Texture", "Plush Microfiber Lining", "Easy to Wipe Clean", "Precise Port Cutouts"]'::jsonb, 499.00, 799.00, TRUE, TRUE),
(4, 4, 'Heritage Handcrafted Vegan Leather Case', 'heritage-vegan-leather-case', 'Grain Textured Vegan Leather & Aluminum Accents', 'Timeless luxury meets everyday durability. Wrapped in water-resistant vegan leather that patinas gracefully without fading or peeling.', '["Full Grain Texture", "Aircraft Grade Aluminum Buttons", "MagSafe Compatible", "Featherweight 28g"]'::jsonb, 899.00, 1299.00, TRUE, TRUE),
(5, 6, 'Scuderia Racing 3D Honeycomb Case', 'scuderia-racing-3d-honeycomb-case', '3D Tactile Embossed TPU & Honeycomb Shock Shell', 'Physical 3D embossed Scuderia shield with Italian tricolor racing stripe and tactile hexagonal honeycomb mesh. Engineered with raised camera bezels and reinforced shock-absorbing bumper edges.', '["Physical 3D Embossed Shield", "Tricolor Racing Stripe", "Honeycomb Shock Absorption", "Tactile Bumper Grip", "100% Precision Camera Cutout"]'::jsonb, 499.00, 899.00, TRUE, TRUE),
(6, 6, 'Black Panther 3D Relief Armor Case', 'black-panther-3d-relief-armor-case', 'Dual-Layer 3D Textured Polycarbonate & German TPU', 'Tactile 3D embossed geometric honeycomb relief in stealth matte black. Engineered for drop resistance with air-cushioned corners.', '["Deep 3D Tactile Hex Pattern", "Stealth Matte Black Finish", "Air-Cushion Corner Suspension", "Scratch Resistant"]'::jsonb, 499.00, 849.00, TRUE, TRUE)
ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, original_price = EXCLUDED.original_price;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- 7. Product Images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES
(1, 'assets/images/product-aeroshield-magsafe.jpg', 'AeroShield MagSafe Front', TRUE, 1),
(1, 'assets/images/hero-case-luxury.jpg', 'AeroShield MagSafe Angle', FALSE, 2),
(2, 'assets/images/product-titan-armor.jpg', 'Titan Armor Drop Defense', TRUE, 1),
(3, 'assets/images/product-silkytouch-silicone.jpg', 'SilkyTouch Silicone', TRUE, 1),
(4, 'assets/images/product-heritage-leather.jpg', 'Heritage Vegan Leather', TRUE, 1),
(5, 'assets/images/3d-cases/trending-3d-ferrari-racing-studio.jpg', 'Scuderia 3D Honeycomb Studio', TRUE, 1),
(5, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Scuderia 3D Honeycomb Angle', FALSE, 2),
(6, 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg', 'Black Panther 3D Armor', TRUE, 1);

-- 8. Product Model Compatibility Mappings
-- Map 3D Cases (Product 5 & 6) to Samsung, Redmi, Nothing phone models
INSERT INTO product_model_compatibility (product_id, phone_model_id) VALUES
-- AeroShield, Titan, SilkyTouch, Heritage
(1, 1), (1, 2), (1, 3), (1, 120),
(2, 1), (2, 3), (2, 120), (2, 201),
(3, 4), (3, 108), (3, 302),
(4, 1), (4, 2), (4, 120),
-- Scuderia Racing 3D Honeycomb Case (Product 5) to all 62 models
(5, 101), (5, 102), (5, 103), (5, 104), (5, 105), (5, 106), (5, 107), (5, 108), (5, 109), (5, 110),
(5, 111), (5, 112), (5, 113), (5, 114), (5, 115), (5, 116), (5, 117), (5, 118), (5, 119), (5, 120),
(5, 121), (5, 122), (5, 123),
(5, 201), (5, 202), (5, 203), (5, 204), (5, 205), (5, 206), (5, 207), (5, 208), (5, 209), (5, 210),
(5, 211), (5, 212), (5, 213), (5, 214), (5, 215), (5, 216), (5, 217), (5, 218), (5, 219), (5, 220),
(5, 221), (5, 222), (5, 223), (5, 224), (5, 225), (5, 226), (5, 227), (5, 228), (5, 229), (5, 230),
(5, 231), (5, 232), (5, 233),
(5, 301), (5, 302), (5, 303), (5, 304), (5, 305), (5, 306),
-- Black Panther 3D Relief Armor Case (Product 6)
(6, 101), (6, 103), (6, 107), (6, 108), (6, 114), (6, 120), (6, 121),
(6, 201), (6, 202), (6, 203), (6, 208), (6, 214), (6, 221), (6, 223), (6, 232),
(6, 301), (6, 302), (6, 303)
ON CONFLICT (product_id, phone_model_id) DO NOTHING;

-- 9. Product Variants (SKUs)
INSERT INTO product_variants (id, product_id, colour_id, sku, additional_price, is_active) VALUES
(1, 1, 1, 'AS-MAG-BLK', 0.00, TRUE),
(2, 1, 2, 'AS-MAG-GRY', 0.00, TRUE),
(3, 2, 1, 'TA-MIL-BLK', 0.00, TRUE),
(4, 3, 3, 'ST-SIL-NVY', 0.00, TRUE),
(5, 4, 1, 'HL-LTH-BLK', 0.00, TRUE),
(6, 5, 1, '3D-SCU-RACE', 0.00, TRUE),
(7, 6, 1, '3D-PAN-ARM', 0.00, TRUE)
ON CONFLICT (sku) DO NOTHING;

SELECT setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));

-- 10. Initial Inventory
INSERT INTO inventory (product_variant_id, quantity, low_stock_threshold) VALUES
(1, 50, 5),
(2, 45, 5),
(3, 35, 5),
(4, 60, 5),
(5, 25, 5),
(6, 45, 5),
(7, 38, 5)
ON CONFLICT (product_variant_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 11. Initial Discounts
INSERT INTO discounts (id, name, discount_type, value, starts_at, ends_at, is_active) VALUES
(1, 'Festive Special 20% OFF', 'PERCENTAGE', 20.00, '2026-11-01 00:00:00+00', '2026-12-31 23:59:59+00', TRUE)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

SELECT setval('discounts_id_seq', (SELECT MAX(id) FROM discounts));

INSERT INTO discount_products (discount_id, product_id) VALUES
(1, 1), (1, 2)
ON CONFLICT (discount_id, product_id) DO NOTHING;
