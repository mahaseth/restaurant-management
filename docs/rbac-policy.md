# Role-Based Access Control (RBAC) Policy

This document defines the permissions for each user role within the Restaurant Management System.

## Permission Matrix

| Feature | OWNER / ADMIN | MANAGER | CASHIER | WAITER | KITCHEN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Staff** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Menu** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Tables** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Orders** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Update Order Status** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Order Items** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Create Bills** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Pay Bills** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Print Bills** | ✅ | ✅ | ✅ | ✅ | ❌ |

## Role Definitions

- **OWNER / ADMIN**: Full access to all system features including restaurant configuration and staff management.
- **MANAGER**: Full operational access within a specific restaurant, including menu and staff management.
- **CASHIER**: Responsible for billing and payment processing. Can also manage orders.
- **WAITER**: Responsible for taking orders and printing bills for customers.
- **KITCHEN**: Responsible for fulfilling orders. Can update order status (e.g., from PENDING to READY).
- **CUSTOMER**: Can view their own orders and cancel them if they are still pending and within the allowed time window.
