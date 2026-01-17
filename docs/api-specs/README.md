# Restaurant Management API Specifications

Detailed documentation for each API module.

## Modules

- [Authentication API](auth.md) - Login, Registration, Password Reset.
- [User Management API](user.md) - User listing and profile management.
- [Table Management API](table.md) - Table creation, updates, and QR code mapping.
- [Menu Management API](menu.md) - Menu items CRUD.
- [Order Management API](order.md) - Customer ordering and staff management.
- [Bill Management API](bill.md) - Billing, Payments, and PDF Receipts.

---

## Global Information

### Base URL
- Development: `http://localhost:5000` (or as configured in `.env`)
- Production: `https://your-api-domain.com`

### Authentication
Most private endpoints require a valid `authToken` cookie, which is set upon successful login.

### Headers
- `Content-Type: application/json` (for POST/PUT/PATCH/DELETE requests)
- `Accept: application/json`

### Standard Response Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation error or invalid logic.
- `401 Unauthorized`: Authentication required or invalid.
- `403 Forbidden`: Insufficient permissions (Role-based).
- `404 Not Found`: Resource not found.
- `500 Internal Server Error`: Unexpected server error.
