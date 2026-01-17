import express from "express";
import auth from "../middlewares/auth.js";
import { checkPaymentStatus } from "../controllers/paymentStatus.controller.js";

const router = express.Router();
router.get("/:billId", auth, checkPaymentStatus);
export default router;
