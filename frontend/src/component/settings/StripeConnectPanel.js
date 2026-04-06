"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { getStripeConnectStatus, startStripeConnect } from "@/api/payment";

const StatusBadge = ({ enabled, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
      ${enabled
        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/30"
        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
      }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-gray-400"}`} />
    {label}
  </span>
);

const StripeConnectPanel = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await getStripeConnectStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch Stripe status:", err);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle return from Stripe onboarding
  useEffect(() => {
    const stripeParam = searchParams?.get("stripe");
    if (stripeParam === "success") {
      toast.success("Stripe account connected! It may take a moment to activate.");
      fetchStatus();
    } else if (stripeParam === "refresh") {
      toast.info("Your Stripe session expired. Please reconnect.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await startStripeConnect();
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to start Stripe Connect.");
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20 ring-2 ring-violet-500/10 shrink-0">
          <i className="pi pi-credit-card text-white text-base" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
            Payment Settings
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Connect your Stripe account to accept online payments from customers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-4">
          <i className="pi pi-spin pi-spinner text-gray-400 text-lg" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Checking Stripe status…</span>
        </div>
      ) : status?.connected ? (
        <div className="flex flex-col gap-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-700/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <i className="pi pi-check-circle text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Stripe Account Connected</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5 font-mono truncate">
                {status.stripeAccountId}
              </p>
            </div>
          </div>

          {/* Capability badges */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge enabled={status.chargesEnabled} label="Charges Enabled" />
            <StatusBadge enabled={status.payoutsEnabled} label="Payouts Enabled" />
            <StatusBadge enabled={status.detailsSubmitted} label="Details Submitted" />
          </div>

          {/* If onboarding not fully complete */}
          {!status.chargesEnabled && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/20 text-sm text-amber-800 dark:text-amber-300">
              <i className="pi pi-exclamation-triangle mr-2" />
              Your Stripe account is not yet fully active. Please complete onboarding to accept payments.
            </div>
          )}

          {/* Re-onboard or complete setup */}
          <div>
            <Button
              label={status.chargesEnabled ? "Manage Stripe Account" : "Complete Stripe Setup"}
              icon="pi pi-external-link"
              severity={status.chargesEnabled ? "secondary" : "warning"}
              outlined
              loading={connecting}
              onClick={handleConnect}
              className="text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Connect a Stripe account so customers can pay directly from their phone after scanning your table QR code.
            Payments go straight to your Stripe account — no manual payout needed.
          </p>

          <ul className="text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-1.5 list-none">
            {["Accept Apple Pay, Google Pay, and card payments", "Funds deposited directly to your bank", "Secure — powered by Stripe"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <i className="pi pi-check text-emerald-500 text-xs" />
                {item}
              </li>
            ))}
          </ul>

          <div>
            <Button
              label={connecting ? "Redirecting to Stripe…" : "Connect with Stripe"}
              icon="pi pi-external-link"
              loading={connecting}
              onClick={handleConnect}
              raised
            />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            You will be redirected to Stripe to set up your account. This is a one-time process.
          </p>
        </div>
      )}
    </div>
  );
};

export default StripeConnectPanel;
