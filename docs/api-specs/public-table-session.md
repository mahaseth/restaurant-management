# Public Table Session API (unified QR: chat + cart + order)

Base URL: `{{baseURL}}/api/public`

**Authentication:** None. Guests use an opaque `sessionToken` issued when they open a table QR link.

These endpoints power the **unified table experience**: AI menu chat (when the restaurant’s agent is enabled), cart, and order placement in one browser session backed by `TableChatSession` in MongoDB.

---

## Flow

1. Admin creates a table → backend assigns a **`qrToken`** and generates a QR image whose link targets  
   `{frontendOrigin}/table/qr/{qrToken}`  
   (`frontendOrigin` comes from the **`Origin`** header on `POST /api/tables` / `POST /api/tables/:id/regenerate-qr`, with `CLIENT_URL` / `APP_URL` as fallback in code paths that support it.)
2. Guest opens that URL → frontend calls **`GET /api/public/qr/:qrToken/session`** → receives **`sessionToken`** and redirects to `/table/session/{sessionToken}`.
3. Guest app calls **`GET /table-session/:sessionToken`** (and related routes below) using that token.

---

## 1. Resolve QR → session

**Endpoint:** `GET /qr/:qrToken/session`

**Description:** Validates the table QR token, returns or creates a persistent session for that table.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionToken": "<opaque string>",
    "tableNumber": 1,
    "restaurantId": "<ObjectId string>",
    "tableId": "<ObjectId string>",
    "agentAvailable": true
  }
}
```

**Errors:** `404` if QR token is unknown.

---

## 2. Session state

**Endpoint:** `GET /table-session/:sessionToken`

**Description:** Snapshot for the guest UI: table number, cart, order phase, whether AI chat is available.

**Response (200 OK):** `success`, `data` with `sessionToken`, `tableId`, `tableNumber`, `restaurantId`, `agentAvailable`, `cart`, `activeOrder`, `orderGuestPhase`, `lastOrderStatus`.

**Errors:** `404` if session not found.

---

## 3. AI agent branding (theme)

**Endpoint:** `GET /table-session/:sessionToken/agent`

**Description:** Agent display name, avatar, chat theme, etc. Used when `agentAvailable` is true.

**Errors:** `404` when chat is not available for this venue/session.

---

## 4. Conversation history

**Endpoint:** `GET /table-session/:sessionToken/conversation`

**Description:** Prior messages for the guest chat UI.

**Errors:** `404` when chat unavailable.

---

## 5. Send chat message

**Endpoint:** `POST /table-session/:sessionToken/chat/message`

**Content-Type:** `application/json`

**Body:**
```json
{
  "message": "What Nepali dishes do you have?"
}
```

**Rules:** `message` is required, trimmed non-empty, max length **4000** characters.

**Response (200 OK):** `success`, `data.assistantMessage` (content, optional `menuRecommendations`, `suggestedActions`, `quickReplies`), `data.retrieval` (confidence, `fallbackUsed`, `matchedMenuItems`, etc.).

**Errors:** `400` empty/too long message, `403` AI not enabled, `500` model/infra failure.

**Menu RAG (retrieval):** Dish suggestions are grounded in vector search over menu catalog rows (Supabase/pgvector) when configured. Optional env tuning: see `backend/.env.example` (`MENU_RAG_*`, `MENU_RAG_DEBUG`). Canned safe replies are used when retrieval confidence is **none**, or **low** only if the guest **self-reports** an allergy/intolerance in the message text.

---

## 6. Cart

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/table-session/:sessionToken/cart` | Current cart |
| `POST` | `/table-session/:sessionToken/cart/items` | Add line (`menuItemId`, `quantity`, optional `notes`) |
| `PATCH` | `/table-session/:sessionToken/cart/items/:menuItemId` | Update quantity |
| `DELETE` | `/table-session/:sessionToken/cart/items/:menuItemId` | Remove line |
| `DELETE` | `/table-session/:sessionToken/cart` | Clear cart |

**Errors:** `404` unknown session, `400` validation (e.g. wrong restaurant, unavailable item).

---

## 7. Place order

**Endpoint:** `POST /table-session/:sessionToken/order`

**Body (JSON):** e.g. `notes`, `clientOrderId` (idempotency helper), optional payment fields if integrated.

**Response (201):** `success`, `data.order` (guest-safe order summary).

**Errors:** `404` session, `409` `ACTIVE_ORDER_EXISTS` if this session already has an active order that must be completed/cancelled first.

---

## 8. Order status

**Endpoint:** `GET /table-session/:sessionToken/order-status`

**Description:** Lightweight status for the guest UI.

---

## Related

- [Table Management API](table.md) — authenticated CRUD and QR generation.
- [Menu Management API](menu.md) — admin menu CRUD; guests typically use **`GET /api/menuitems/public?restaurantId=`** from the table UI.
- [AI Studio API](ai-studio.md) — provision agent, sync menu, evaluation logs for chat turns.
- [Scripts](../scripts.md) — CLI resync of embeddings (`resync:menu-embeddings`).
- Legacy public flows (`/api/public/table/:tableId`, order by number) remain for older links; new table QRs should use this session API.
