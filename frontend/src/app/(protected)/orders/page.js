"use client";

// Orders Page (Staff)
// Premium, minimal UI:
// - Recent orders list for the restaurant
// - Search + status filters
// - Summary cards
// - Order details dialog (items, totals, history, status update)

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";

import { getOrderByIdStaff, getRecentOrdersStaff, updateOrderStatusStaff } from "@/api/order";
import OrderDetailsDialog from "@/component/orders/OrderDetailsDialog";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Served", value: "SERVED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `$${num.toFixed(2)}`;
}

function shortId(id) {
  if (!id) return "-";
  return `${String(id).slice(0, 6)}...${String(id).slice(-4)}`;
}

const OrdersPage = () => {
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user?.user;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Details dialog
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : (currentUser?.roles ? [currentUser.roles] : []);
  const canUpdateStatus = roles.some((r) => ["OWNER", "ADMIN", "MANAGER", "CASHIER", "WAITER", "KITCHEN"].includes(r));

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getRecentOrdersStaff({ status: statusFilter || undefined, limit: 100 });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const id = String(o?._id || "").toLowerCase();
      const orderNumber = String(o?.orderNumber || "").toLowerCase();
      const tableNo = String(o?.tableId?.tableNumber || "").toLowerCase();
      const status = String(o?.status || "").toLowerCase();
      const notes = String(o?.notes || "").toLowerCase();
      return orderNumber.includes(q) || id.includes(q) || tableNo.includes(q) || status.includes(q) || notes.includes(q);
    });
  }, [orders, search]);

  // Summary
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const inProgress = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const served = orders.filter((o) => o.status === "SERVED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const revenue = orders
    .filter((o) => ["SERVED", "BILLED"].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const summaryCards = [
    { label: "Orders", value: total, icon: "pi pi-receipt", gradient: "from-blue-500 to-indigo-600", accent: "border-l-blue-500" },
    { label: "Pending", value: pending, icon: "pi pi-clock", gradient: "from-amber-500 to-orange-500", accent: "border-l-amber-500" },
    { label: "In Progress", value: inProgress, icon: "pi pi-spinner", gradient: "from-sky-500 to-cyan-600", accent: "border-l-sky-500" },
    { label: "Revenue", value: formatMoney(revenue), icon: "pi pi-dollar", gradient: "from-emerald-500 to-teal-600", accent: "border-l-emerald-500" },
  ];

  // Templates
  const orderTemplate = (row) => {
    const tableNo = row?.tableId?.tableNumber;
    return (
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                        flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-400/10">
          <i className="pi pi-receipt text-white" style={{ fontSize: "0.85rem" }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            {tableNo ? `Table ${tableNo}` : "Table"}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight mt-0.5 font-mono">
            {row?.orderNumber ? String(row.orderNumber) : shortId(row?._id)}
          </p>
        </div>
      </div>
    );
  };

  const orderNumberTemplate = (row) => (
    <span className="font-mono text-sm font-extrabold text-gray-900 dark:text-white">
      {row?.orderNumber || "-"}
    </span>
  );

  const statusTemplate = (row) => {
    const cfg = {
      PENDING: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/30",
      CONFIRMED: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/30",
      IN_PROGRESS: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/30",
      SERVED: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-700/30",
      CANCELLED: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-700/30",
      BILLED: "bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/30",
    };
    const cls = cfg[row.status] || cfg.PENDING;
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
          {String(row.status || "").replaceAll("_", " ")}
        </span>
        {row?.pendingAdditions && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-extrabold
                           border border-amber-200/60 dark:border-amber-700/30
                           bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            Additions
          </span>
        )}
      </span>
    );
  };

  const totalTemplate = (row) => (
    <span className="font-extrabold text-gray-900 dark:text-white">{formatMoney(row.total)}</span>
  );

  const itemsCountTemplate = (row) => (
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
      {(row?.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)}
    </span>
  );

  const createdTemplate = (row) => {
    if (!row?.createdAt) return "-";
    const d = new Date(row.createdAt);
    return (
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  };

  const actionsTemplate = (row) => (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => openDetails(row?._id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                   transition-all duration-150"
        title="View details"
      >
        <i className="pi pi-eye" style={{ fontSize: "0.85rem" }} />
      </button>
    </div>
  );

  const openDetails = async (orderId) => {
    if (!orderId) return;
    setShowDetails(true);
    setSelectedOrder(null);
    setLoadingDetails(true);
    try {
      const data = await getOrderByIdStaff(orderId);
      setSelectedOrder(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load order details.");
      setShowDetails(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async ({ status, reason }) => {
    if (!selectedOrder?._id) return;
    if (!status) return;
    if (status === "CANCELLED" && !String(reason || "").trim()) {
      toast.error("Cancellation reason is required.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const updated = await updateOrderStatusStaff(selectedOrder._id, { status, reason });
      toast.success("Status updated.");
      setSelectedOrder(updated);
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="menu-stat-card rounded-2xl p-4 border-l-4 border-l-gray-300 dark:border-l-gray-600">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="2.5rem" height="2.5rem" className="rounded-xl" />
          </div>
          <Skeleton width="5rem" height="2rem" className="mb-3" />
          <Skeleton width="6rem" height="0.7rem" />
        </div>
      ))}
    </div>
  );

  const emptyMessage = (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100
                      dark:from-blue-900/20 dark:to-indigo-900/20
                      flex items-center justify-center
                      border border-blue-200/50 dark:border-blue-700/30
                      shadow-lg shadow-blue-500/5">
        <i className="pi pi-receipt text-5xl text-blue-400/60 dark:text-blue-500/40" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {search ? "No matching orders" : "No orders yet"}
        </p>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {search ? "Try a different search term." : "Orders will appear here once customers start ordering."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                      bg-white dark:bg-gray-800/80 rounded-2xl p-5
                      border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center shadow-lg shadow-blue-500/25
                          ring-4 ring-blue-500/10">
            <i className="pi pi-receipt text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Orders
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Track and manage recent restaurant orders
            </p>
          </div>
        </div>

        <Button
          label="Refresh"
          icon="pi pi-refresh"
          onClick={fetchOrders}
          raised
          className="shadow-md shadow-blue-500/20"
        />
      </div>

      {/* Summary */}
      {loading ? renderSkeletonCards() : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div
              key={card.label}
              className={`menu-stat-card rounded-2xl p-4 border-l-4 ${card.accent}
                          cursor-default group relative overflow-hidden animate-fade-in-up`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`menu-stat-icon w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient}
                                flex items-center justify-center shadow-md
                                group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${card.icon} text-white`} style={{ fontSize: "0.85rem" }} />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight relative z-10">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider leading-tight">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all
              ${statusFilter === f.value
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-700/50 hover:border-blue-300"
              }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative w-full sm:w-80 group">
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                        group-focus-within:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, table, status, notes..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl
                       border border-gray-200 dark:border-gray-600
                       bg-gray-50/80 dark:bg-gray-900 text-gray-700 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20
                       focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800
                       transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-150"
              title="Clear search"
            >
              <i className="pi pi-times text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl
                      border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <DataTable
          value={filteredOrders}
          loading={loading}
          rowClassName={(row) => (row?.pendingAdditions ? "bg-amber-50/40 dark:bg-amber-900/10" : "")}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage={emptyMessage}
          removableSort
          sortField="createdAt"
          sortOrder={-1}
          rowHover
          className="border-none"
          stripedRows
        >
          <Column header="Order #" body={orderNumberTemplate} style={{ minWidth: "9rem" }} />
          <Column header="Order" body={orderTemplate} style={{ minWidth: "14rem" }} />
          <Column field="status" header="Status" sortable body={statusTemplate} style={{ minWidth: "10rem" }} />
          <Column header="Items" body={itemsCountTemplate} style={{ minWidth: "6rem" }} />
          <Column field="total" header="Total" sortable body={totalTemplate} style={{ minWidth: "7rem" }} />
          <Column field="createdAt" header="Created" sortable body={createdTemplate} style={{ minWidth: "10rem" }} />
          <Column header="Actions" body={actionsTemplate} style={{ minWidth: "7rem" }} frozen alignFrozen="right" />
        </DataTable>
      </div>

      <OrderDetailsDialog
        visible={showDetails}
        onHide={() => setShowDetails(false)}
        order={loadingDetails ? null : selectedOrder}
        canUpdateStatus={canUpdateStatus}
        onUpdateStatus={handleUpdateStatus}
        updatingStatus={updatingStatus}
      />
    </div>
  );
};

export default OrdersPage;