# AI Studio API

Base URL: `{{baseURL}}/api/ai-studio`

**Authentication:** Required — same session as the rest of the dashboard (`authToken` cookie / JWT as configured). Routes are mounted with **`auth`** middleware; **`req.restaurant`** must be present (restaurant-scoped operations).

**Content types:** Branding uses JSON. Asset uploads use **`multipart/form-data`** with a single image file field (see routes — multer `single("image")` on the router).

---

## Status

**Endpoint:** `GET /`

**Description:** Returns provisioning state, agent toggle, last menu sync metadata, theme snapshot, and display settings for the current restaurant.

**Response (200 OK):** `{ "success": true, "data": { ... } }` — includes `provisioned`, `enabled`, `lastMenuSyncAt`, `lastMenuSyncError`, `menuRowCount`, `guestChatViaTableQr`, `chatTheme`, `agentDisplayName`, asset URLs, `responseStyle`, `agentTone`, `brandStory`, `customInstructions`, `omitAgentName`, etc.

**Errors:** `400` if restaurant context is missing.

---

## Provision agent

**Endpoint:** `POST /provision`

**Description:** Creates or refreshes the **`RestaurantAiAgent`** for this restaurant, enables it, sets `provisionedAt` when new.

**Response (200 OK):** `{ "success": true, "data": { "publicSlug", "enabled", "chatUrl", "qrUrl", "guestChatViaTableQr" } }`

Guest chat entry is **table QR → session** (see [Public table session](public-table-session.md)); `chatUrl` / `qrUrl` may be null in the payload.

---

## Sync menu to vector store

**Endpoint:** `POST /sync-menu`

**Description:** Pushes menu items for this restaurant into Supabase/pgvector (and updates agent sync metadata). Requires agent **provisioned and enabled**.

**Response (200 OK):** `{ "success": true, "data": { "rowCount", "lastMenuSyncAt" } }`

**Errors:** `400` if agent not provisioned, `500` on sync failure (check `lastMenuSyncError` on status).

**Note:** Bulk / CLI resync: `npm run resync:menu-embeddings` from `backend/` (see [Scripts](../scripts.md)).

---

## Branding & behavior

**Endpoint:** `PATCH /branding`

**Description:** Updates agent display name, theme object, tone, response length, brand story, operator instructions, optional asset URL overrides (if not using upload endpoints).

**Request body (JSON, partial):**
```json
{
  "agentDisplayName": "Hamro cafe",
  "chatTheme": { "primaryColor": "#c91b63", "headerBg": "#c91b63" },
  "responseStyle": "default",
  "agentTone": "friendly",
  "brandStory": "",
  "customInstructions": "",
  "omitAgentName": false,
  "avatarUrl": "",
  "backgroundImageUrl": "",
  "voucherBarcodeUrl": ""
}
```

**Response (200 OK):** `{ "success": true, "data": { ...resolved fields } }`

---

## Asset uploads (multipart)

All expect **`image`** file field. Previous Cloudinary URL for that slot is replaced when upload succeeds.

| Method | Path | Updates |
|--------|------|---------|
| `POST` | `/upload/avatar` | `avatarUrl` |
| `POST` | `/upload/background` | `backgroundImageUrl` |
| `POST` | `/upload/voucher-barcode` | `voucherBarcodeUrl` |

**Response (200 OK):** `{ "success": true, "data": { "<field>": "https://..." } }`

**Errors:** `400` missing file or restaurant context, `500` upload failure.

---

## Table assistant evaluation (roles: Owner, Admin, Manager)

Logs are written asynchronously when guests use **`POST /api/public/table-session/:sessionToken/chat/message`** (retrieval + reply metadata).

### List logs

**Endpoint:** `GET /evaluation/logs`

**Query parameters (optional):**
- `limit` — default 50, max 200  
- `skip` — pagination offset  
- `confidence` — `high` | `low` | `none`  
- `fallbackUsed` — `true` | `false`  
- `from`, `to` — ISO date strings (inclusive range; `to` end-of-day)

**Response (200 OK):** `{ "success": true, "data": { "items", "total", "limit", "skip" } }`

### Summary aggregates

**Endpoint:** `GET /evaluation/summary`

**Query:** optional `from`, `to` (same as above).

**Response (200 OK):** `{ "success": true, "data": { ...aggregates } }`

### Review label (human feedback)

**Endpoint:** `PATCH /evaluation/logs/:id/review`

**Body:**
```json
{
  "reviewLabel": "useful"
}
```

**Values:** `useful`, `unclear`, `incorrect`, `unsafe`, or **`null`** to clear.

**Response (200 OK):** `{ "success": true, "data": { "log": { ... } } }`

**Errors:** `400` missing/invalid `reviewLabel`, `404` log not found for this restaurant.

---

## Related

- [System architecture](../architecture.md) — RAG and data flow  
- [Public table session](public-table-session.md) — guest chat endpoint  
- [Environment variables](../environment.md) — OpenAI / Azure / Supabase  
