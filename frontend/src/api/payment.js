// API helpers for Stripe payment flows.

import api from "@/api";

/**
 * Create a PaymentIntent for a customer order.
 * Called before the order is submitted — customer pays first.
 */
export async function createPaymentIntent({ restaurantId, tableId, items, customerEmail }) {
  const response = await api.post("/api/payments/create-payment-intent", {
    restaurantId,
    tableId,
    items,
    customerEmail,
  });
  return response.data; // { clientSecret, paymentIntentId, amount, currency }
}

/**
 * Get the Stripe Connect status for the current restaurant (owner/staff).
 */
export async function getStripeConnectStatus() {
  const response = await api.get("/api/payments/connect/status");
  return response.data;
}

/**
 * Start the Stripe Connect onboarding flow.
 * Returns the Stripe-hosted onboarding URL.
 */
export async function startStripeConnect() {
  const response = await api.post("/api/payments/connect");
  return response.data; // { url }
}
