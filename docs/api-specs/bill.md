# Bill Management API

Base URL: `{{baseURL}}/api/bill`
*Requires Authentication*

### 1. Get Bill Preview
**Endpoint:** `GET /preview/:tableId`
**Description:** Fetches all `SERVED` orders for a table that haven't been billed yet.

**Response (200 OK):**
```json
{
  "tableId": "696a4c86867617de9b178156",
  "orderIds": ["696b1d12b4bca4a8ffbf01c7"],
  "items": [
    {
      "name": "Spicy Pasta",
      "quantity": 2,
      "unitPrice": 200,
      "lineTotal": 400
    }
  ],
  "subtotal": 400,
  "tax": 32,
  "total": 432
}
```

### 2. Create Bill
**Endpoint:** `POST /`
**Description:** Finalizes orders and creates a bill.

**Request Payload:**
```json
{
  "tableId": "696a4c86867617de9b178156",
  "orderIds": ["696b1d12b4bca4a8ffbf01c7"],
  "discount": 0
}
```

**Response (201 Created):**
Created bill object. Status is `UNPAID`.

### 3. Pay Bill
**Endpoint:** `PATCH /:id/pay`
**Description:** Marks a bill as paid.
**Identifier Support:** Supports both MongoDB `_id` and human-readable `billNumber` in the URL.

**Request Payload:**
```json
{
  "paymentMethod": "CASH"
}
```

**Response (200 OK):**
Updated bill object. Status is `PAID`. Associated orders are marked as `BILLED`.

### 4. Print Bill
**Endpoint:** `GET /:id/print`
**Description:** Generates and returns a PDF receipt.
**Identifier Support:** Supports both MongoDB `_id` and human-readable `billNumber` in the URL.

**Response (200 OK):**
Binary stream (PDF).
