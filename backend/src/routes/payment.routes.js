import express from "express";
import {
  connectStripe,
  getConnectStatus,
  createPaymentIntent,
  stripeWebhook,
} from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import { ROLE_OWNER } from "../constants/roles.js";

const router = express.Router();

// Owner: initiate Stripe Connect onboarding
router.post("/connect", auth, roleBasedAuth([ROLE_OWNER]), connectStripe);

// Owner/Staff: get current Stripe Connect status
router.get("/connect/status", auth, getConnectStatus);

// Public: create a PaymentIntent for a customer order
router.post("/create-payment-intent", createPaymentIntent);

// Stripe webhook — raw body is handled in app.js before this route
router.post("/webhook", stripeWebhook);

export default router;
