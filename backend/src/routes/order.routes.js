import express from 'express';
import { 
  createOrder, 
  getOrdersByTable, 
  cancelOrderCustomer,
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

// Get recent orders for a table
router.get('/:tableId', getOrdersByTable);

// Cancel order (Customer rules applied in controller)
router.patch('/:orderId/cancel', cancelOrderCustomer);


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

// Update order status (All Staff)
router.patch('/staff/:orderId/status', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]), updateOrderStatus);

// Edit order items (All Staff except Kitchen - as they just read the items)
router.patch('/staff/:orderId/items', auth, roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER]), editOrderItems);

export default router;
