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
    "qrCode": "..."
  }
]
```

### 2. Create Table
**Endpoint:** `POST /`
**Description:** Creates a new table.
**Roles:** `OWNER`, `ADMIN`

**Request Payload:**
```json
{
  "tableNumber": 3,
  "capacity": 2,
  "status": "ACTIVE"
}
```

**Response (201 Created):**
```json
{
  "_id": "696a4c86867617de9b178156",
  "tableNumber": 3,
  "capacity": 2,
  "status": "ACTIVE",
  "restaurantId": "695d3a82901b14accff0bcde",
  "createdAt": "..."
}
```

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
