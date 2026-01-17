//backend/src/routes/publicBillRoutes.js
import express from "express";
import { generateBillPDFById } from "../controllers/billPdf.controller.js";
import { generateKitchenPDFById } from "../controllers/kitchenPdf.controller.js";

const router = express.Router();

router.get("/bills/:id/pdf", generateBillPDFById);
router.get("/bills/:id/kitchen-pdf", generateKitchenPDFById);

export default router;