# Table Management API

Base URL: `{{baseURL}}/api/tables`
*Requires Authentication*

### 1. Get All Tables
**Endpoint:** `GET /`
**Description:** Fetches all tables for the restaurant.

**Response (200 OK):**
```json
[
  {
    "_id": "696a4c74867617de9b178152",
    "tableNumber": 1,
    "capacity": 4,
    "status": "ACTIVE",
    "qrToken": "opaque-url-safe-token",
    "qrLink": "https://your-frontend/table/qr/opaque-url-safe-token",
    "qrCode": "data:image/png;base64,...",
    "currentOrder": null
  }
]
```

`currentOrder` is attached when an open order exists for that table (non-cancelled/non-closed).

### 2. Create Table
**Endpoint:** `POST /`
**Description:** Creates a new table.
**Roles:** `OWNER`, `ADMIN`, `MANAGER`

**Request Payload:**
```json
{
  "tableNumber": 3,
  "capacity": 2,
  "status": "ACTIVE"
}
```

**Notes:**
- **`qrToken`** — Opaque token embedded in the guest URL (see [Public Table Session API](public-table-session.md)).
- **`qrLink`** — Full URL encoded in the QR (typically `{Origin}/table/qr/{qrToken}` using the request **`Origin`** header from the admin browser so LAN vs localhost matches how staff opened the dashboard).
- **`qrCode`** — PNG as a Base64 data URL, generated from `qrLink`.

**Response (201 Created):**
```json
{
  "_id": "696a4c86867617de9b178156",
  "tableNumber": 3,
  "capacity": 2,
  "status": "ACTIVE",
  "restaurantId": "695d3a82901b14accff0bcde",
  "qrToken": "...",
  "qrLink": "https://...",
  "qrCode": "data:image/png;base64,...",
  "createdAt": "..."
}
```

### 2b. Regenerate QR (same table, new link target)

**Endpoint:** `POST /:id/regenerate-qr`  
**Roles:** `OWNER`, `ADMIN`, `MANAGER`

**Description:** Ensures the table has a `qrToken`, then rebuilds **`qrLink`** and **`qrCode`** using the current request **`Origin`** (e.g. after switching from `localhost` to a LAN IP). The token in the path stays the same so printed QRs can be updated without reprinting if only the host changed.

**Response (200 OK):** Updated table document.

### 3. Update Table
**Endpoint:** `PUT /:id`
**Description:** Updates table details.
**Roles:** `OWNER`, `ADMIN`

**Request Payload:**
```json
{
  "tableNumber": 13,
  "status": "INACTIVE"
}
```

**Response (200 OK):**
Updated table object.

### 4. Delete Table
**Endpoint:** `DELETE /:id`
**Description:** Deletes a table.
**Roles:** `OWNER`, `ADMIN`

**Response (200 OK):**
```json
{
  "message": "Table deleted successfully"
}
```
