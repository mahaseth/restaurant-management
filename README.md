# restaurant-management

A simple restaurant management system (backend + design). This repository contains a Node.js/Express backend and static design files.

## Dev Environment Links

- **Front end url**: https://restaurant-management-frontend-one.vercel.app/
- **Backend url**: https://restaurant-management-brown-iota.vercel.app

## Prerequisites

- Node.js (LTS recommended) and `npm`
- Node.js (>=18 LTS) and `npm`
- MongoDB (local or remote instance)

## Libary used

- zod : for validation of json data
- cloudinary : used for storing files in bucket
- multer : for supporting form data with files.
- resend : for sending mail.

## Backend — Run locally

1. Open a terminal and change to the backend folder:

```bash
cd backend
```

2. Copy the example environment file and update values as needed:

Copy `.env.example` to `.env` and edit the file to set the MongoDB URI and other values. Example commands:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start MongoDB (if running locally).

Start your MongoDB server however you normally do on your OS — for example run `mongod`, start the MongoDB service, or use Docker. If you need a command example:

```bash
# Run MongoDB directly (if installed locally)
mongod --config /usr/local/etc/mongod.conf
```

For running mongo in docker can use bellow command"

```
docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest
```

5. Run the backend in development mode (uses `nodemon`):

```bash
npm run dev
```

The server entrypoint is `src/app.js`. If everything is configured correctly the backend will start and listen on the port specified in `.env` (or the default in `src/config/config.js`).

## Design

Static UI files are in the `Design/` folder: `home.html`, `nav.html`, `sign-in.html`, `sign-up.html`.

## Notes

- If you encounter module resolution errors with ESM, ensure local imports include the `.js` extension (the backend uses ESM via `"type": "module"` in `backend/package.json`).
- If you want me to run the dev server and verify startup here, tell me and I'll run it.
- The backend recommends Node.js v18 or later. An `.nvmrc` file is included in the `backend/` folder to make switching versions easy (`backend/.nvmrc`).

## Architecture

- **[docs/architecture.md](docs/architecture.md)** — system context, unified table session, RAG, data stores, and repo layout.

## Table QR guest flow (chat + cart + order)

- Guests scan a table QR that opens **`/table/qr/{qrToken}`**, then the app exchanges it for a **`sessionToken`** and loads **`/table/session/{sessionToken}`** (AI chat when enabled, cart, place order).
- Public HTTP API: **`/api/public/qr/:qrToken/session`** and **`/api/public/table-session/:sessionToken/*`** — see [docs/api-specs/public-table-session.md](docs/api-specs/public-table-session.md).
- Admin table APIs: [docs/api-specs/table.md](docs/api-specs/table.md) (`qrToken`, `qrLink`, regenerate QR). Set **`CLIENT_URL`** / open the dashboard from the same host guests will use so QR links are correct.
- Menu retrieval for AI: optional Supabase + embeddings; run **`npm run resync:menu-embeddings`** from `backend/` after large menu changes (env vars in `backend/.env.example`).

## Frontend — Run locally

1. Open a terminal and change to the frontend folder:

```bash
cd frontend
```

2. Copy the example environment file and update values as needed:

Copy `.env.example` to `.env` and edit the file to set the MongoDB URI and other values. Example commands:

```bash
# macOS / Linux

# Windows (Command Prompt)
copy .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Run the frontend in development mode:

```bash
npm run dev
```

By default the dev server listens on **all interfaces** (`0.0.0.0`) so phones on the same Wi‑Fi can open the app. For HMR from a LAN IP, `frontend/next.config.mjs` may list **`allowedDevOrigins`** entries (dev-only; adjust to your machine’s IP).
