# Casekaaran — Premium Mobile Phone Case E-Commerce Platform

A production-oriented, mobile-first e-commerce platform dedicated exclusively to mobile phone cases. Casekaaran provides a responsive shopping experience with bilingual English & Hindi support, brand and exact-model compatibility matching, guest checkout, Cashfree payment processing, automated WhatsApp notifications, and Google Sheets operational reporting.

---

## 🌟 Key Features

- **Precision Compatibility Engine**: Explicit phone model selection prevents buying incompatible cases.
- **Bilingual Interface**: Native English and Hindi (`Noto Sans Devanagari`) support with persistent localStorage language selection.
- **Guest Checkout**: Fast checkout without forced account registration; customer orders are tracked by validated WhatsApp mobile numbers.
- **Cashfree Payment Gateway**: Server-side order session creation with raw body `HMAC-SHA256` signature verification and idempotent webhook processing.
- **15-Minute Stock Reservation**: Prevents overselling under high concurrency by atomically locking inventory during payment.
- **WhatsApp Cloud API Integration**: Automated transactional updates for order creation, payment confirmation, packing, shipping with tracking numbers, and delivery.
- **Google Sheets Operational Reporting**: Automatic synchronization to "Waiting List" and "Paid Orders" sheets for operational visibility.
- **Admin Control Dashboard**: Dedicated management portal with KPI metrics, product catalog, brand & model management, inventory adjustments, and explicit shipping status updates.
- **High Concurrency Performance Target**: Built to handle **500 HTTP requests per minute** (~8.3 RPS) with verified benchmarks exceeding 250 RPS.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 Tokens, Bootstrap 5, Vanilla JavaScript (ES6+ Modules), Bootstrap Icons.
- **Backend**: Node.js, Express.js REST API, Helmet, CORS, Rate Limiting, Cookie-Parser, Compression.
- **Database**: MySQL 8.0 (InnoDB) with 27 normalized relational tables and connection pooling via `mysql2/promise`.
- **Integrations**: Cashfree Payments, Meta WhatsApp Business Cloud API, Google Sheets API v4, Cloudinary CDN.
- **Deployment**: Vercel (Frontend), Render (Backend), Managed MySQL.

---

## 🚀 Quick Start & Local Execution

### 1. Clone & Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

### 2. Run Database Migrations (Optional for MySQL)
```bash
mysql -u root -p casekaaran_db < database/schema.sql
mysql -u root -p casekaaran_db < database/seeds/initial_seed.sql
```
*(Note: If MySQL is not running locally, Casekaaran automatically activates its built-in in-memory fallback driver for local testing and demonstration).*

### 3. Start the Server
```bash
npm start
```
- **Storefront**: [http://localhost:5000/index.html](http://localhost:5000/index.html)
- **Catalog**: [http://localhost:5000/products.html](http://localhost:5000/products.html)
- **Cart**: [http://localhost:5000/cart.html](http://localhost:5000/cart.html)
- **Admin Portal**: [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)
  - Username: `admin`
  - Password: `Admin@Casekaaran2026`

---

## 🧪 Testing

```bash
# Run Unit and Integration Tests
cd backend
npm test

# Run 500 Requests/Minute Load Test Benchmark
npm run test:load
```

---

## 📁 Project Structure

```
Casekaaran/
├── frontend/                   # Client Layer (Vercel deployable)
│   ├── index.html              # Storefront Homepage
│   ├── products.html           # Filterable Product Catalog
│   ├── product-details.html    # Product View with Compatibility Checker
│   ├── cart.html               # Shopping Bag
│   ├── checkout.html           # Guest Checkout & Cashfree Launcher
│   ├── order-success.html      # Order Confirmed & Tracking Stepper
│   ├── order-failure.html      # Payment Retry
│   ├── admin-login.html        # Admin Authentication
│   ├── admin-dashboard.html    # Admin Control Panel
│   ├── css/                    # Modular Design Tokens & Styles
│   ├── js/                     # i18n, API client, Cart, Products, Checkout, Admin
│   └── vercel.json             # Vercel Deployment Configuration
│
├── backend/                    # Server Layer (Render deployable)
│   ├── src/
│   │   ├── config/             # Database pool, Cashfree, WhatsApp, Sheets config
│   │   ├── controllers/        # REST API controllers
│   │   ├── middleware/         # Auth, Helmet, Rate Limiter, Webhook signature
│   │   ├── routes/             # Express routes
│   │   ├── services/           # Order, Payment, Inventory, Discount, WhatsApp, Sheets
│   │   └── utils/              # Structured logger, Order ID generator, Response envelope
│   ├── database/
│   │   ├── schema.sql          # 27-Table MySQL Schema
│   │   └── seeds/              # Seed data for brands, models, products, variants
│   ├── tests/                  # Unit, Integration & Load testing
│   ├── package.json
│   └── server.js
│
├── docs/                       # Architecture, Database, API, Deployment & Testing docs
├── render.yaml                 # Render Deployment Blueprint
└── README.md
```

---

## 📄 License
ISC © 2026 Casekaaran Technologies. All rights reserved.
