# Casekaaran — Deployment & Operations Guide

Casekaaran uses an independently deployable frontend and backend architecture.

## 1. Frontend Deployment (Vercel)
1. Push project to GitHub.
2. In Vercel, select **New Project** and import the repository.
3. Configure **Root Directory**: `frontend`.
4. Deploy! Static assets, HTML, CSS tokens, and Vanilla JS are served instantly via Vercel Edge Network.
5. In `frontend/vercel.json`, requests to `/api/*` are automatically reverse-proxied to your backend on Render.

## 2. Backend Deployment (Render / Railway with Supabase)
1. In Render Dashboard, click **New + Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables:
   - `DATABASE_URL` (Direct Supabase Connection String: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`)
   - Or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`.
   - `JWT_SECRET` (generate a strong 64-char key).
   - `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENVIRONMENT`.
   - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.
   - `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.

## 3. Database Migration & Seed on Supabase
Execute in the Supabase Dashboard SQL Editor:
1. Open [Supabase Dashboard](https://supabase.com/dashboard) -> Select Project -> **SQL Editor**.
2. Run `backend/database/supabase_schema.sql` (Creates all 27 tables, indexes & triggers).
3. Run `backend/database/seeds/supabase_seed.sql` (Seeds admin, brands, 62 phone models, 3D cases & stock).
