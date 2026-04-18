"use client";

// Order details dialog:
// - Displays key info, items, totals, and status history
// - Allows staff to update status (and provide reason when cancelling)

import React, { useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { formatMoneyOrDash } from "@/utils/formatMoney";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING", icon: "pi pi-clock", color: "text-amber-500" },
  { label: "Confirmed", value: "CONFIRMED", icon: "pi pi-check-circle", color: "text-emerald-500" },
  { label: "In Progress", value: "IN_PROGRESS", icon: "pi pi-spinner", color: "text-blue-500" },
  { label: "Served", value: "SERVED", icon: "pi pi-verified", color: "text-indigo-500" },
  { label: "Billed", value: "BILLED", icon: "pi pi-wallet", color: "text-slate-600 dark:text-slate-300" },
  { label: "Closed", value: "CLOSED", icon: "pi pi-lock", color: "text-emerald-600 dark:text-emerald-300" },
  { label: "Cancelled", value: "CANCELLED", icon: "pi pi-times-circle", color: "text-red-500" },
];

const statusItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} ${option.color}`} style={{ fontSize: "0.85rem" }} />
    <span className="font-medium text-sm">{option.label}</span>
  </div>
);

const formatMoney = formatMoneyOrDash;

const OrderDetailsDialog = ({
  visible,
  onHide,
  order,
  canUpdateStatus,
  onUpdateStatus,
  updatingStatus,
  onUpdatePaymentStatus,
  updatingPayment,
}) => {
  const [nextStatus, setNextStatus] = useState("PENDING");
  const [reason, setReason] = useState("");

  // Keep dropdown template stable
  const valueTemplate = useMemo(() => statusItemTemplate, []);

  const initializeUiState = () => {
    setNextStatus(order?.status || "PENDING");
    setReason("");
  };

  const header = (
    <div className="flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                      flex items-center justify-center shadow-md shadow-blue-500/25
                      ring-4 ring-blue-500/10">
        <i className="pi pi-receipt text-white" style={{ fontSize: "0.95rem" }} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
          Order Details
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {order?.orderNumber ? `Order #: ${order.orderNumber}` : (order?._id ? `Order ID: ${order._id}` : "Order")}
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined onClick={onHide} />
    </div>
  );

  const items = Array.isArray(order?.items) ? order.items : [];
  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
  const tableNumber = order?.tableId?.tableNumber;
  const paymentStatus = order?.paymentStatus || "PENDING";

  return (
    <Dialog
      visible={visible}
      onShow={initializeUiState}
      onHide={onHide}
      header={header}
      footer={footer}
      modal
      draggable={false}
      style={{ width: "min(980px, 96vw)" }}
    >
      {!order ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Select an order to view details.
        </div>
      ) : (
        <div className="pt-4 flex flex-col gap-5">
          {/* ===== Top summary ===== */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60
                            bg-gray-50/70 dark:bg-gray-900/40">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {tableNumber ? `Table ${tableNumber}` : "Table"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Created:{" "}
                    {order?.createdAt
                      ? new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                    {formatMoney(order.total)}
                  </p>
                </div>
              </div>
              {order?.notes ? (
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Notes:</span> {order.notes}
                </div>
              ) : null}
              {order?.pendingAdditions ? (
                <div className="mt-3 text-sm">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold
                                   border border-amber-200/60 dark:border-amber-700/30
                                   bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                    Customer added items - confirm required
                  </span>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-5 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60
                            bg-white dark:bg-gray-800/80">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">
                Status
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Current:{" "}
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {String(order.status || "").replaceAll("_", " ")}
                  </span>
                </span>
                {canUpdateStatus && order?.status !== "CLOSED" && (
                  <Button
                    label="Close order"
                    icon="pi pi-lock"
                    size="small"
                    severity="success"
                    onClick={() => onUpdateStatus({ status: "CLOSED", reason: "" })}
                    loading={updatingStatus}
                    raised
                  />
                )}
              </div>

              {/* Payment */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Payment:{" "}
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {String(paymentStatus).toUpperCase()}
                  </span>
                </span>
                {canUpdateStatus && paymentStatus !== "PAID" && typeof onUpdatePaymentStatus === "function" && (
                  <Button
                    label="Mark paid"
                    icon="pi pi-check"
                    size="small"
                    onClick={() => onUpdatePaymentStatus({ paymentStatus: "PAID" })}
                    loading={updatingPayment}
                    raised
                  />
                )}
              </div>

              {canUpdateStatus && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-7">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Update status
                    </label>
                    <Dropdown
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.value)}
                      options={STATUS_OPTIONS}
                      optionLabel="label"
                      optionValue="value"
                      itemTemplate={statusItemTemplate}
                      valueTemplate={valueTemplate}
                      className="w-full mt-1"
                    />
                  </div>
                  <div className="sm:col-span-5 flex justify-end">
                    <Button
                      label="Save"
                      icon="pi pi-save"
                      onClick={() => onUpdateStatus({ status: nextStatus, reason })}
                      loading={updatingStatus}
                      raised
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>
              )}

              {canUpdateStatus && nextStatus === "CANCELLED" && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Cancellation reason (required)
                  </label>
                  <InputText
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Short reason"
                    className="w-full mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ===== Items ===== */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700/60
                            bg-white dark:bg-gray-800/80 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                Items
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700/60">
              {items.map((it, idx) => (
                <div key={`${it.productId || idx}`} className="px-4 py-3 bg-gray-50/40 dark:bg-gray-900/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {it.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {it.quantity} x {formatMoney(it.unitPrice)}
                      </p>
                      {Array.isArray(it.modifiers) && it.modifiers.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Modifiers: {it.modifiers.map((m) => `${m.name} (+${formatMoney(m.price)})`).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                        {formatMoney(it.lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/80">
                  No items found for this order.
                </div>
              )}
            </div>
          </div>

          {/* ===== Totals ===== */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/80">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Totals</p>
              <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                <span>Subtotal</span>
                <span className="font-semibold">{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200 mt-1">
                <span>Tax</span>
                <span className="font-semibold">{formatMoney(order.tax)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                <span className="font-bold">Total</span>
                <span className="font-extrabold">{formatMoney(order.total)}</span>
              </div>
            </div>

            <div className="md:col-span-7 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Status History</p>
              <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-1">
                {history.length ? history
                  .slice()
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((h, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {String(h.status || "").replaceAll("_", " ")}
                        </p>
                        {(h.reason || h.updatedBy) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {h.reason ? `Reason: ${h.reason}` : ""}
                            {h.reason && h.updatedBy ? " · " : ""}
                            {h.updatedBy ? `By: ${h.updatedBy}` : ""}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : ""}
                      </span>
                    </div>
                  )) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No status history.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default OrderDetailsDialog;

