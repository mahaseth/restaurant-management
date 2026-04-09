# Backend scripts

Run from the **`backend/`** directory unless noted. Requires **`npm install`** and a valid **`backend/.env`** (see [environment.md](environment.md)).

| npm script / command | Purpose |
|---------------------|--------|
| **`npm run dev`** | API server with nodemon (`src/app.js`). |
| **`npm run test:ai`** | `node scripts/test-ai-integration.mjs` — smoke checks for AI / Supabase integration (skips steps when env missing). |
| **`npm run migrate:menu-catalog`** | `node scripts/run-menu-catalog-migration.mjs` — applies SQL migrations in `supabase/migrations` using `SUPABASE_DATABASE_URL` or `DATABASE_URL`. |
| **`npm run backfill:table-qr`** | `node scripts/backfill-table-qr-tokens.mjs` — assigns **`qrToken`** (and QR image/link) to existing tables missing them. Needs Mongo + `APP_URL` or `CLIENT_URL` for link targets. |
| **`npm run migrate:table-session-cart`** | `node scripts/migrate-table-session-cart.mjs` — one-off migration for table session cart shape / data. |
| **`npm run resync:menu-embeddings`** | `node scripts/resync-menu-embeddings.mjs` — rebuilds embeddings in Supabase for all restaurants (or as implemented in script). Use after large menu changes or embedding model changes. Requires Mongo, Supabase URI, embedding provider env. |
| **`npm run eval:table-chat`** | `node scripts/eval-table-chat-sample.mjs` — sample evaluation against table chat API (see script header for env vars like `API_BASE_URL`). |

### Direct `node` scripts (no npm alias)

Inspect `backend/scripts/*.mjs` for one-off utilities (e.g. catalog migration helpers). Prefer **`npm run`** when a script is listed in `package.json`.

### Operational order (typical)

1. Configure `.env` (Mongo, Supabase, OpenAI/Azure).  
2. Run app / migrations as needed.  
3. After menu or agent changes affecting retrieval: **`resync:menu-embeddings`** or AI Studio **Sync menu** in the UI (`POST /api/ai-studio/sync-menu`).  
4. New tables get QR on create; legacy tables: **`backfill:table-qr`**.
