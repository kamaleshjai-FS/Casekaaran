# Casekaaran — Architectural & Implementation Plan

Please refer to the complete Phase 1 specification documented in the project documentation and artifact.

### Core Highlights:
- **Architecture**: Modular monolith with decoupled static frontend (Bootstrap 5, Vanilla JS, Noto Sans Devanagari) and Express.js REST API.
- **Database**: MySQL 8.0 InnoDB with 27 normalized tables, atomic inventory constraints, and foreign key relations.
- **Payment & Order**: Cashfree server-side session generation, HMAC-SHA256 raw webhook verification, idempotency table, and 15-minute stock reservation lock.
- **Asynchronous Integrations**: Decoupled background queue for Meta WhatsApp Cloud API and Google Sheets API sync.
