# Environment variables

Do **not** commit real `.env` files. Copy from the examples and set values per environment.

| File | Purpose |
|------|---------|
| **`backend/.env.example`** | API, MongoDB, JWT, Cloudinary, Stripe, **AI (OpenAI / Azure)**, **Supabase** (`SUPABASE_DATABASE_URL`), optional **`MENU_RAG_DEBUG`**. |
| **`frontend/.env.example`** | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`. |

## Backend (summary)

- **`MONGODB_URL`** — Required for API and all scripts touching Mongo.  
- **`JWT_SECRET`** — Required for authenticated routes.  
- **`PORT`** — API port (default often `5000`).  
- **`CLIENT_URL`** / **`APP_URL`** — Frontend base URL (QR link fallback, email links, CORS-related assumptions).  
- **`CLOUDINARY_*`** — Image uploads (menu, AI Studio assets).  
- **`STRIPE_*`** — Payments and webhooks when enabled.  
- **AI — Azure *or* OpenAI:** Set either Azure (`AZURE_OPENAI_*`, `AZURE_RESOURCE_NAME`, deployments) or `OPENAI_API_KEY` (+ optional `OPENAI_CHAT_MODEL`). Embeddings must match what `embedding.service` expects.  
- **`SUPABASE_DATABASE_URL`** — Postgres connection string for **pgvector** menu rows (not the Supabase anon REST key).  
- **`MENU_RAG_DEBUG`** — Optional: log per-turn RAG fields (query, `topSimilarity`, matched item ids). Embeddings are not used to block or short-circuit the main reply (see `menuRagConfidence.util.js`, `.env.example`).

## Frontend (summary)

- **`NEXT_PUBLIC_API_URL`** — Backend origin (no trailing slash). If unset in the browser build, the app may derive `http://<hostname>:5000` from the current page host for local/LAN dev.  
- **`NEXT_PUBLIC_APP_NAME`** — Display name in the UI.

## Production checklist

- Use strong **`JWT_SECRET`** and rotate if leaked.  
- Set **`NEXT_PUBLIC_API_URL`** to the **public HTTPS** API URL.  
- Restrict Mongo and Supabase credentials; use least-privilege DB users where possible.  
- Stripe: live keys + live webhook secret in production only.

Full variable list and comments: **`backend/.env.example`**.
