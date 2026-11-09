-- ============================================================================
-- CASEKAARAN E-COMMERCE DATABASE SCHEMA (SUPABASE / POSTGRESQL 15+)
-- Production Schema: 27 Normalized Tables with Foreign Keys, Cascades, Indexes,
-- Auto-updating Timestamps and Row Security compatibility.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function to auto-update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Admins
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'SUPER_ADMIN' CHECK (role IN ('SUPER_ADMIN', 'CATALOG_ADMIN', 'ORDER_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admins (email);
CREATE INDEX IF NOT EXISTS idx_admin_status ON admins (is_active);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NULL,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

-- 3. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    landmark VARCHAR(100) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'India',
    delivery_instructions VARCHAR(255) NULL,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_addr_customer ON customer_addresses (customer_id);
CREATE INDEX IF NOT EXISTS idx_addr_pincode ON customer_addresses (pin_code);

-- 4. Brands
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url VARCHAR(500) NULL,
    icon VARCHAR(50) NULL DEFAULT 'bi-phone',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_brand_active_order ON brands (is_active, display_order);

-- 5. Phone Models
CREATE TABLE IF NOT EXISTS phone_models (
    id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_model_brand_active ON phone_models (brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_model_popular ON phone_models (is_popular);

-- 6. Case Types
CREATE TABLE IF NOT EXISTS case_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Colours
CREATE TABLE IF NOT EXISTS colours (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    case_type_id INT NOT NULL REFERENCES case_types(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    material VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    features JSONB NULL,
    base_price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2) NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prod_active_featured ON products (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_prod_casetype ON products (case_type_id);

-- 9. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_img_product_order ON product_images (product_id, display_order);

-- 10. Product Model Compatibility
CREATE TABLE IF NOT EXISTS product_model_compatibility (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    phone_model_id INT NOT NULL REFERENCES phone_models(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_model UNIQUE (product_id, phone_model_id)
);
CREATE INDEX IF NOT EXISTS idx_pmc_model ON product_model_compatibility (phone_model_id);

-- 11. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    colour_id INT NOT NULL REFERENCES colours(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    additional_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_var_product ON product_variants (product_id, is_active);

-- 12. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inv_quantity ON inventory (quantity);

-- 13. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    change_quantity INT NOT NULL,
    balance_quantity INT NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('INITIAL', 'ORDER_RESERVED', 'ORDER_DEDUCTED', 'ORDER_CANCELLED_RESTOCK', 'ADMIN_ADJUSTMENT', 'RETURN_RESTOCK')),
    reference_id VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_by_admin_id INT NULL REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inv_mov_ref ON inventory_movements (reference_id);

-- 14. Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(30) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    value NUMERIC(10,2) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_discount_active_dates ON discounts (is_active, starts_at, ends_at);

-- 15. Discount Products
CREATE TABLE IF NOT EXISTS discount_products (
    id SERIAL PRIMARY KEY,
    discount_id INT NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_discount_product UNIQUE (discount_id, product_id)
);

-- 16. Carts
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    customer_id INT NULL REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cart_session ON carts (session_id);

-- 17. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    phone_model_id INT NOT NULL REFERENCES phone_models(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_item UNIQUE (cart_id, product_variant_id, phone_model_id)
);

-- 18. Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_address_id INT NOT NULL REFERENCES customer_addresses(id) ON DELETE RESTRICT,
    subtotal_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'CANCELLED', 'COMPLETED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'INITIATED' CHECK (payment_status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED')),
    shipping_status VARCHAR(30) NOT NULL DEFAULT 'NOT_SHIPPED' CHECK (shipping_status IN ('NOT_SHIPPED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED')),
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    notes VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ord_status ON orders (order_status);
CREATE INDEX IF NOT EXISTS idx_ord_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_ord_shipping_status ON orders (shipping_status);
CREATE INDEX IF NOT EXISTS idx_ord_created_at ON orders (created_at);

-- 19. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    phone_model_id INT NOT NULL REFERENCES phone_models(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    phone_model_name VARCHAR(100) NOT NULL,
    colour_name VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    final_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oi_order ON order_items (order_id);

-- 20. Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    cashfree_order_id VARCHAR(100) NOT NULL UNIQUE,
    cashfree_payment_id VARCHAR(100) NULL,
    payment_session_id VARCHAR(255) NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED')),
    failure_reason VARCHAR(255) NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pay_cf_order ON payments (cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments (status);

-- 21. Payment Webhook Events
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(120) NOT NULL UNIQUE,
    payment_id INT NULL REFERENCES payments(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    signature_header TEXT NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pwe_event ON payment_webhook_events (event_id);

-- 22. Stock Reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMMITTED', 'RELEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sr_status_expires ON stock_reservations (status, expires_at);

-- 23. Shipping Details
CREATE TABLE IF NOT EXISTS shipping_details (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    courier_name VARCHAR(100) NULL,
    tracking_number VARCHAR(100) NULL,
    tracking_url VARCHAR(500) NULL,
    packed_at TIMESTAMPTZ NULL,
    shipped_at TIMESTAMPTZ NULL,
    out_for_delivery_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    returned_at TIMESTAMPTZ NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24. Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP' CHECK (channel IN ('WHATSAPP')),
    event_type VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    whatsapp_message_id VARCHAR(100) NULL,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nl_status ON notification_logs (status);

-- 25. WhatsApp Consents
CREATE TABLE IF NOT EXISTS whatsapp_consents (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    has_consented BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wac_phone ON whatsapp_consents (phone);

-- 26. Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NULL,
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aal_action ON admin_activity_logs (action, created_at);

-- 27. Google Sheets Sync Logs
CREATE TABLE IF NOT EXISTS google_sheets_sync_logs (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sheet_name VARCHAR(30) NOT NULL CHECK (sheet_name IN ('WAITING_LIST', 'PAID_ORDERS', 'INVENTORY')),
    sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    synced_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gssl_status ON google_sheets_sync_logs (sync_status);

-- Attach updated_at triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON %I;', tbl);
        EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl);
    END LOOP;
END;
$$;
