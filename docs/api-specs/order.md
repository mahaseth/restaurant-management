# Order Management API

Base URL: `{{baseURL}}/api/order`

### 1. Create Order
**Endpoint:** `POST /`
**Description:** Creates a new order. (Public)

**Request Payload:**
```json
{
  "tableId": "696a4c86867617de9b178156",
  "restaurantId": "695d3a82901b14accff0bcde",
  "items": [
    {
      "productId": "6964efc422ffb8fe77edc7ea",
      "quantity": 2
    }
  ],
  "notes": "Add spicy"
}
```

**Response (201 Created):**
Created order object.

### 2. Get Orders by Table ID
**Endpoint:** `GET /:tableId`
**Description:** Fetches recent or active orders for a specific table. (Public)

**Query Parameters:**
- `status`: Filter by status (e.g., `SERVED`).
- `limit`: Number of results (default `10`).

**Response (200 OK):**
```json
[
  {
    "_id": "696a52d538ecf2e0f027dba6",
    "status": "SERVED",
    "items": [...],
    "total": 432
  }
]
```

### 3. Cancel Order (Customer)
**Endpoint:** `PATCH /:orderId/cancel`
**Description:** Cancels a pending order within 2 minutes of creation. (Public)

**Response (200 OK):**
Updated order object status: `CANCELLED`.

### 4. Update Order Status (Staff)
**Endpoint:** `PATCH /staff/:orderId/status`
**Description:** Updates the status of an order.
**Requires Authentication**

**Request Payload:**
```json
{
  "status": "SERVED",
  "reason": "Food is ready"
}
```

**Response (200 OK):**
Updated order object.

### 5. Edit Order Items (Staff)
**Endpoint:** `PATCH /staff/:orderId/items`
**Description:** Edits items of a pending order.
**Requires Authentication**

**Request Payload:**
```json
{
  "items": [
    { "productId": "...", "quantity": 1 }
  ],
  "notes": "Updated notes"
}
```

**Response (200 OK):**
Updated order object.
