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

// Update order status (Staff can cancel anytime with reason)
router.patch('/staff/:orderId/status', auth, updateOrderStatus);

// Edit order items (Staff only, while PENDING)
router.patch('/staff/:orderId/items', auth, editOrderItems);

export default router;
