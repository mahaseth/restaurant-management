"use client";

import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";

const ExistingOrderLookup = ({
  tableId,
  restaurantId,
  onLookup,
  loading = false,
  initialOrderNumber = "",
}) => {
  const [orderNumber, setOrderNumber] = useState(String(initialOrderNumber || ""));

  const normalized = useMemo(() => String(orderNumber || "").trim().toUpperCase(), [orderNumber]);

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <p className="text-lg font-extrabold text-gray-900 dark:text-white">Find your order</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Enter the order number you received (example: <span className="font-mono">RS-7K4P9D2A</span>)
        </p>

        <div className="mt-6">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Order number</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="RS-________"
            className="w-full mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950
                       text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                       px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                       font-mono"
          />
        </div>

        <div className="mt-6">
          <Button
            label={loading ? "Searching..." : "View order"}
            icon="pi pi-search"
            loading={loading}
            disabled={!normalized || !tableId || !restaurantId || loading}
            onClick={() => onLookup?.(normalized)}
            className="w-full"
            raised
          />
        </div>
      </div>
    </div>
  );
};

export default ExistingOrderLookup;

