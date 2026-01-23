# Customer Ordering Module Documentation

## Table of Contents
1. [Module Overview](#module-overview)
2. [Database Schema](#database-schema)
3. [Backend API Documentation](#backend-api-documentation)

---

## 1. Module Overview

### Purpose
The Customer Ordering Module enables **contactless, self-service ordering** for restaurant customers through QR code scanning. Customers can:
- Scan a QR code at their table
- Browse the menu without authentication
- Place orders directly from their mobile device
- Track order status in real-time

### Problems It Solves
- **Reduces wait times**: Customers order immediately without waiting for staff
- **Minimizes contact**: Fully contactless ordering experience (COVID-safe)
- **Improves accuracy**: Orders go directly to kitchen, reducing miscommunication
- **Increases efficiency**: Staff can focus on food preparation and service rather than taking orders
- **Enhances customer experience**: Customers control their ordering pace and can review menu at leisure

### Public Access Logic (No Login Required)

#### QR Link Validation
Each table has a unique QR code that is **automatically generated** by the backend upon table creation. It encodes a URL in the format:
```
{{FRONTEND_URL}}/order?tableId=<UNIQUE_TABLE_ID>&restaurantId=<RESTAURANT_ID>
```

**Validation Flow:**
1. Customer scans QR code → Browser opens the URL
2. Frontend extracts `tableId` and `restaurantId` from query parameters
3. Backend validates table exists and belongs to the restaurant
4. If valid → Display menu and allow ordering
5. If invalid → Show error message "Invalid table"

**Table ID Format:**
- MongoDB ObjectId (24-character hexadecimal string)
- Example: `507f1f77bcf86cd799439011`
- Validated using: `mongoose.Types.ObjectId.isValid(tableId)`

#### Abuse Prevention Strategies

> [!IMPORTANT]
> Public endpoints are vulnerable to abuse. Implement multiple layers of protection.

**1. Rate Limiting (Essential)**
```javascript
// Per IP address
- 10 orders per hour per IP
- 100 menu views per hour per IP

// Per table
- 20 orders per hour per tableId
- Prevents malicious users from spamming orders for a specific table
```

**2. Table Token (Optional - Enhanced Security)**
- Generate a temporary token when QR is scanned (valid for 4 hours)
- Token stored in session/localStorage
- Subsequent requests must include this token
- Token expires when table is marked as "cleared" by staff

**3. Order Validation**
- Minimum order value (e.g., at least 1 item)
- Maximum items per order (e.g., 50 items to prevent abuse)
- Price verification server-side (never trust client-sent prices)

**4. CAPTCHA (Optional)**
- Implement for suspicious activity (e.g., 5+ orders in 10 minutes)
- Use Google reCAPTCHA v3 for invisible verification

**5. Monitoring & Alerts**
- Log all order attempts with IP, tableId, timestamp
- Alert staff if unusual patterns detected (e.g., 10 orders from same table in 5 minutes)

### Table ID Concept

#### What is `tableId`?
- A unique identifier for each physical table in the restaurant
- Stored as a MongoDB ObjectId reference to a `Table` document
- Links orders to specific tables for kitchen routing and service

#### Where it comes from
1. **Restaurant Setup**: Admin creates tables in the system
   - Table 1 → `tableId: 507f1f77bcf86cd799439011`
   - Table 2 → `tableId: 507f1f77bcf86cd799439012`
   - etc.

2. **QR Code Generation**: 
   - Each table's QR code is **automatically generated** as a Base64 image when the table is created via the API.
   - The QR encodes: `{{FRONTEND_URL}}/order?tableId=<ID>&restaurantId=<ID>`
   - Staff can retrieve this image from the dashboard and print it for the physical table.

3. **Customer Scan**: `tableId` extracted from URL query parameter

**Validation:**
The backend performs strict validation on `tableId` format and existence before allowing any order placement or status retrieval.


### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Customer Flow                            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    1. Scan QR Code at Table
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React/Vue/HTML)                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Extract tableId from URL                                 │ │
│  │ • Fetch menu items (GET /api/menu?restaurantId=X)         │ │
│  │ • Display menu with categories                            │ │
│  │ • Build order cart (client-side state)                    │ │
│  │ • Submit order (POST /api/order)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    2. POST /api/order
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Node.js/Express)                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Validation Layer:                                          │ │
│  │ • Validate tableId exists                                  │ │
│  │ • Validate items array (not empty, valid productIds)      │ │
│  │ • Rate limit check (IP + tableId)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Business Logic:                                            │ │
│  │ • Fetch current prices from MenuItem collection           │ │
│  │ • Calculate totals server-side (subtotal, tax, total)     │ │
│  │ • Create Order document with status=PENDING               │ │
│  │ • Save to MongoDB                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    3. Order Saved
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database (MongoDB)                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Orders Collection:                                         │ │
│  │ • tableId: ObjectId (indexed)                             │ │
│  │ • items: Array of order items                             │ │
│  │ • status: PENDING → CONFIRMED → IN_PROGRESS → SERVED      │ │
│  │ • totals: { subtotal, tax, total }                        │ │
│  │ • timestamps: createdAt, updatedAt                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    4. Kitchen/Staff Updates
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Staff Dashboard (Separate Module)                              │
│  • View incoming orders (status=PENDING)                        │
│  • Confirm orders (status=CONFIRMED)                            │
│  • Mark in progress (status=IN_PROGRESS)                        │
│  • Mark served (status=SERVED)                                  │
│  • Auto-refresh every 40 seconds                                │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. **Customer → Frontend**: Scan QR → View menu
2. **Frontend → Backend**: Submit order with tableId + items
3. **Backend → Database**: Validate → Calculate → Save order
4. **Database → Staff Dashboard**: Auto-refresh displays new orders
5. **Staff Dashboard → Database**: Update order status
6. **Database → Customer Frontend**: Auto-reload fetches updated status (40s interval)

**Key Components:**
- **QR Code**: Static link with embedded tableId
- **Public API**: No authentication required for order placement
- **Validation Layer**: Prevents abuse and ensures data integrity
- **Price Calculation**: Server-side to prevent tampering
- **Status Workflow**: PENDING → CONFIRMED → IN_PROGRESS → SERVED
- **Auto-Reload**: Customer UI refreshes every 40 seconds to fetch order status updates

---

## 2. Database Structure

The system uses MongoDB to store orders and tables. Orders are linked to restaurants and tables via their respective IDs. Each order captures a snapshot of the menu items (name, price) at the time of purchase to ensure historical accuracy even if menu prices change later.

### Order Fields
- `tableId`: Reference to the physical table
- `restaurantId`: Reference to the restaurant
- `items`: List of ordered products (captured with snapshot prices)
- `status`: Current lifecycle state
- `totals`: Calculated subtotal, tax, and total
- `auditTrail`: History of status changes and edits


### Items Array Structure

Each item in the `items` array represents one line item in the order:

```javascript
{
  productId: ObjectId("507f1f77bcf86cd799439011"), // Reference to MenuItem
  name: "Margherita Pizza",                         // Snapshot at order time
  unitPrice: 12.99,                                 // Price at order time
  quantity: 2,                                      // Number of items
  modifiers: [                                      // Optional add-ons
    { name: "Extra Cheese", price: 2.00 },
    { name: "Gluten-free Crust", price: 3.50 }
  ],
  lineTotal: 36.98  // (12.99 + 2.00 + 3.50) * 2 = 36.98
}
```

**Why snapshot fields?**
- Menu prices may change over time
- Order should reflect the price at the time of ordering
- Prevents discrepancies in historical order data

### Status Enum Values

| Status | Description | Default | Next Status |
|--------|-------------|---------|-------------|
| `PENDING` | Order submitted, awaiting kitchen confirmation | ✅ Yes | CONFIRMED or CANCELLED |
| `CONFIRMED` | Kitchen acknowledged order | | IN_PROGRESS |
| `IN_PROGRESS` | Order is being prepared | | SERVED |
| `SERVED` | Order delivered to customer (final state) | | N/A |
| `CANCELLED` | Order cancelled by staff or system (final state) | | N/A |

**Status Workflow:**
```
PENDING → CONFIRMED → IN_PROGRESS → SERVED
   ↓
CANCELLED (can be cancelled from PENDING or CONFIRMED)
```

### Example Order Document

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "tableId": "507f1f77bcf86cd799439011",
  "restaurantId": "507f1f77bcf86cd799439000",
  "items": [
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e2",
      "name": "Margherita Pizza",
      "unitPrice": 12.99,
      "quantity": 2,
      "modifiers": [
        { "name": "Extra Cheese", "price": 2.00 }
      ],
      "lineTotal": 29.98
    },
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e3",
      "name": "Caesar Salad",
      "unitPrice": 8.50,
      "quantity": 1,
      "modifiers": [],
      "lineTotal": 8.50
    },
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e4",
      "name": "Coca-Cola",
      "unitPrice": 2.50,
      "quantity": 2,
      "modifiers": [],
      "lineTotal": 5.00
    }
  ],
  "status": "PENDING",
  "subtotal": 43.48,
  "tax": 3.48,
  "total": 46.96,
  "notes": "Please make the pizza extra crispy",
  "clientOrderId": "mobile-1705420800000-abc123",
  "customerIP": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)...",
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": "2026-01-16T13:30:00.000Z",
      "updatedBy": "Customer",
      "reason": "Order placed"
    }
  ],
  "createdAt": "2026-01-16T13:30:00.000Z",
  "updatedAt": "2026-01-16T13:30:00.000Z"
}
```

### Table Configuration
Tables are created by the restaurant and assigned a unique number. Each table generates a unique QR code that links directly to the ordering module for that table.




---

## 3. Backend API Documentation

### A) POST /api/order

**Description:**  
Creates a new customer order from a QR code scan. This is a **public endpoint** (no authentication required).

**Endpoint:**
```
POST /api/order
```

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tableId` | String (ObjectId) | ✅ Yes | Unique identifier for the table |
| `restaurantId` | String (ObjectId) | ✅ Yes | Unique identifier for the restaurant |
| `items` | Array | ✅ Yes | Array of order items (min 1 item) |
| `items[].productId` | String (ObjectId) | ✅ Yes | Reference to MenuItem |
| `items[].quantity` | Number | ✅ Yes | Quantity ordered (min 1) |
| `items[].modifiers` | Array | ❌ No | Optional add-ons/customizations |
| `notes` | String | ❌ No | Special instructions (max 500 chars) |
| `clientOrderId` | String | ❌ No | Idempotency key (recommended) |

**Example Request:**
```json
{
  "tableId": "507f1f77bcf86cd799439011",
  "restaurantId": "507f1f77bcf86cd799439000",
  "items": [
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e2",
      "quantity": 2,
      "modifiers": [
        { "name": "Extra Cheese", "price": 2.00 }
      ]
    },
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e3",
      "quantity": 1,
      "modifiers": []
    }
  ],
  "notes": "Please make the pizza extra crispy",
  "clientOrderId": "mobile-1705420800000-abc123"
}
```

### Validation Rules
The system validates:
- **Table Existence**: Ensuring the table belongs to the restaurant and is active.
- **Item Availability**: Verifying that all products are currently available on the menu.
- **Quantities**: Ensuring positive integer quantities.
- **Totals**: Recalculating all prices server-side to prevent tampering.


### Order Processing Rules
1. **Status**: New orders are automatically set to `PENDING`.
2. **Server-Side Pricing**: Prices are fetched directly from the database to ensure accuracy and security.
3. **Idempotency**: Using `clientOrderId` prevents duplicate orders if the customer submits the form multiple times.


**Success Response (201 Created):**
```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "tableId": "507f1f77bcf86cd799439011",
  "status": "PENDING",
  "items": [
    {
      "productId": "65a1b2c3d4e5f6a7b8c9d0e2",
      "name": "Margherita Pizza",
      "unitPrice": 12.99,
      "quantity": 2,
      "modifiers": [
        { "name": "Extra Cheese", "price": 2.00 }
      ],
      "lineTotal": 29.98
    }
  ],
  "subtotal": 29.98,
  "tax": 2.40,
  "total": 32.38,
  "notes": "Please make the pizza extra crispy",
  "createdAt": "2026-01-16T13:30:00.000Z"
}
```

### Error Cases

Errors return a JSON object with an `error` field.

**1. Empty Order (400 Bad Request):**
```json
{
  "error": "Order must contain at least one item"
}
```

**2. Invalid Table ID (404 Not Found):**
```json
{
  "error": "Table not found"
}
```

**3. Invalid Item Payload (400 Bad Request):**
```json
{
  "error": "Quantity must be at least 1"
}
```

**4. Product Not Available (400 Bad Request):**
```json
{
  "error": "Menu item Margherita Pizza is currently unavailable"
}
```

**5. Duplicate Order (409 Conflict):**
```json
{
  "success": false,
  "error": "Order with this clientOrderId already exists",
  "field": "clientOrderId"
}
```

**6. Rate Limit Exceeded (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Too many orders. Please try again in 10 minutes.",
  "retryAfter": 600
}
```

**7. Server Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "An unexpected error occurred. Please try again later.",
  "errorId": "err_65a1b2c3d4e5f6a7"
}
```

### Suggested HTTP Status Codes

| Status Code | Use Case |
|-------------|----------|
| `201 Created` | Order successfully created |
| `400 Bad Request` | Validation error (invalid input) |
| `404 Not Found` | Table or product not found |
| `409 Conflict` | Duplicate order (clientOrderId exists) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

---

### B) GET /api/order/:tableId

**Description:**  
Fetches recent or active orders for a specific table. Useful for customers to view their order history or track current order status.

**Endpoint:**
```
GET /api/order/:tableId
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tableId` | String (ObjectId) | ✅ Yes | Unique identifier for the table |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | String | ❌ No | All statuses | Filter by order status (PENDING, CONFIRMED, etc.) |
| `startDate` | ISO 8601 Date | ❌ No | 24 hours ago | Start of time range |
| `endDate` | ISO 8601 Date | ❌ No | Now | End of time range |
| `limit` | Number | ❌ No | 10 | Maximum number of orders to return (max 50) |

**Example Requests:**

```bash
# Get all recent orders for table
GET /api/order/507f1f77bcf86cd799439011

# Get only pending orders
GET /api/order/507f1f77bcf86cd799439011?status=PENDING

# Get orders from last 2 hours
GET /api/order/507f1f77bcf86cd799439011?startDate=2026-01-16T11:30:00Z

# Get last 5 orders
GET /api/order/507f1f77bcf86cd799439011?limit=5
```

### Response Examples

**Success Response (200 OK):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "status": "IN_PROGRESS",
    "items": [
      {
        "name": "Margherita Pizza",
        "quantity": 2,
        "lineTotal": 29.98
      }
    ],
    "total": 32.38,
    "notes": "Please make the pizza extra crispy",
    "createdAt": "2026-01-16T13:30:00.000Z",
    "updatedAt": "2026-01-16T13:35:00.000Z"
  }
]
```

**No Orders Found (200 OK):**
```json
[]
```

### Error Cases

**Invalid Table ID (400 Bad Request):**
```json
{
  "error": "Invalid table ID format"
}
```

**Table Not Found (404 Not Found):**
```json
{
  "error": "Table not found"
}
```

---

### C) PATCH /api/order/:orderId/cancel

**Description:**  
Allows a customer to cancel their own order.  
**Rule:** Only permitted if status is `PENDING` and order was created `< 2 minutes` ago.

**Endpoint:**
```
PATCH /api/order/:orderId/cancel
```

**Response (Success):**
Returns the updated order object with status `CANCELLED`.

**Error Example (Window Expired):**
```json
{
  "error": "Cancellation window (2 minutes) has expired. Please contact staff."
}
```

---

---

## 4. Table Management API (Authenticated)

These endpoints require authentication and specific roles (`OWNER` or `ADMIN` for mutation).

### A) GET /api/tables
**Description:** Get all tables for the restaurant.  
**Response:** `Array<Table>`

### B) POST /api/tables
**Description:** Create a new table.  
**Roles:** `OWNER`, `ADMIN`  
**Payload:** `{ tableNumber, capacity, status?, qrCode? }`

### C) PUT /api/tables/:id
**Description:** Update table details.  
**Roles:** `OWNER`, `ADMIN`

---

## 5. Staff Order Management (Authenticated)

### A) PATCH /api/order/staff/:orderId/status
**Description:** Update order status or cancel with reason.  
**Payload:** `{ status, reason? }`  
**Note:** `reason` is required if status is `CANCELLED`.

### B) PATCH /api/order/staff/:orderId/items
**Description:** Edit order items while in `PENDING` status.  
**Payload:** `{ items: [...], notes? }`  
**Audit:** Previous state is preserved in `editHistory`.

---

## 6. Audit Trail & History

The system maintains a full audit trail for all orders:
- **Status History**: Tracks every status change, who did it, and the reason.
- **Edit History**: Tracks any item changes made by staff, including before/after snapshots of items and totals.
- **Metadata**: Captures `customerIP` and `userAgent` for traceability of public orders.

---

## Auto-Reload Implementation

> [!NOTE]
> Instead of WebSocket for real-time updates, we use a simple auto-reload mechanism that refreshes the page every 40 seconds.

### Why Auto-Reload Instead of WebSocket?

**Advantages:**
- ✅ **Simpler implementation**: No WebSocket server setup required
- ✅ **Lower server load**: No persistent connections to maintain
- ✅ **Better compatibility**: Works on all browsers without special configuration
- ✅ **Easier debugging**: Standard HTTP requests are easier to monitor
- ✅ **No connection management**: No need to handle reconnections, timeouts, etc.

**Trade-offs:**
- ⚠️ Updates are not instant (up to 40-second delay)
- ⚠️ More database queries (but can be optimized with caching)

For a restaurant ordering system, a 40-second delay is acceptable since:
- Orders typically take 10-30 minutes to prepare
- Customers don't need instant status updates
- Reduces technical complexity significantly

### Polling Interval
The frontend should poll the `GET /api/order/:tableId` endpoint every **40 seconds** to retrieve status updates. This frequency balances real-time responsiveness with server load.


### Performance Optimization
The system uses caching and optimized queries (e.g., `.lean()`) to handle frequent polling requests efficiently. Caching headers are set to 30 seconds to ensure clients receive fresh data without overloading the database.




### Performance Considerations

**Expected Load:**
- 100 tables × 1 request/40s = 2.5 requests/second
- Very manageable for most servers
- With caching: Most requests served from cache (minimal DB load)

**Scaling Tips:**
- Use database indexes (already covered in schema section)
- Implement Redis caching for high-traffic restaurants
- Use CDN for static assets
- Consider read replicas for database if needed

---

## Idempotency Suggestion

### Problem
Network issues can cause duplicate order submissions:
- Customer clicks "Place Order"
- Request times out
- Customer clicks again
- Two identical orders created ❌

### Solution: Client Order ID
Customers should generate a unique ID (UUID or timestamp-based) for each order submission attempt. If the server receives a request with an existing `clientOrderId`, it returns the existing order instead of creating a duplicate.


**Benefits:**
- ✅ Prevents duplicate orders
- ✅ Safe to retry failed requests
- ✅ Better user experience (no accidental double charges)

---

## Implementation Checklist

- [x] Create `Order` model with schema validation
- [x] Create `Table` model
- [x] Implement `POST /api/order` endpoint
  - [x] Table validation
  - [x] Items validation
  - [x] Server-side price calculation
  - [x] Idempotency check
  - [ ] Rate limiting (Skipped for now)
- [x] Implement `GET /api/order/:tableId` endpoint
  - [x] Pagination support (via limit/sort)
- [x] Implement Table CRUD operations
- [x] Implement Staff Order Management (Status updates, Item edits)
- [x] Add database indexes
- [x] Add audit trail (statusHistory, editHistory)
- [x] Configure routing in `app.js`

---

## Next Steps

1. **Frontend Integration**:
   - Implement QR code extraction logic.
   - Set up auto-reload (40s) for order status.
   - Build customer ordering UI.

2. **Staff Dashboard Enhancement**:
   - Build UI for status updates and item editing.
   - Display audit trails to staff.

3. **Security Fine-tuning**:
   - Re-evaluate rate limiting needs.
   - Implement table-specific tokens if higher security is needed.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-16  
**Author:** Restaurant Management System Team
