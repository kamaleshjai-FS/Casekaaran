# Casekaaran — REST API Documentation

Base URL: `/api`

### Standard Response Envelope
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Public Storefront Routes
- `GET /api/brands` — List active smartphone brands.
- `GET /api/brands/:brandSlug/models` — List models belonging to a smartphone brand.
- `GET /api/models/popular` — Retrieve the top 12 popular phone models.
- `GET /api/products` — Filter products by `brand`, `model`, `case_type`, `sort` (`newest`, `price_asc`, `price_desc`, `popular`), and `search`.
- `GET /api/products/:slug` — Single product details including high-res gallery, compatible models, and variants.
- `POST /api/checkout` — Create guest order, reserve stock, and generate Cashfree payment session.
- `GET /api/orders/:orderNumber/status` — Read-only order tracking status.

### Payment & Webhook Routes
- `POST /api/webhooks/cashfree` — Authoritative listener for Cashfree webhook events (`PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`). Validates HMAC-SHA256 signature and event idempotency.

### Admin Routes (Protected by HTTP-Only Cookie & JWT)
- `POST /api/auth/login` — Authenticate store administrator.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Return current admin profile.
- `GET /api/admin/dashboard/stats` — KPI metrics (Revenue, Verified Orders, Pending Orders, Low Stock Alerts).
- `GET /api/admin/orders` — Filtered order ledger with customer contact and payment statuses.
- `PATCH /api/admin/orders/:orderNumber/shipping` — Explicit shipping update triggering corresponding WhatsApp notifications.
- `PUT /api/admin/inventory/:variantId` — Adjust stock quantity with automatic audit log.
- `GET /api/admin/notifications` — Review WhatsApp delivery log and sync events.
- `POST /api/admin/reports/sync-sheets` — Force synchronization with Google Sheets.
