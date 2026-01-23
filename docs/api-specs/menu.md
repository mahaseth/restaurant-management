# Menu Management API

Base URL: `{{baseURL}}/api/menuitems`

### 1. Get All Menu Items
**Endpoint:** `GET /`
**Description:** Fetches all menu items. (Public)

**Response (200 OK):**
```json
[
  {
    "_id": "6964ee85532369e9d806f88e",
    "name": "Spicy Pasta",
    "description": "Tasty and spicy",
    "price": 200,
    "category": "main",
    "available": true
  }
]
```

### 2. Create Menu Item
**Endpoint:** `POST /`
**Description:** Creates a new menu item.
**Requires Authentication (ADMIN/OWNER)**

**Request Payload:**
```json
{
  "name": "Spicy Pasta",
  "description": "Its fill with maida and testy in nature",
  "price": 200,
  "category": "main"
}
```

**Response (201 Created):**
Created menu item object.

### 3. Get Menu Item by ID
**Endpoint:** `GET /:id`
**Description:** Fetches a single menu item by its ID.

**Response (200 OK):**
Menu item object.

### 4. Update Menu Item
**Endpoint:** `PUT /:id`
**Description:** Updates a menu item.
**Requires Authentication (ADMIN/OWNER)**

**Request Payload:**
```json
{
  "price": 450
}
```

**Response (200 OK):**
Updated menu item object.

### 5. Delete Menu Item
**Endpoint:** `DELETE /:id`
**Description:** Deletes a menu item.
**Requires Authentication (ADMIN/OWNER)**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```
