# Casekaaran — Database Design & Schema Documentation

The database is built on **Supabase / PostgreSQL 15+** with strict relational constraints, explicit indexes, JSONB column support, and UTC timestamp triggers (`backend/database/supabase_schema.sql`). It also maintains full backward compatibility with MySQL 8.0 and an In-Memory mock fallback driver.

## Table Inventory (27 Normalized Tables)

1. `admins`: Stores authorized store administrators, role tiers (`SUPER_ADMIN`, `CATALOG_ADMIN`, `ORDER_ADMIN`), and bcrypt password hashes.
2. `customers`: Guest identity record keyed by normalized E.164 phone number.
3. `customer_addresses`: Physical delivery destination, PIN code, landmark, city, state.
4. `brands`: Supported smartphone brands (Apple, Samsung, OnePlus, Google Pixel, Xiaomi, Motorola, etc.) with custom icon/logo mappings.
5. `phone_models`: Exact phone models linked to brands with popularity markers (`is_popular`).
6. `case_types`: Case taxonomy (MagSafe Matte, Military Rugged, Liquid Silicone, Vegan Leather, Clear Hybrid).
7. `colours`: Color catalogue with hex color codes.
8. `products`: Core product catalog with base pricing, original MSRP, materials, and highlights.
9. `product_images`: Multi-angle product imagery with primary flag and display ordering.
10. `product_model_compatibility`: Explicit 1-to-many model compatibility mappings. Zero ambiguity on physical fit.
11. `product_variants`: SKU identifier mapped to a product and colour combination.
12. `inventory`: Quantity on hand with low-stock alerts.
13. `inventory_movements`: Immutable double-entry audit trail for all stock reservations, deductions, restocks, and admin adjustments.
14. `discounts`: Server-time promotional campaigns with percentage or fixed amount discounts.
15. `discount_products`: Product-to-campaign associations.
16. `carts`: Guest shopping session state.
17. `cart_items`: Cart items with exact phone model selection.
18. `orders`: Authoritative order ledger with financial totals and status tracking (`order_status`, `payment_status`, `shipping_status`).
19. `order_items`: Snapshot of items, prices, and discounts at the time of purchase.
20. `payments`: Cashfree session IDs, external payment transaction IDs, and status.
21. `payment_webhook_events`: Idempotency event log storing raw webhook payloads and cryptographic signatures.
22. `stock_reservations`: 15-minute temporary checkout inventory lock.
23. `shipping_details`: Logistics details including courier partner, AWB tracking number, and tracking URL.
24. `notification_logs`: Transactional WhatsApp message dispatch logs and delivery states.
25. `whatsapp_consents`: Explicit customer opt-in consent record with timestamp and IP address.
26. `admin_activity_logs`: Audit trail of administrative modifications.
27. `google_sheets_sync_logs`: External synchronization history for operational reporting sheets.
