import express from 'express';
import { generateBill } from '../controllers/bill.controller.js';
const router = express.Router();

// POST /api/bill/generate
router.post('/generate', generateBill);

export default router; 