-- ============================================================================
-- CASEKAARAN E-COMMERCE DATABASE SCHEMA (MySQL 8.0 / InnoDB)
-- Normalized 27 Tables with Foreign Keys, Cascades & Strategic Read Indexes
-- ============================================================================

CREATE DATABASE IF NOT EXISTS casekaaran_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE casekaaran_db;

-- 1. Admins
CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('SUPER_ADMIN', 'CATALOG_ADMIN', 'ORDER_ADMIN') NOT NULL DEFAULT 'SUPER_ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email),
    INDEX idx_admin_status (is_active)
) ENGINE=InnoDB;

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NULL,
    preferred_language ENUM('en', 'hi') NOT NULL DEFAULT 'en',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

-- 3. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNSIGNED NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    landmark VARCHAR(100) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'India',
    delivery_instructions VARCHAR(255) NULL,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addr_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_addr_customer (customer_id),
    INDEX idx_addr_pincode (pin_code)
) ENGINE=InnoDB;

-- 4. Brands
CREATE TABLE IF NOT EXISTS brands (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url VARCHAR(500) NULL,
    icon VARCHAR(50) NULL DEFAULT 'bi-phone',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_brand_active_order (is_active, display_order)
) ENGINE=InnoDB;

-- 5. Phone Models
CREATE TABLE IF NOT EXISTS phone_models (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_model_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
    INDEX idx_model_brand_active (brand_id, is_active),
    INDEX idx_model_popular (is_popular)
) ENGINE=InnoDB;

-- 6. Case Types
CREATE TABLE IF NOT EXISTS case_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Colours
CREATE TABLE IF NOT EXISTS colours (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_type_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    material VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    features JSON NULL,
    base_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_casetype FOREIGN KEY (case_type_id) REFERENCES case_types(id) ON DELETE RESTRICT,
    INDEX idx_prod_active_featured (is_active, is_featured),
    INDEX idx_prod_casetype (case_type_id)
) ENGINE=InnoDB;

-- 9. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_img_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_img_product_order (product_id, display_order)
) ENGINE=InnoDB;

-- 10. Product Model Compatibility
CREATE TABLE IF NOT EXISTS product_model_compatibility (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    phone_model_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_model UNIQUE (product_id, phone_model_id),
    CONSTRAINT fk_pmc_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pmc_model FOREIGN KEY (phone_model_id) REFERENCES phone_models(id) ON DELETE CASCADE,
    INDEX idx_pmc_model (phone_model_id)
) ENGINE=InnoDB;

-- 11. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    colour_id INT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    additional_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_var_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_var_colour FOREIGN KEY (colour_id) REFERENCES colours(id) ON DELETE RESTRICT,
    INDEX idx_var_product (product_id, is_active)
) ENGINE=InnoDB;

-- 12. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id INT UNSIGNED NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    INDEX idx_inv_quantity (quantity)
) ENGINE=InnoDB;

-- 13. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id INT UNSIGNED NOT NULL,
    change_quantity INT NOT NULL,
    balance_quantity INT NOT NULL,
    movement_type ENUM('INITIAL', 'ORDER_RESERVED', 'ORDER_DEDUCTED', 'ORDER_CANCELLED_RESTOCK', 'ADMIN_ADJUSTMENT', 'RETURN_RESTOCK') NOT NULL,
    reference_id VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_by_admin_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_mov_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_mov_admin FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_inv_mov_ref (reference_id)
) ENGINE=InnoDB;

-- 14. Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_discount_active_dates (is_active, starts_at, ends_at)
) ENGINE=InnoDB;

-- 15. Discount Products
CREATE TABLE IF NOT EXISTS discount_products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    discount_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    CONSTRAINT uq_discount_product UNIQUE (discount_id, product_id),
    CONSTRAINT fk_dp_discount FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_dp_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. Carts
CREATE TABLE IF NOT EXISTS carts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    customer_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_cart_session (session_id)
) ENGINE=InnoDB;

-- 17. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id INT UNSIGNED NOT NULL,
    product_variant_id INT UNSIGNED NOT NULL,
    phone_model_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_item UNIQUE (cart_id, product_variant_id, phone_model_id),
    CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_model FOREIGN KEY (phone_model_id) REFERENCES phone_models(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT UNSIGNED NOT NULL,
    customer_address_id INT UNSIGNED NOT NULL,
    subtotal_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    order_status ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    payment_status ENUM('INITIATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'INITIATED',
    shipping_status ENUM('NOT_SHIPPED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED') NOT NULL DEFAULT 'NOT_SHIPPED',
    preferred_language ENUM('en', 'hi') NOT NULL DEFAULT 'en',
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ord_address FOREIGN KEY (customer_address_id) REFERENCES customer_addresses(id) ON DELETE RESTRICT,
    INDEX idx_ord_status (order_status),
    INDEX idx_ord_payment_status (payment_status),
    INDEX idx_ord_shipping_status (shipping_status),
    INDEX idx_ord_created_at (created_at)
) ENGINE=InnoDB;

-- 19. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    product_variant_id INT UNSIGNED NOT NULL,
    phone_model_id INT UNSIGNED NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    phone_model_name VARCHAR(100) NOT NULL,
    colour_name VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_oi_model FOREIGN KEY (phone_model_id) REFERENCES phone_models(id) ON DELETE RESTRICT,
    INDEX idx_oi_order (order_id)
) ENGINE=InnoDB;

-- 20. Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    cashfree_order_id VARCHAR(100) NOT NULL UNIQUE,
    cashfree_payment_id VARCHAR(100) NULL,
    payment_session_id VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NULL,
    status ENUM('INITIATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'INITIATED',
    failure_reason VARCHAR(255) NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    INDEX idx_pay_cf_order (cashfree_order_id),
    INDEX idx_pay_status (status)
) ENGINE=InnoDB;

-- 21. Payment Webhook Events
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(120) NOT NULL UNIQUE,
    payment_id INT UNSIGNED NULL,
    event_type VARCHAR(100) NOT NULL,
    signature_header TEXT NOT NULL,
    payload JSON NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at DATETIME NULL,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwe_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    INDEX idx_pwe_event (event_id)
) ENGINE=InnoDB;

-- 22. Stock Reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    product_variant_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    expires_at DATETIME NOT NULL,
    status ENUM('ACTIVE', 'COMMITTED', 'RELEASED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
    INDEX idx_sr_status_expires (status, expires_at)
) ENGINE=InnoDB;

-- 23. Shipping Details
CREATE TABLE IF NOT EXISTS shipping_details (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL UNIQUE,
    courier_name VARCHAR(100) NULL,
    tracking_number VARCHAR(100) NULL,
    tracking_url VARCHAR(500) NULL,
    packed_at DATETIME NULL,
    shipped_at DATETIME NULL,
    out_for_delivery_at DATETIME NULL,
    delivered_at DATETIME NULL,
    returned_at DATETIME NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ship_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 24. Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    channel ENUM('WHATSAPP') NOT NULL DEFAULT 'WHATSAPP',
    event_type VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    whatsapp_message_id VARCHAR(100) NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_nl_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_nl_status (status)
) ENGINE=InnoDB;

-- 25. WhatsApp Consents
CREATE TABLE IF NOT EXISTS whatsapp_consents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNSIGNED NOT NULL,
    phone VARCHAR(20) NOT NULL,
    has_consented BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    consented_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wac_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_wac_phone (phone)
) ENGINE=InnoDB;

-- 26. Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aal_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
    INDEX idx_aal_action (action, created_at)
) ENGINE=InnoDB;

-- 27. Google Sheets Sync Logs
CREATE TABLE IF NOT EXISTS google_sheets_sync_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    sheet_name ENUM('WAITING_LIST', 'PAID_ORDERS', 'INVENTORY') NOT NULL,
    sync_status ENUM('PENDING', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    synced_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_gssl_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_gssl_status (sync_status)
) ENGINE=InnoDB;
