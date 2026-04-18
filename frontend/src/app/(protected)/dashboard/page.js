/* eslint-disable @next/next/no-img-element */
"use client";

// Staff Dashboard:
// - Live-ish overview of tables (occupied vs free)
// - Start walk-in table orders & takeaway orders
// - Manage open orders: add items, update status, mark paid, close

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";

import { fetchTables } from "@/redux/tables/tableActions";
import { fetchMenuItems } from "@/redux/menu/menuActions";
import {
  createOrderStaff,
  editOrderItemsStaff,
  getOrderByIdStaff,
  getRecentOrdersStaffByWindow,
  updateOrderPaymentStatusStaff,
  updateOrderStatusStaff,
} from "@/api/order";
import { formatMoney } from "@/utils/formatMoney";

const ORDER_STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Served", value: "SERVED" },
  { label: "Billed", value: "BILLED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function statusColor(status) {
  const s = String(status || "");
  if (s === "PENDING") return "bg-amber-400";
  if (s === "CONFIRMED") return "bg-emerald-400";
  if (s === "IN_PROGRESS") return "bg-blue-400";
  if (s === "SERVED") return "bg-indigo-400";
  if (s === "BILLED") return "bg-slate-400";
  if (s === "CLOSED") return "bg-emerald-500";
  if (s === "CANCELLED") return "bg-red-500";
  return "bg-gray-400";
}

function paymentPillCls(paymentStatus) {
  const s = String(paymentStatus || "PENDING").toUpperCase();
  return s === "PAID"
    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/30"
    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/30";
}

function tableSpan(capacity) {
  const c = Number(capacity) || 4;
  if (c <= 2) return "col-span-1 row-span-1";
  if (c <= 4) return "col-span-1 row-span-1";
  if (c <= 6) return "col-span-2 row-span-1";
  if (c <= 8) return "col-span-2 row-span-2";
  return "col-span-3 row-span-2";
}

function cartFromOrder(order) {
  const map = new Map();
  const items = Array.isArray(order?.items) ? order.items : [];
  for (const it of items) {
    if (!it?.productId) continue;
    map.set(String(it.productId), Number(it.quantity) || 0);
  }
  return map;
}

function buildItemsPayload(cart) {
  const items = [];
  for (const [productId, qty] of cart.entries()) {
    const q = Number(qty) || 0;
    if (q <= 0) continue;
    items.push({ productId, quantity: q, modifiers: [] });
  }
  return items;
}

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { tables, loading: tablesLoading } = useSelector((state) => state.tables);
  const { menuItems, loading: menuLoading } = useSelector((state) => state.menu);

  const [takeaways, setTakeaways] = useState([]);
  const [loadingTakeaways, setLoadingTakeaways] = useState(false);

  // Builder dialog state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState("DINE_IN"); // DINE_IN | TAKEAWAY
  const [builderTable, setBuilderTable] = useState(null);
  const [builderOrderId, setBuilderOrderId] = useState(null);
  const [builderOrder, setBuilderOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);

  const [walkInName, setWalkInName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [nextStatus, setNextStatus] = useState("PENDING");
  const [menuSearch, setMenuSearch] = useState("");
  const [cart, setCart] = useState(() => new Map());

  const refreshTakeaways = async () => {
    setLoadingTakeaways(true);
    try {
      const data = await getRecentOrdersStaffByWindow({ sinceHours: 24, limit: 200, orderType: "TAKEAWAY" });
      setTakeaways(Array.isArray(data) ? data.filter((o) => o.status !== "CLOSED" && o.status !== "CANCELLED") : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load takeaway orders.");
    } finally {
      setLoadingTakeaways(false);
    }
  };

  useEffect(() => {
    dispatch(fetchTables());
    dispatch(fetchMenuItems());
    refreshTakeaways();
  }, [dispatch]);

  const filteredMenu = useMemo(() => {
    const q = String(menuSearch || "").toLowerCase().trim();
    const list = Array.isArray(menuItems) ? menuItems : [];
    if (!q) return list.filter((m) => m.available !== false);
    return list.filter((m) => m.available !== false && (
      String(m.name || "").toLowerCase().includes(q) ||
      String(m.description || "").toLowerCase().includes(q) ||
      String(m.category || "").toLowerCase().includes(q)
    ));
  }, [menuItems, menuSearch]);

  const cartCount = useMemo(() => {
    let total = 0;
    for (const qty of cart.values()) total += Number(qty) || 0;
    return total;
  }, [cart]);

  const openForTable = async (table) => {
    setBuilderMode("DINE_IN");
    setBuilderTable(table);
    setWalkInName("");
    setNotes("");
    setMenuSearch("");
    setPaymentStatus("PENDING");

    const current = table?.currentOrder;
    if (current?._id) {
      setBuilderOrderId(current._id);
      setLoadingOrder(true);
      setBuilderOpen(true);
      try {
        const full = await getOrderByIdStaff(current._id);
        setBuilderOrder(full);
        setCart(cartFromOrder(full));
        setNotes(full?.notes || "");
        setPaymentStatus(full?.paymentStatus || "PENDING");
        setNextStatus(full?.status || "PENDING");
      } catch (err) {
        toast.error(err?.response?.data?.error || err?.message || "Failed to load order.");
        setBuilderOpen(false);
      } finally {
        setLoadingOrder(false);
      }
      return;
    }

    // New table order
    setBuilderOrderId(null);
    setBuilderOrder(null);
    setCart(new Map());
    setNextStatus("PENDING");
    setBuilderOpen(true);
  };

  const openForTakeaway = async (orderId) => {
    setBuilderMode("TAKEAWAY");
    setBuilderTable(null);
    setNotes("");
    setMenuSearch("");

    if (!orderId) {
      // New takeaway
      setBuilderOrderId(null);
      setBuilderOrder(null);
      setCart(new Map());
      setWalkInName("");
      setPaymentStatus("PENDING");
      setNextStatus("PENDING");
      setBuilderOpen(true);
      return;
    }

    setBuilderOrderId(orderId);
    setLoadingOrder(true);
    setBuilderOpen(true);
    try {
      const full = await getOrderByIdStaff(orderId);
      setBuilderOrder(full);
      setCart(cartFromOrder(full));
      setWalkInName(full?.walkInName || "");
      setNotes(full?.notes || "");
      setPaymentStatus(full?.paymentStatus || "PENDING");
      setNextStatus(full?.status || "PENDING");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load order.");
      setBuilderOpen(false);
    } finally {
      setLoadingOrder(false);
    }
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    setBuilderOrder(null);
    setBuilderOrderId(null);
    setCart(new Map());
  };

  const inc = (id) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(String(id), (Number(next.get(String(id))) || 0) + 1);
      return next;
    });
  };

  const dec = (id) => {
    setCart((prev) => {
      const next = new Map(prev);
      const key = String(id);
      const cur = Number(next.get(key)) || 0;
      if (cur <= 1) next.delete(key);
      else next.set(key, cur - 1);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    const itemsPayload = buildItemsPayload(cart);
    if (itemsPayload.length === 0) {
      toast.error("Add at least 1 item.");
      return;
    }
    if (builderMode === "TAKEAWAY" && !String(walkInName || "").trim()) {
      toast.error("Takeaway name is required.");
      return;
    }

    setSaving(true);
    try {
      if (!builderOrderId) {
        const created = await createOrderStaff({
          orderType: builderMode,
          tableId: builderMode === "DINE_IN" ? builderTable?._id : undefined,
          walkInName: builderMode === "TAKEAWAY" ? String(walkInName || "").trim() : "",
          items: itemsPayload,
          notes: String(notes || "").trim(),
          paymentStatus,
        });

        toast.success("Order created.");
        setBuilderOrderId(created?._id);
        setBuilderOrder(created);
        setNextStatus(created?.status || "PENDING");
      } else {
        const updated = await editOrderItemsStaff(builderOrderId, {
          items: itemsPayload,
          notes: String(notes || "").trim(),
        });
        toast.success("Order updated.");
        setBuilderOrder(updated);
        setNextStatus(updated?.status || nextStatus);
      }

      await dispatch(fetchTables());
      await refreshTakeaways();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!builderOrderId) return;
    setSaving(true);
    try {
      const updated = await updateOrderStatusStaff(builderOrderId, { status, reason: "" });
      setBuilderOrder(updated);
      setNextStatus(updated?.status || status);
      toast.success("Status updated.");
      await dispatch(fetchTables());
      await refreshTakeaways();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePayment = async (nextPayment) => {
    if (!builderOrderId) {
      setPaymentStatus(nextPayment);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateOrderPaymentStatusStaff(builderOrderId, { paymentStatus: nextPayment });
      setBuilderOrder(updated);
      setPaymentStatus(updated?.paymentStatus || nextPayment);
      toast.success("Payment updated.");
      await dispatch(fetchTables());
      await refreshTakeaways();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to update payment.");
    } finally {
      setSaving(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    const total = Array.isArray(tables) ? tables.length : 0;
    const occupied = (Array.isArray(tables) ? tables : []).filter((t) => !!t?.currentOrder?._id).length;
    return `${occupied} occupied · ${Math.max(total - occupied, 0)} free`;
  }, [tables]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                      bg-white dark:bg-gray-800/80 rounded-2xl p-5
                      border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600
                          flex items-center justify-center shadow-lg shadow-emerald-500/25
                          ring-4 ring-emerald-500/10">
            <i className="pi pi-th-large text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            label="New Takeaway"
            icon="pi pi-shopping-bag"
            onClick={() => openForTakeaway(null)}
            raised
            className="shadow-md shadow-emerald-500/20"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            onClick={() => { dispatch(fetchTables()); refreshTakeaways(); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Tables */}
        <div className="xl:col-span-8">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl
                          border border-gray-200 dark:border-gray-700/50
                          shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                  <i className="pi pi-desktop text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Tables
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Occupied
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[110px]">
                {(Array.isArray(tables) ? tables : []).map((t) => {
                  const occupied = !!t?.currentOrder?._id;
                  const cls = occupied
                    ? "from-red-500 to-rose-600 shadow-red-500/20 ring-red-500/10"
                    : "from-emerald-500 to-teal-600 shadow-emerald-500/20 ring-emerald-500/10";
                  const order = t?.currentOrder;
                  return (
                    <button
                      key={t._id}
                      onClick={() => openForTable(t)}
                      className={`relative rounded-2xl p-4 text-left overflow-hidden border
                                  ${occupied ? "border-red-200/40 dark:border-rose-700/30" : "border-emerald-200/40 dark:border-emerald-700/30"}
                                  bg-white dark:bg-gray-900/30
                                  hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200
                                  ${tableSpan(t.capacity)}`}
                      title={occupied ? "Open / manage order" : "Start new order"}
                      disabled={tablesLoading}
                    >
                      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${cls}`} />
                      <div className={`absolute -right-14 -top-14 w-40 h-40 rounded-full bg-gradient-to-br ${cls} blur-3xl opacity-25`} />

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Table {t.tableNumber}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t.capacity} seats
                          </p>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${occupied ? "bg-red-500" : "bg-emerald-500"} animate-pulse-slow`} />
                      </div>

                      <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColor(order?.status || (occupied ? "PENDING" : "CLOSED"))}`} />
                          {occupied ? String(order?.status || "PENDING").replaceAll("_", " ") : "Available"}
                        </span>
                        {occupied && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${paymentPillCls(order?.paymentStatus)}`}>
                            {String(order?.paymentStatus || "PENDING").toUpperCase()}
                          </span>
                        )}
                      </div>

                      {occupied && (
                        <div className="relative z-10 mt-2 text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                          {order?.orderNumber || String(order?._id || "").slice(0, 10)}
                        </div>
                      )}
                    </button>
                  );
                })}

                {!tablesLoading && (Array.isArray(tables) ? tables : []).length === 0 && (
                  <div className="col-span-full py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                    No tables yet. Create tables first in Tables Management.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Takeaway */}
        <div className="xl:col-span-4">
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl
                          border border-gray-200 dark:border-gray-700/50
                          shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                  <i className="pi pi-shopping-bag text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Takeaway
                </p>
              </div>
              <button
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700/50
                           bg-gray-50/80 dark:bg-gray-900 text-gray-500 hover:text-emerald-500
                           hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                           active:scale-95 transition-all"
                title="Refresh takeaway list"
                onClick={refreshTakeaways}
              >
                <i className="pi pi-refresh text-sm" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {loadingTakeaways ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
              ) : takeaways.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No active takeaway orders.
                </div>
              ) : (
                takeaways.map((o) => (
                  <button
                    key={o._id}
                    onClick={() => openForTakeaway(o._id)}
                    className="text-left w-full rounded-2xl p-4 border border-gray-200 dark:border-gray-700/50
                               bg-gray-50/60 dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-800/60
                               hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {o.walkInName ? o.walkInName : "Takeaway"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">
                          {o.orderNumber || String(o._id || "").slice(0, 10)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${paymentPillCls(o.paymentStatus)}`}>
                        {String(o.paymentStatus || "PENDING").toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor(o.status)}`} />
                        {String(o.status || "").replaceAll("_", " ")}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Builder dialog */}
      <Dialog
        visible={builderOpen}
        onHide={closeBuilder}
        draggable={false}
        style={{ width: "min(1100px, 96vw)" }}
        header={
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
              ${builderMode === "TAKEAWAY"
                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 ring-4 ring-amber-500/10"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/10"
              }`}>
              <i className={`pi ${builderMode === "TAKEAWAY" ? "pi-shopping-bag" : "pi-table"} text-white`} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                {builderMode === "TAKEAWAY"
                  ? (builderOrderId ? "Manage Takeaway" : "New Takeaway")
                  : `Table ${builderTable?.tableNumber || ""}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {builderOrder?.orderNumber ? `Order #: ${builderOrder.orderNumber}` : (builderOrderId ? `Order ID: ${builderOrderId}` : "Create a new order")}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {cartCount} item{cartCount === 1 ? "" : "s"} in cart
            </div>
            <div className="flex items-center gap-2 justify-end">
              {builderOrderId && builderOrder?.status !== "CLOSED" && (
                <Button
                  label="Close Order"
                  icon="pi pi-lock"
                  severity="success"
                  onClick={() => handleUpdateStatus("CLOSED")}
                  loading={saving}
                  raised
                />
              )}
              <Button label="Save" icon="pi pi-save" onClick={handleSaveOrder} loading={saving} raised />
              <Button label="Done" icon="pi pi-check" severity="secondary" outlined onClick={closeBuilder} />
            </div>
          </div>
        }
        modal
      >
        {loadingOrder ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading order...
          </div>
        ) : (
          <div className="pt-3 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: menu */}
            <div className="lg:col-span-7 rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 flex items-center gap-3">
                <div className="relative flex-1 group">
                  <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                                group-focus-within:text-emerald-500 transition-colors" />
                  <InputText
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full !pl-9"
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {menuLoading ? "..." : `${filteredMenu.length} items`}
                </span>
              </div>

              <div className="max-h-[520px] overflow-auto divide-y divide-gray-200 dark:divide-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20">
                {filteredMenu.map((m) => {
                  const qty = Number(cart.get(String(m._id))) || 0;
                  return (
                    <div key={m._id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {m.name}
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-1">
                          {m.description || m.category}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-extrabold mt-1">
                          {formatMoney(m.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dec(m._id)}
                          className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700/60
                                     bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200
                                     hover:border-emerald-300 hover:text-emerald-600 transition-all"
                          title="Decrease"
                          disabled={qty <= 0}
                        >
                          <i className="pi pi-minus text-xs" />
                        </button>
                        <div className="w-10 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                          {qty}
                        </div>
                        <button
                          onClick={() => inc(m._id)}
                          className="w-9 h-9 rounded-xl border border-emerald-200 dark:border-emerald-700/40
                                     bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300
                                     hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
                          title="Increase"
                        >
                          <i className="pi pi-plus text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!menuLoading && filteredMenu.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No matching menu items.
                  </div>
                )}
              </div>
            </div>

            {/* Right: order meta + cart */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Meta */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 p-4">
                {builderMode === "TAKEAWAY" && (
                  <div className="mb-3">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Name
                    </label>
                    <InputText
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Customer name"
                      className="w-full mt-1"
                      disabled={!!builderOrderId} // keep stable for existing
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Notes
                  </label>
                  <InputText
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Payment
                    </label>
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={() => handleUpdatePayment("PENDING")}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold transition-all
                          ${paymentStatus === "PENDING"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700/60 hover:border-amber-300"
                          }`}
                        disabled={saving}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleUpdatePayment("PAID")}
                        className={`flex-1 px-3 py-2 rounded-xl border text-sm font-bold transition-all
                          ${paymentStatus === "PAID"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700/60 hover:border-emerald-300"
                          }`}
                        disabled={saving}
                      >
                        Paid
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                      Status
                    </label>
                    <Dropdown
                      value={nextStatus}
                      onChange={(e) => {
                        setNextStatus(e.value);
                        if (builderOrderId) handleUpdateStatus(e.value);
                      }}
                      options={ORDER_STATUS_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      className="w-full mt-1"
                      disabled={!builderOrderId || saving}
                      placeholder="Create order first"
                    />
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    Cart
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cartCount} items
                  </span>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20">
                  {Array.from(cart.entries()).map(([productId, qty]) => {
                    const m = (Array.isArray(menuItems) ? menuItems : []).find((x) => String(x._id) === String(productId));
                    return (
                      <div key={productId} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {m?.name || "Item"}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                            {productId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dec(productId)}
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800"
                            title="Decrease"
                          >
                            <i className="pi pi-minus text-[10px] text-gray-500" />
                          </button>
                          <span className="w-8 text-center text-sm font-extrabold text-gray-900 dark:text-white">
                            {qty}
                          </span>
                          <button
                            onClick={() => inc(productId)}
                            className="w-8 h-8 rounded-lg border border-emerald-200 dark:border-emerald-700/40
                                       bg-emerald-50 dark:bg-emerald-900/20"
                            title="Increase"
                          >
                            <i className="pi pi-plus text-[10px] text-emerald-700 dark:text-emerald-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {cartCount === 0 && (
                    <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/80">
                      Add items from the menu.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default DashboardPage;
