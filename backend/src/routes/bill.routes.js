import express from "express";
import { createBill } from "../controllers/bill.controller.js";
import { generateBillPDFById } from "../controllers/billPdf.controller.js";
import { payBill } from "../controllers/payment.controller.js";
import { generateKitchenPDFById } from "../controllers/kitchenPdf.controller.js";

const router = express.Router();

router.post("/", createBill);
router.post("/:id/pay", payBill);
router.get("/:id/pdf", generateBillPDFById);
router.get("/:id/kitchen-pdf", generateKitchenPDFById)


export default router;
