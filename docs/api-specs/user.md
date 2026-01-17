# User Management API

Base URL: `{{baseURL}}/api/users`
*Requires Authentication*

### 1. New Staff Registration
**Endpoint:** `POST /`
**Description:** Creates a new staff user for the restaurant.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Request Payload:**
```json
{
  "name": "Staff Name",
  "email": "staff@example.com",
  "password": "securepassword",
  "phone": "98XXXXXXXX",
  "roles": ["WAITER"]
}
```

**Response (201 Created):**
```json
{
  "_id": "695d3a82901b14accff0bce1",
  "restaurantId": "695d3a82901b14accff0bcde",
  "name": "Staff Name",
  "email": "staff@example.com",
  "phone": "98XXXXXXXX",
  "roles": ["WAITER"],
  "isActive": true
}
```

### 2. Get All Users
**Endpoint:** `GET /`
**Description:** Returns a list of all users associated with the restaurant.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Response (200 OK):**
```json
[
  {
    "_id": "695d3a82901b14accff0bce0",
    "name": "Yogesh Mahaseth",
    "email": "yogeshmahaseth07@gmail.com",
    "phone": "9812345679",
    "isActive": true,
    "roles": ["OWNER"]
  }
]
```

### 3. Update User
**Endpoint:** `PATCH /:id`
**Description:** Updates details of a staff member.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Request Payload:**
```json
{
  "name": "Updated Name",
  "roles": ["CASHIER"]
}
```

**Response (200 OK):**
Updated user object.

### 4. Delete User
**Endpoint:** `DELETE /:id`
**Description:** Deletes a staff member from the restaurant.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Response (200 OK):**
```json
{
  "message": "User deleted successfully."
}
```

### 5. Change Password (Self)
**Endpoint:** `POST /change-password`
**Description:** Allows the authenticated user to change their own password.
**Roles:** Any Authenticated User

**Request Payload:**
```json
{
  "oldPassword": "currentpassword",
  "newPassword": "newsecurepassword"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully."
}
```

### 6. Upload Profile Image
**Endpoint:** `PATCH /profile-image`
**Description:** Uploads or updates the profile image for the authenticated user.

**Request Payload:**
- **Mode:** `form-data`
- **Key:** `image` (File)

**Response (201 Created):**
```json
{
  "message": "Profile image updated successfully.",
  "imageUrl": "https://cloudinary.com/..."
}
```
