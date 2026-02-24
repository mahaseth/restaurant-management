import express from 'express';
import { 
  createOrder, 
  getOrdersByTable, 
  cancelOrderCustomer,
  getRecentOrdersStaff,
  getOrderByIdStaff,
  updateOrderStatus,
  editOrderItems
} from '../controllers/order.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

/**
 * PUBLIC Endpoints (Customer)
 */

// Create a new order
router.post('/', createOrder);

/**
 * PRIVATE Endpoints (Staff - Requires Auth)
 */

import { 
  ROLE_OWNER, 
  ROLE_ADMIN, 
  ROLE_MANAGER, 
  ROLE_CASHIER, 
  ROLE_WAITER,
  ROLE_KITCHEN
} from '../constants/roles.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';

// Get recent orders for restaurant (All Staff)
// GET /api/order/staff/recent?status=&limit=&tableId=
router.get(
  '/staff/recent',
  auth,
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]),
  getRecentOrdersStaff
);

// Get one order with details (All Staff)
router.get(
  '/staff/:orderId',
  auth,
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]),
  getOrderByIdStaff
);

// Update order status (All Staff)
router.patch('/staff/:orderId/status', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]), updateOrderStatus);

// Edit order items (All Staff except Kitchen - as they just read the items)
router.patch('/staff/:orderId/items', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER]), editOrderItems);

// Get recent orders for a table (Customer)
router.get('/:tableId', getOrdersByTable);

// Cancel order (Customer rules applied in controller)
router.patch('/:orderId/cancel', cancelOrderCustomer);

export default router;
