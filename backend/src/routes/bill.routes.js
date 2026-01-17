import express from 'express';
import { getBillPreview, createBill, payBill, printBill } from '../controllers/bill.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// All bill routes require authentication
router.use(auth);

// GET /api/bill/preview/:tableId
router.get('/preview/:tableId', getBillPreview);

// POST /api/bill
router.post('/', createBill);

// PATCH /api/bill/:id/pay
router.patch('/:id/pay', payBill);

// GET /api/bill/:id/print
router.get('/:id/print', printBill);

export default router;