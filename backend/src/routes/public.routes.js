import express from "express";
import { addItemsToPublicOrder, getPublicOrderByNumber, getPublicTableInfo } from "../controllers/public.controller.js";

const router = express.Router();

// Public read-only endpoints used by the QR customer experience.
router.get("/table/:tableId", getPublicTableInfo);
router.get("/order/:orderNumber", getPublicOrderByNumber);
router.patch("/order/:orderNumber/items", addItemsToPublicOrder);

export default router;

