# restaurant-management

A simple restaurant management system (backend + design). This repository contains a Node.js/Express backend and static design files.

## Prerequisites

- Node.js (LTS recommended) and `npm`
- Node.js (>=18 LTS) and `npm`
- MongoDB (local or remote instance)

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
