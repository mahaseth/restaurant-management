"use client";

/**
 * PaymentDialog
 * Opens as a full-screen overlay on mobile (or centred modal on desktop).
 * Wraps Stripe <Elements> + <PaymentElement> to handle:
 *   - Apple Pay / Google Pay (shown automatically on supported devices)
 *   - Card details entry
 *
 * Props:
 *   clientSecret  — Stripe PaymentIntent client secret
 *   amount        — display amount (number, dollars)
 *   cartLines     — [{ item: { name, price }, qty }]
 *   onSuccess(paymentIntentId) — called after successful payment
 *   onClose()     — called when user dismisses dialog
 */

import React, { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "primereact/button";

// Lazily initialise once — keeps the publishable key out of the render cycle.
let stripePromise = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.");
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

// ─── Inner form — must live inside <Elements> ──────────────────────────────
const CheckoutForm = ({ amount, cartLines, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const subtotal = cartLines.reduce(
    (sum, l) => sum + (Number(l.item.price) || 0) * l.qty,
    0
  );
  const tax = Math.round(subtotal * 0.08 * 100) / 100;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMsg("");
    setPaying(true);

    try {
      // Submit the form first (validates card fields, etc.)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMsg(submitError.message || "Please check your payment details.");
        setPaying(false);
        return;
      }

      // Confirm the payment — Stripe handles 3DS, redirects, etc.
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // No redirect for card — return_url is only used as fallback for redirect flows
          return_url: typeof window !== "undefined" ? window.location.href : "",
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMsg(error.message || "Payment failed. Please try again.");
        setPaying(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        setErrorMsg("Payment was not completed. Please try again.");
        setPaying(false);
      }
    } catch (err) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-5">
      {/* Order summary */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Order Summary
        </p>
        <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-1">
          {cartLines.map((line) => (
            <div key={line.item._id} className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 truncate mr-3">
                {line.qty}× {line.item.name}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                {formatMoney((Number(line.item.price) || 0) * line.qty)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Tax (8%)</span>
            <span>{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between text-gray-900 dark:text-white font-bold mt-1">
            <span>Total</span>
            <span>{formatMoney(amount)}</span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element — renders Apple Pay, Google Pay, card, etc. */}
      <div>
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }}
        />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/30 text-sm text-red-700 dark:text-red-300">
          <i className="pi pi-exclamation-circle mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          label={paying ? "Processing…" : `Pay ${formatMoney(amount)}`}
          icon={paying ? undefined : "pi pi-lock"}
          loading={paying}
          disabled={!stripe || !elements || paying}
          raised
          className="w-full"
        />
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          text
          className="w-full"
          onClick={onClose}
          disabled={paying}
        />
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        <i className="pi pi-lock mr-1" />
        Payments are secured and processed by Stripe.
      </p>
    </form>
  );
};

// ─── Outer component — provides the Stripe context ─────────────────────────
const PaymentDialog = ({ clientSecret, amount, cartLines, onSuccess, onClose }) => {
  if (!clientSecret) return null;

  const stripe = getStripePromise();
  if (!stripe) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
          <p className="text-red-600 text-sm font-semibold">
            Payment is not configured. Please contact the restaurant.
          </p>
          <Button label="Close" severity="secondary" outlined onClick={onClose} className="mt-4 w-full" />
        </div>
      </div>
    );
  }

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#2563eb",
      borderRadius: "12px",
      fontSizeBase: "14px",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl
                   border border-gray-200 dark:border-gray-800
                   max-h-[90dvh] overflow-auto"
      >
        {/* Dialog header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <i className="pi pi-credit-card text-white text-sm" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                Secure Checkout
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Complete your payment below</p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center transition"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="pi pi-times text-xs" />
          </button>
        </div>

        <div className="p-5">
          <Elements
            stripe={stripe}
            options={{
              clientSecret,
              appearance,
            }}
          >
            <CheckoutForm
              amount={amount}
              cartLines={cartLines}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;
