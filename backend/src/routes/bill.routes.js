//backend/src/routes/bill.routes.js
import express from "express";
import { createBill } from "../controllers/bill.controller.js";
import { generateBillPDFById } from "../controllers/billPdf.controller.js";
import { generateKitchenPDFById } from "../controllers/kitchenPdf.controller.js";


const router = express.Router();

router.post("/", createBill);
router.get("/:id/pdf", generateBillPDFById);
router.get("/:id/kitchen-pdf", generateKitchenPDFById)


export default router;
