import Stripe from "stripe";
import config from "../config/config.js";
import StripeAccount from "../models/StripeAccount.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import { validateAndCalculateOrder } from "../utils/orderUtils.js";

function getStripe() {
  if (!config.stripe.secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(config.stripe.secretKey, { apiVersion: "2024-11-20.acacia" });
}

/**
 * POST /api/payments/connect
 * Auth: OWNER only
 * Creates (or re-uses) a Stripe Express account and returns the onboarding URL.
 */
export const connectStripe = async (req, res) => {
  try {
    const stripe = getStripe();
    const restaurantId = req.restaurant?._id || req.restaurant?.id;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant not found in token." });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    // Re-use existing Stripe account if already created
    let stripeAccDoc = await StripeAccount.findOne({ restaurantId });

    let stripeAccountId;
    if (stripeAccDoc) {
      stripeAccountId = stripeAccDoc.stripeAccountId;
    } else {
      // Create a new Express connected account
      const account = await stripe.accounts.create({
        type: "express",
        email: req.user?.email || undefined,
        metadata: { restaurantId: String(restaurantId) },
      });
      stripeAccountId = account.id;
      stripeAccDoc = await StripeAccount.create({
        restaurantId,
        stripeAccountId,
      });
    }

    // Always generate a fresh onboarding link (they expire)
    const returnUrl = `${config.clientUrl}/settings?stripe=success`;
    const refreshUrl = `${config.clientUrl}/settings?stripe=refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("connectStripe error:", err);
    res.status(500).json({ error: err.message || "Failed to start Stripe Connect." });
  }
};

/**
 * GET /api/payments/connect/status
 * Auth: required
 * Returns current Stripe Connect status for the restaurant.
 */
export const getConnectStatus = async (req, res) => {
  try {
    const stripe = getStripe();
    const restaurantId = req.restaurant?._id || req.restaurant?.id;

    const stripeAccDoc = await StripeAccount.findOne({ restaurantId }).lean();
    if (!stripeAccDoc) {
      return res.json({ connected: false });
    }

    // Refresh live status from Stripe
    const account = await stripe.accounts.retrieve(stripeAccDoc.stripeAccountId);

    // Update cached values
    await StripeAccount.findOneAndUpdate(
      { restaurantId },
      {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: account.charges_enabled,
      }
    );

    res.json({
      connected: true,
      stripeAccountId: stripeAccDoc.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingComplete: account.charges_enabled,
    });
  } catch (err) {
    console.error("getConnectStatus error:", err);
    // If the account was deleted on Stripe side, treat as not connected
    if (err?.type === "StripeInvalidRequestError") {
      return res.json({ connected: false });
    }
    res.status(500).json({ error: err.message || "Failed to fetch Stripe status." });
  }
};

/**
 * POST /api/payments/create-payment-intent
 * Public — called by customer before placing an order.
 * Body: { restaurantId, tableId, items, notes, customerEmail }
 * Returns: { clientSecret, paymentIntentId, amount, currency }
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    const { restaurantId, tableId, items, customerEmail } = req.body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "restaurantId and items are required." });
    }

    // Verify restaurant has a connected Stripe account with charges enabled
    const stripeAccDoc = await StripeAccount.findOne({ restaurantId }).lean();
    if (!stripeAccDoc || !stripeAccDoc.chargesEnabled) {
      return res.status(400).json({
        error: "This restaurant has not set up online payments yet. Please pay at the counter.",
      });
    }

    // Validate items and calculate total server-side (authoritative)
    const itemsWithRestaurant = items.map((it) => ({ ...it, restaurantId }));
    const { total } = await validateAndCalculateOrder(itemsWithRestaurant);

    // Stripe amounts are in smallest currency unit (cents for USD)
    const amountInCents = Math.round(total * 100);

    if (amountInCents < 50) {
      return res.status(400).json({ error: "Order total is too small to process." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      // Route payment to the restaurant's Stripe account
      transfer_data: {
        destination: stripeAccDoc.stripeAccountId,
      },
      receipt_email: customerEmail || undefined,
      metadata: {
        restaurantId: String(restaurantId),
        tableId: String(tableId || ""),
        customerEmail: customerEmail || "",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      currency: "usd",
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    res.status(500).json({ error: err.message || "Failed to create payment intent." });
  }
};

/**
 * POST /api/payments/webhook
 * Public, raw body — Stripe webhook handler.
 * Updates order paymentStatus when payment_intent.succeeded fires.
 */
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];

  if (!config.stripe.webhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification.");
    return res.sendStatus(200);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    try {
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: pi.id, paymentStatus: "PENDING" },
        { paymentStatus: "PAID", paidAt: new Date() }
      );
    } catch (err) {
      console.error("Webhook order update error:", err);
    }
  }

  res.sendStatus(200);
};
