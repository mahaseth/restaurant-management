# Bill Management Module Documentation

## 1. Module Overview

The Bill Management Module handles the transition from active customer orders to final payment and record-keeping. It allows staff to aggregate multiple orders from a single table into a single unified bill, process payments, and generate PDF receipts.

### Core Workflow
1.  **Preview**: Staff views all unbilled `SERVED` orders for a specific table.
2.  **Creation**: Staff generates a `Bill` document, which links all selected orders.
3.  **Payment**: Staff records the payment (Cash, Card, etc.).
4.  **Settlement**: Once paid, linked orders are automatically marked as `BILLED`, locking them from further modifications.
5.  **Receipt**: A PDF receipt is generated for physical printing.

---

## 2. Database Structure

The module introduces the `Bill` entity and updates the `Order` lifecycle.

### Bill Fields
- `billNumber`: Unique identifier for the transaction (e.g., `BILL-1705420800000-1`).
- `tableId`: The physical table being billed.
- `orderIds`: List of all `Order` documents included in this bill.
- `items`: Aggregated list of items (name, total quantity, unit price) from all included orders.
- `subtotal`: Sum of all items before tax and discounts.
- `tax`: Calculated tax amount (typically 8%).
- `discount`: Optional discount amount applied by staff.
- `total`: Final payable amount.
- `status`: `UNPAID` (initial) or `PAID` (locked).
- `paymentMethod`: `CASH`, `CARD`, `ONLINE`, or `OTHER`.

### Order Lifecycle Update
- **New Status**: `BILLED`. 
- **Constraint**: Orders in `BILLED` status are locked and cannot be edited or cancelled.
- **Reference**: Each order now holds a `billId` once it has been included in a bill.

---

## 3. Backend API Documentation

All endpoints require authentication and are intended for staff use.

### A) GET /api/bill/preview/:tableId
**Description:** Fetches all `SERVED` orders for a table that haven't been billed yet. Useful for providing a "check" to the customer before finalizing.

**Response:**
```json
{
  "tableId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "orderIds": ["65a1b2c3d4e5f6a7b8c9d0e2", "65a1b2c3d4e5f6a7b8c9d0e3"],
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "unitPrice": 12.99,
      "lineTotal": 25.98
    },
    {
      "name": "Coca-Cola",
      "quantity": 3,
      "unitPrice": 2.50,
      "lineTotal": 7.50
    }
  ],
  "subtotal": 33.48,
  "tax": 2.68,
  "total": 36.16
}
```

### B) POST /api/bill
**Description:** Generates a new bill for the selected orders.

**Request Payload:**
```json
{
  "tableId": "65a1b2c3d4e5f6a7b8c9d0e1",
  "orderIds": ["65a1b2c3d4e5f6a7b8c9d0e2", "65a1b2c3d4e5f6a7b8c9d0e3"],
  "discount": 5.00
}
```

**Response:**
Returns the complete `Bill` object with a status of `UNPAID`.

### C) PATCH /api/bill/:id/pay
**Description:** Records payment and settles the transaction.

**Request Payload:**
```json
{
  "paymentMethod": "CARD"
}
```

**Note:** This action updates all linked orders to the `BILLED` status.

### D) GET /api/bill/:id/print
**Description:** Generates and streams a PDF receipt.

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename=bill-BILL-XXXX.pdf`

---

## 4. Billing Rules

1.  **Eligibility**: Only orders with the status `SERVED` can be included in a bill.
2.  **Exclusivity**: An order can only be linked to **one** bill.
3.  **Immutability**: Once an order is `BILLED`, it cannot be edited by staff or cancelled.
4.  **Pre-Calculation**: All totals are recalculated during bill creation to ensure data integrity between orders and the final invoice.
