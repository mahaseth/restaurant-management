"use client";

// Customer Order page (opened by scanning table QR code)
// URL format:
//   /order?tableId=<id>&restaurantId=<id>
//
// Features:
// - Public menu browsing (by restaurantId)
// - Cart with quantity controls
// - Place order (POST /api/order)
//
// Keep UI minimal, premium, and mobile-friendly.

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";

import {
  addItemsToPublicOrder,
  createOrderPublic,
  getPublicMenuItems,
  getPublicOrderByNumber,
  getPublicTableInfo,
} from "@/api/publicOrder";
import ExistingOrderLookup from "@/component/order/ExistingOrderLookup";
import OrderStartScreen from "@/component/order/OrderStartScreen";

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) return false;

  // Best path (works only in secure contexts + with permissions).
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fallback below.
  }

  // Fallback path (works on http:// and older browsers).
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-9999px";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return !!ok;
  } catch {
    return false;
  }
}

const CATEGORY_LABELS = {
  appetizer: "Appetizers",
  main: "Main Course",
  dessert: "Desserts",
  drink: "Drinks",
  side: "Sides",
};

const OrderPage = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId") || "";
  const restaurantId = searchParams.get("restaurantId") || "";

  const emailStorageKey = useMemo(() => (
    restaurantId ? `customerEmail:${restaurantId}` : "customerEmail"
  ), [restaurantId]);

  // start | new | existing
  const [step, setStep] = useState("start");
  const [customerEmail, setCustomerEmail] = useState("");
  const [existingOrderNumber, setExistingOrderNumber] = useState("");
  const [existingOrder, setExistingOrder] = useState(null);
  const [existingLoading, setExistingLoading] = useState(false);

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // cart: { [menuItemId]: quantity }
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(emailStorageKey);
    if (saved) setCustomerEmail(saved);
  }, [emailStorageKey]);

  const loadTable = async () => {
    if (!tableId || !restaurantId) return;
    setTableLoading(true);
    try {
      const data = await getPublicTableInfo(tableId, restaurantId);
      setTableInfo(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load table info.");
    } finally {
      setTableLoading(false);
    }
  };

  const loadMenu = async () => {
    if (!restaurantId) return;
    setMenuLoading(true);
    try {
      const data = await getPublicMenuItems(restaurantId);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load menu.");
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    if (!tableId || !restaurantId) return;
    // Always start at the gate screen when scanning a QR code.
    setStep("start");
    setCreatedOrder(null);
    setExistingOrder(null);
    setExistingOrderNumber("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, restaurantId]);

  const categories = useMemo(() => {
    const set = new Set(menuItems.map((m) => m.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    const q = search.toLowerCase().trim();
    return menuItems
      .filter((m) => (activeCategory === "all" ? true : m.category === activeCategory))
      .filter((m) => {
        if (!q) return true;
        return (
          String(m.name || "").toLowerCase().includes(q) ||
          String(m.description || "").toLowerCase().includes(q)
        );
      });
  }, [menuItems, activeCategory, search]);

  const cartLines = useMemo(() => {
    const map = new Map(menuItems.map((m) => [String(m._id), m]));
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ item: map.get(String(id)), qty }))
      .filter((x) => !!x.item);
  }, [cart, menuItems]);

  const subtotal = cartLines.reduce((sum, line) => sum + (Number(line.item.price) || 0) * line.qty, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const setQty = (id, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      const v = Math.max(0, Number(qty) || 0);
      if (v === 0) delete next[id];
      else next[id] = v;
      return next;
    });
  };

  const addOne = (id) => setQty(id, (cart[id] || 0) + 1);
  const removeOne = (id) => setQty(id, (cart[id] || 0) - 1);

  const placeOrder = async () => {
    if (!tableId || !restaurantId) {
      toast.error("Invalid QR link. Missing tableId or restaurantId.");
      return;
    }
    if (!String(customerEmail || "").trim()) {
      toast.error("Please enter your email first.");
      return;
    }
    if (cartLines.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const items = cartLines.map((line) => ({
      productId: line.item._id,
      quantity: line.qty,
      modifiers: [],
    }));

    setPlacing(true);
    try {
      const order = await createOrderPublic({
        tableId,
        restaurantId,
        items,
        notes: notes.trim(),
        customerEmail: String(customerEmail || "").trim(),
        clientOrderId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined,
      });
      setCreatedOrder(order);
      setExistingOrderNumber(order?.orderNumber || "");
      setCart({});
      setNotes("");
      toast.success(`Order placed. Order number: ${order?.orderNumber || "-"}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data || err?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  const lookupExistingOrder = async (orderNumber) => {
    const normalized = String(orderNumber || "").trim().toUpperCase();
    if (!normalized) return;
    if (!tableId || !restaurantId) return;

    setExistingLoading(true);
    try {
      const data = await getPublicOrderByNumber(normalized, { tableId, restaurantId });
      setExistingOrder(data);
      setExistingOrderNumber(data?.orderNumber || normalized);
      // Load menu/table for the "add more items" path.
      loadTable();
      loadMenu();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Order not found.");
    } finally {
      setExistingLoading(false);
    }
  };

  const addItemsToExistingOrder = async () => {
    const orderNumber = String(existingOrderNumber || "").trim().toUpperCase();
    if (!orderNumber) {
      toast.error("Missing order number.");
      return;
    }
    if (!String(customerEmail || "").trim()) {
      toast.error("Please enter your email first.");
      return;
    }
    if (cartLines.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const items = cartLines.map((line) => ({
      productId: line.item._id,
      quantity: line.qty,
      modifiers: [],
    }));

    setPlacing(true);
    try {
      const updated = await addItemsToPublicOrder(orderNumber, {
        tableId,
        restaurantId,
        items,
        notes: notes.trim(),
        customerEmail: String(customerEmail || "").trim(),
      });
      setExistingOrder(updated);
      setCart({});
      setNotes("");
      toast.success("Items added to your order.");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to add items.");
    } finally {
      setPlacing(false);
    }
  };

  if (!tableId || !restaurantId) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center ring-4 ring-red-500/10">
              <i className="pi pi-exclamation-triangle text-white text-lg" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">Invalid QR Link</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Please scan the QR code again or ask staff for help.
              </p>
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Missing parameters: <span className="font-mono">tableId</span> or <span className="font-mono">restaurantId</span>.
          </div>
        </div>
      </div>
    );
  }

  if (step === "start") {
    return (
      <OrderStartScreen
        defaultEmail={customerEmail}
        onContinueNew={(email) => {
          setCustomerEmail(email);
          if (typeof window !== "undefined") window.localStorage.setItem(emailStorageKey, email);
          setStep("new");
          loadTable();
          loadMenu();
        }}
        onContinueExisting={(email) => {
          setCustomerEmail(email);
          if (typeof window !== "undefined") window.localStorage.setItem(emailStorageKey, email);
          setStep("existing");
        }}
      />
    );
  }

  if (step === "existing" && !existingOrder) {
    return (
      <ExistingOrderLookup
        tableId={tableId}
        restaurantId={restaurantId}
        loading={existingLoading}
        initialOrderNumber={existingOrderNumber}
        onLookup={(orderNumber) => lookupExistingOrder(orderNumber)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center
                            shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
              <i className="pi pi-shopping-cart text-white text-lg" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Place Your Order
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tableLoading ? "Loading table..." : (tableInfo?.tableNumber ? `Table ${tableInfo.tableNumber}` : "Table")}
              </p>
            </div>
          </div>
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            onClick={() => { loadMenu(); loadTable(); }}
          />
        </div>
      </div>

      {existingOrder && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Existing order</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white font-mono truncate">
                {existingOrder.orderNumber}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border
                             bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/30">
              {String(existingOrder.status || "").replaceAll("_", " ")}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={() => {
                setStep("existing");
                setExistingOrder(null);
              }}
            >
              Change order
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={() => lookupExistingOrder(existingOrder.orderNumber)}
            >
              Refresh status
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <i className="pi pi-list text-gray-400" />
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-100">Menu</p>
              </div>
              <div className="relative w-full sm:w-80 group">
                <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                              group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl
                             border border-gray-200 dark:border-gray-700
                             bg-gray-50/80 dark:bg-gray-950 text-gray-700 dark:text-gray-200
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20
                             focus:border-blue-400 focus:bg-white dark:focus:bg-gray-900
                             transition-all duration-200"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-auto scrollbar-hide pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap
                    ${activeCategory === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-blue-300"
                    }`}
                >
                  {cat === "all" ? "All" : (CATEGORY_LABELS[cat] || cat)}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                    <Skeleton width="100%" height="8rem" className="mb-3" />
                    <Skeleton width="70%" height="1.2rem" className="mb-2" />
                    <Skeleton width="90%" height="0.8rem" className="mb-1" />
                    <Skeleton width="40%" height="0.8rem" />
                  </div>
                ))
              ) : (
                filteredMenu.map((m) => {
                  const qty = cart[m._id] || 0;
                  const unavailable = m.available === false;
                  return (
                    <div key={m._id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                      <div className="h-36 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                        {m.image ? (
                          <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <i className="pi pi-image" style={{ fontSize: "1.5rem" }} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{m.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-gray-900 dark:text-white">{formatMoney(m.price)}</p>
                            {unavailable && (
                              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-0.5">Unavailable</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {qty === 0 ? (
                            <Button label="Add" icon="pi pi-plus" onClick={() => addOne(m._id)} raised disabled={unavailable} />
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                                           text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                onClick={() => removeOne(m._id)}
                              >
                                <i className="pi pi-minus" />
                              </button>
                              <span className="w-10 text-center font-bold text-gray-900 dark:text-white">{qty}</span>
                              <button
                                type="button"
                                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                                           text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                onClick={() => addOne(m._id)}
                                disabled={unavailable}
                              >
                                <i className="pi pi-plus" />
                              </button>
                            </div>
                          )}
                          <span className="text-xs text-gray-400">
                            {CATEGORY_LABELS[m.category] || m.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800 dark:text-gray-100">Your Cart</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {cartLines.length} item{cartLines.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 max-h-[45vh] overflow-auto pr-1">
              {cartLines.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Add items to start your order.
                </div>
              ) : (
                cartLines.map((line) => (
                  <div key={line.item._id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{line.item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {line.qty} x {formatMoney(line.item.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          onClick={() => removeOne(line.item._id)}
                        >
                          <i className="pi pi-minus" style={{ fontSize: "0.8rem" }} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          onClick={() => addOne(line.item._id)}
                          disabled={line.item.available === false}
                        >
                          <i className="pi pi-plus" style={{ fontSize: "0.8rem" }} />
                        </button>
                        <button
                          type="button"
                          className="ml-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                          onClick={() => setQty(line.item._id, 0)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white shrink-0">
                      {formatMoney((Number(line.item.price) || 0) * line.qty)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requests?"
                className="w-full mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950
                           text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                           px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300 mt-1">
                <span>Tax</span>
                <span className="font-semibold">{formatMoney(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="font-bold">Total</span>
                <span className="font-extrabold">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                label={placing ? "Saving..." : (existingOrder ? "Add Items" : "Place Order")}
                icon="pi pi-check"
                onClick={existingOrder ? addItemsToExistingOrder : placeOrder}
                loading={placing}
                raised
                className="w-full"
                disabled={placing || cartLines.length === 0}
              />
            </div>

            {createdOrder && (
              <div className="mt-4 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/30 bg-emerald-50/70 dark:bg-emerald-950/20">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Order placed</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                  Order number:
                </p>
                <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 font-mono">
                  {createdOrder.orderNumber || "-"}
                </p>
                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70 mt-2">
                  Take a screenshot or copy this number to view your order later.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200/70 dark:border-emerald-800/30
                               text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition"
                    onClick={async () => {
                      const text = String(createdOrder.orderNumber || "").trim();
                      if (!text) return;
                      const ok = await copyTextToClipboard(text);
                      if (ok) toast.success("Order number copied.");
                      else toast.error("Copy failed. Please take a screenshot.");
                    }}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200/70 dark:border-emerald-800/30
                               text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition"
                    onClick={() => {
                      setStep("existing");
                      setExistingOrder(null);
                      setExistingOrderNumber(createdOrder.orderNumber || "");
                    }}
                  >
                    View status
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent orders removed: customer flow starts with New/Existing choice. */}
        </div>
      </div>
    </div>
  );
};

export default OrderPage;

