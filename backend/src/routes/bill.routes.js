import express from 'express';
import { getBillPreview, createBill, payBill, printBill } from '../controllers/bill.controller.js';
import auth from '../middlewares/auth.js';
import { 
  ROLE_OWNER, 
  ROLE_ADMIN, 
  ROLE_MANAGER, 
  ROLE_CASHIER, 
  ROLE_WAITER 
} from '../constants/roles.js';
import roleBasedAuth from '../middlewares/roleBasedAuth.js';

const router = express.Router();

// All bill routes require authentication
router.use(auth);

// GET /api/bill/preview/:tableId - Any staff
router.get('/preview/:tableId', getBillPreview);

// POST /api/bill - Owner, Manager, Cashier
router.post('/', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]), createBill);

// PATCH /api/bill/:id/pay - Owner, Manager, Cashier
router.patch('/:id/pay', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]), payBill);

// GET /api/bill/:id/print - All staff except Kitchen (as per matrix)
router.get('/:id/print', roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER]), printBill);

export default router;