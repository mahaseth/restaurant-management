import express from "express";
import auth from "../middlewares/auth.js";
import {
  initiateEsewaQR,
  verifyEsewaPayment
} from "../controllers/esewa.controller.js";
import {
  initiateKhaltiQR,
  verifyKhaltiPayment
} from "../controllers/khalti.controller.js";

const router = express.Router();

router.post("/esewa/:billId", auth, initiateEsewaQR);
router.post("/esewa/verify", verifyEsewaPayment);

router.post("/khalti/:billId", auth, initiateKhaltiQR);
router.post("/khalti/verify", verifyKhaltiPayment);

export default router;
