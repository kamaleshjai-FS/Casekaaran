# Casekaaran — Deployment & Operations Guide

Casekaaran uses an independently deployable frontend and backend architecture.

## 1. Frontend Deployment (Vercel)
1. Push project to GitHub.
2. In Vercel, select **New Project** and import the repository.
3. Configure **Root Directory**: `frontend`.
4. Deploy! Static assets, HTML, CSS tokens, and Vanilla JS are served instantly via Vercel Edge Network.
5. In `frontend/vercel.json`, requests to `/api/*` are automatically reverse-proxied to your backend on Render.

## 2. Backend Deployment (Render)
1. In Render Dashboard, click **New + Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Environment**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set Environment Variables from `backend/.env.example`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (from managed MySQL provider like Aiven or PlanetScale).
   - `JWT_SECRET` (generate a strong 64-char key).
   - `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENVIRONMENT`.
   - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.
   - `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.

## 3. Database Migration & Seed
Execute the migration scripts against your MySQL instance:
```bash
mysql -h <DB_HOST> -u <DB_USER> -p <DB_NAME> < backend/database/schema.sql
mysql -h <DB_HOST> -u <DB_USER> -p <DB_NAME> < backend/database/seeds/initial_seed.sql
```
