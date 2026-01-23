# Restaurant Management API

Base URL: `{{baseURL}}/api/restaurant`
*Requires Authentication*

### 1. Get Restaurant Settings
**Endpoint:** `GET /`
**Description:** Returns details of the restaurant associated with the authenticated user.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Response (200 OK):**
```json
{
  "_id": "695d3a82901b14accff0bcde",
  "name": "Restaurant Name",
  "address": {
    "city": "Kathmandu",
    "province": "Bagmati",
    "street": "New Road",
    "country": "Nepal"
  },
  "subscriptionPlan": "ACTIVE",
  "panNumber": "123456789",
  "registrationNumber": "REG-001",
  "createdAt": "2026-01-17T07:25:22.000Z"
}
```

### 2. Update Restaurant Settings
**Endpoint:** `PATCH /`
**Description:** Updates restaurant details like PAN number or registration number.
**Roles:** `ADMIN`, `OWNER`, `MANAGER`

**Request Payload:**
```json
{
  "panNumber": "987654321",
  "registrationNumber": "REG-002"
}
```

**Response (200 OK):**
Updated restaurant object.
