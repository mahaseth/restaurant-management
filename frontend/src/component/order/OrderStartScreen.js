"use client";

import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";

function isValidEmail(value) {
  const v = String(value || "").trim();
  // Simple check; backend does not rely on this for auth.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const OrderStartScreen = ({
  defaultEmail = "",
  onContinueNew,
  onContinueExisting,
}) => {
  const [email, setEmail] = useState(String(defaultEmail || ""));

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  return (
    <div className="max-w-xl mx-auto px-5 py-12">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-500/10">
            <i className="pi pi-shopping-cart text-white text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
              Order at your table
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Enter your email, then choose how to continue.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950
                       text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                       px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
          {!emailOk && email.trim() && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">Please enter a valid email.</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            We store this only for your order reference.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            label="New order"
            icon="pi pi-plus"
            raised
            disabled={!emailOk}
            onClick={() => onContinueNew?.(email.trim())}
          />
          <Button
            label="Existing order"
            icon="pi pi-search"
            outlined
            disabled={!emailOk}
            onClick={() => onContinueExisting?.(email.trim())}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderStartScreen;

