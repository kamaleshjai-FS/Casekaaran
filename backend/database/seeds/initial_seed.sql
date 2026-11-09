-- ============================================================================
-- CASEKAARAN SEED DATA
-- Production-ready baseline data for brands, models, products, variants & admin
-- ============================================================================

USE casekaaran_db;

-- 1. Initial Admin User (password: Admin@Casekaaran2026)
-- Hash generated via bcrypt with 12 salt rounds
INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
VALUES (
    'admin',
    'admin@casekaaran.com',
    '$2a$12$6f5b741tD1Y7u537c6.2iOPBvRz83zI.KxYx05F7sN2uVnBwzF6iq',
    'Casekaaran Master Admin',
    'SUPER_ADMIN',
    TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- 2. Smartphone Brands
INSERT INTO brands (name, slug, icon, display_order, is_active) VALUES
('Apple', 'apple', 'bi-apple', 1, TRUE),
('Samsung', 'samsung', 'bi-phone', 2, TRUE),
('OnePlus', 'oneplus', 'bi-phone', 3, TRUE),
('Google Pixel', 'google-pixel', 'bi-google', 4, TRUE),
('Xiaomi', 'xiaomi', 'bi-phone', 5, TRUE),
('Motorola', 'motorola', 'bi-phone', 6, TRUE),
('Realme', 'realme', 'bi-phone', 7, TRUE),
('Vivo', 'vivo', 'bi-phone', 8, TRUE),
('Oppo', 'oppo', 'bi-phone', 9, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Smartphone Phone Models
INSERT INTO phone_models (brand_id, name, slug, is_popular, display_order, is_active) VALUES
-- Apple
(1, 'iPhone 16 Pro Max', 'iphone-16-pro-max', TRUE, 1, TRUE),
(1, 'iPhone 16 Pro', 'iphone-16-pro', TRUE, 2, TRUE),
(1, 'iPhone 16', 'iphone-16', TRUE, 3, TRUE),
(1, 'iPhone 15 Pro Max', 'iphone-15-pro-max', TRUE, 4, TRUE),
(1, 'iPhone 15 Pro', 'iphone-15-pro', TRUE, 5, TRUE),
(1, 'iPhone 15', 'iphone-15', TRUE, 6, TRUE),
(1, 'iPhone 14', 'iphone-14', FALSE, 7, TRUE),
(1, 'iPhone 13', 'iphone-13', FALSE, 8, TRUE),

-- Samsung
(2, 'Galaxy S24 Ultra', 'galaxy-s24-ultra', TRUE, 1, TRUE),
(2, 'Galaxy S24+', 'galaxy-s24-plus', FALSE, 2, TRUE),
(2, 'Galaxy S24', 'galaxy-s24', TRUE, 3, TRUE),
(2, 'Galaxy A55 5G', 'galaxy-a55-5g', TRUE, 4, TRUE),
(2, 'Galaxy A35 5G', 'galaxy-a35-5g', FALSE, 5, TRUE),
(2, 'Galaxy S23 Ultra', 'galaxy-s23-ultra', TRUE, 6, TRUE),

-- OnePlus
(3, 'OnePlus 12', 'oneplus-12', TRUE, 1, TRUE),
(3, 'OnePlus 12R', 'oneplus-12r', TRUE, 2, TRUE),
(3, 'OnePlus Nord 4', 'oneplus-nord-4', TRUE, 3, TRUE),
(3, 'OnePlus 11', 'oneplus-11', FALSE, 4, TRUE),

-- Google Pixel
(4, 'Pixel 9 Pro', 'pixel-9-pro', TRUE, 1, TRUE),
(4, 'Pixel 9', 'pixel-9', TRUE, 2, TRUE),
(4, 'Pixel 8 Pro', 'pixel-8-pro', TRUE, 3, TRUE),
(4, 'Pixel 8a', 'pixel-8a', TRUE, 4, TRUE),

-- Xiaomi
(5, 'Xiaomi 14 Ultra', 'xiaomi-14-ultra', TRUE, 1, TRUE),
(5, 'Redmi Note 13 Pro+', 'redmi-note-13-pro-plus', TRUE, 2, TRUE),

-- Motorola
(6, 'Edge 50 Pro', 'edge-50-pro', TRUE, 1, TRUE),
(6, 'Edge 50 Fusion', 'edge-50-fusion', TRUE, 2, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Case Types
INSERT INTO case_types (name, slug, description, is_active) VALUES
('MagSafe Matte', 'magsafe', 'Slim tactile polycarbonate back with built-in neodymium magnetic ring for seamless wireless charging.', TRUE),
('Military Rugged', 'rugged', 'Dual-layer bumper defense tested against 12-foot drops with reinforced air-cushion corner bumpers.', TRUE),
('Liquid Silicone', 'silicone', 'Silky-touch food-grade silicone lined with plush microfiber interior to prevent micro-scratches.', TRUE),
('Vegan Leather', 'leather', 'Handcrafted premium textured grain leather offering sophisticated executive elegance.', TRUE),
('Clear Hybrid', 'clear-hybrid', 'Anti-yellowing optical clarity with 4H scratch-resistant acrylic backplate and TPU shock perimeter.', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Colours
INSERT INTO colours (name, hex_code) VALUES
('Midnight Black', '#0F172A'),
('Titanium Grey', '#64748B'),
('Deep Navy', '#1E3A8A'),
('Forest Green', '#14532D'),
('Crimson Red', '#991B1B')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Products
INSERT INTO products (id, case_type_id, name, slug, material, description, features, base_price, original_price, is_featured, is_active) VALUES
(1, 1, 'AeroShield MagSafe Matte Case', 'aeroshield-magsafe-matte-case', 'Polycarbonate & German TPU Edge Bumper', 'Engineered specifically for extreme drop protection with an integrated N52 Neodymium MagSafe magnetic ring. Tested up to 12ft military-grade drops with raised 1.2mm camera bezels to prevent scratches.', '["N52 MagSafe Ring", "12ft Drop Tested", "Anti-fingerprint Matte Finish", "Tactile CNC Metal Buttons"]', 699.00, 999.00, TRUE, TRUE),
(2, 2, 'Titan Armor Military Drop Defense Case', 'titan-armor-military-drop-defense', 'Dual-Layer Aerospace Polymer & Shock Honeycomb', 'Engineered to withstand the toughest impacts. Featuring dual-layer perimeter defense, reinforced internal shock absorbers, and a deep camera housing shield.', '["Mil-STD 810G Certified", "15ft Drop Rating", "Corner Airbag Suspension", "Enhanced Ergonomic Grip"]', 799.00, 1199.00, TRUE, TRUE),
(3, 3, 'SilkyTouch Liquid Silicone Case', 'silkytouch-liquid-silicone-case', 'Food-Grade Microfiber Lined Silicone', 'Ultra-soft liquid silicone exterior feels sublime in hand while absorbing shock. Interior Japanese microfiber lining keeps your phone pristine.', '["Silky Soft Texture", "Plush Microfiber Lining", "Easy to Wipe Clean", "Precise Port Cutouts"]', 499.00, 799.00, TRUE, TRUE),
(4, 4, 'Heritage Handcrafted Vegan Leather Case', 'heritage-vegan-leather-case', 'Grain Textured Vegan Leather & Aluminum Accents', 'Timeless luxury meets everyday durability. Wrapped in water-resistant vegan leather that patinas gracefully without fading or peeling.', '["Full Grain Texture", "Aircraft Grade Aluminum Buttons", "MagSafe Compatible", "Featherweight 28g"]', 899.00, 1299.00, TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Product Images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES
(1, 'assets/images/product-aeroshield-magsafe.jpg', 'AeroShield MagSafe Front', TRUE, 1),
(1, 'assets/images/hero-case-luxury.jpg', 'AeroShield MagSafe Angle', FALSE, 2),
(2, 'assets/images/product-titan-armor.jpg', 'Titan Armor Drop Defense', TRUE, 1),
(3, 'assets/images/product-silkytouch-silicone.jpg', 'SilkyTouch Silicone', TRUE, 1),
(4, 'assets/images/product-heritage-leather.jpg', 'Heritage Vegan Leather', TRUE, 1)
ON DUPLICATE KEY UPDATE product_id=VALUES(product_id);

-- 8. Product Model Compatibility Mappings
-- AeroShield (Product 1) compatible with iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15 Pro, Galaxy S24 Ultra
INSERT INTO product_model_compatibility (product_id, phone_model_id) VALUES
(1, 1), (1, 2), (1, 5), (1, 9),
-- Titan Armor (Product 2) compatible with iPhone 16 Pro Max, iPhone 15 Pro, Galaxy S24 Ultra, OnePlus 12
(2, 1), (2, 5), (2, 9), (2, 15),
-- SilkyTouch (Product 3) compatible with iPhone 15, Galaxy S24, Pixel 9 Pro
(3, 6), (3, 11), (3, 19),
-- Heritage Leather (Product 4) compatible with iPhone 16 Pro Max, iPhone 16 Pro, Galaxy S24 Ultra
(4, 1), (4, 2), (4, 9)
ON DUPLICATE KEY UPDATE product_id=VALUES(product_id);

-- 9. Product Variants (SKUs)
INSERT INTO product_variants (id, product_id, colour_id, sku, additional_price, is_active) VALUES
(1, 1, 1, 'AS-MAG-BLK', 0.00, TRUE),
(2, 1, 2, 'AS-MAG-GRY', 0.00, TRUE),
(3, 2, 1, 'TA-MIL-BLK', 0.00, TRUE),
(4, 3, 3, 'ST-SIL-NVY', 0.00, TRUE),
(5, 4, 1, 'HL-LTH-BLK', 0.00, TRUE)
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

-- 10. Initial Inventory
INSERT INTO inventory (product_variant_id, quantity, low_stock_threshold) VALUES
(1, 50, 5),
(2, 45, 5),
(3, 35, 5),
(4, 60, 5),
(5, 25, 5)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- 11. Initial Discounts
INSERT INTO discounts (id, name, discount_type, value, starts_at, ends_at, is_active) VALUES
(1, 'Festive Special 20% OFF', 'PERCENTAGE', 20.00, '2026-11-01 00:00:00', '2026-12-31 23:59:59', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO discount_products (discount_id, product_id) VALUES
(1, 1), (1, 2)
ON DUPLICATE KEY UPDATE discount_id=VALUES(discount_id);
