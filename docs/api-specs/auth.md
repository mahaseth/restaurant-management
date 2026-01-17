# Authentication API

Base URL: `{{baseURL}}/api/auth`

### 1. Login User
**Endpoint:** `POST /login`
**Description:** Authenticates a user and returns restaurant and user details along with a JWT in a cookie.

**Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "restaurant": {
    "_id": "695d3a82901b14accff0bcde",
    "name": "Restaurant Name",
    "address": {
      "city": "Kathmandu",
      "province": "Bagmati",
      "street": "New Road",
      "country": "Nepal"
    },
    "subscriptionPlan": "ACTIVE"
  },
  "user": {
    "_id": "695d3a82901b14accff0bce0",
    "name": "Yogesh Mahaseth",
    "email": "yogeshmahaseth07@gmail.com",
    "phone": "9812345679",
    "isActive": true,
    "roles": ["OWNER"]
  }
}
```

### 2. Register Restaurant
**Endpoint:** `POST /register-restaurant`
**Description:** Registers a new restaurant and its owner.

**Request Payload:**
```json
{
  "restaurant": {
    "name": "New Cafe",
    "address": {
      "city": "Kathmandu",
      "province": "Bagmati",
      "street": "Thamel"
    }
  },
  "owner": {
    "name": "Owner Name",
    "email": "owner@example.com",
    "password": "securepassword",
    "phone": "98XXXXXXXX"
  }
}
```

**Response (200 OK):**
Same structure as Login response.

### 3. Forget Password
**Endpoint:** `POST /forget-password`
**Description:** Sends a password reset link to the user's email.

**Request Payload:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Reset password link sent successfully."
}
```

### 4. Reset Password
**Endpoint:** `POST /reset-password?userId={userId}&token={token}`
**Description:** Resets the user's password using a valid token.

**Query Parameters:**
- `userId`: The ID of the user.
- `token`: The reset token sent via email.

**Request Payload:**
```json
{
  "password": "newsecurepassword"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully."
}
```
