# User Management API

Base URL: `{{baseURL}}/api/users`
*Requires Authentication*

### 1. Get All Users
**Endpoint:** `GET /`
**Description:** Returns a list of all users associated with the restaurant.
**Roles:** `ADMIN`, `OWNER`

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

### 2. Upload Profile Image
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
