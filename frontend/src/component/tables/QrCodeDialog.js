"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

async function copyText(text) {
  const value = String(text || "");
  if (!value) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* ignore */
  }
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

const QrCodeDialog = ({ visible, onHide, table, onRegenerate }) => {
  const entryUrl = (() => {
    if (table?.qrLink) return String(table.qrLink);
    if (typeof window === "undefined" || !table?.qrToken) return "";
    return `${window.location.origin.replace(/\/$/, "")}/table/qr/${encodeURIComponent(table.qrToken)}`;
  })();

  const handleDownload = () => {
    if (!table?.qrCode) return;
    const link = document.createElement("a");
    link.href = table.qrCode;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
  };

  const handlePrint = () => {
    if (!table?.qrCode) return;
    const printWindow = window.open("", "_blank");
    const safeUrl = entryUrl ? String(entryUrl).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") : "";
    printWindow.document.write(`
      <html>
        <head><title>Table ${table.tableNumber} — Table QR</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <h2 style="margin-bottom:8px;">Table ${table.tableNumber}</h2>
          <p style="color:#666;margin-bottom:24px;">Scan to chat, browse the menu, and order</p>
          <img src="${table.qrCode}" style="width:300px;height:300px;" />
          ${safeUrl ? `<p style="margin:18px 24px 0 24px; max-width:520px; word-break:break-all; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12px; color:#333;">${safeUrl}</p>` : ``}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog
      header={
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-md shadow-indigo-500/25
                          ring-4 ring-indigo-500/10"
          >
            <i className="pi pi-qrcode text-white" style={{ fontSize: "0.95rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">Table #{table?.tableNumber}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">One QR: chat + menu + order</p>
          </div>
        </div>
      }
      visible={visible}
      onHide={onHide}
      style={{ width: "420px" }}
      modal
      draggable={false}
    >
      <div className="flex flex-col items-center gap-5 pt-5 pb-2">
        {table?.qrCode ? (
          <>
            <div className="relative w-full flex items-center justify-center">
              <div className="absolute w-52 h-52 rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl" />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/30 p-5">
                  <img
                    src={table.qrCode}
                    alt={`Table QR for table ${table.tableNumber}`}
                    className="w-52 h-52 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex items-start gap-2.5 px-4 py-3 w-full rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30
                            border border-indigo-100/60 dark:border-indigo-800/30"
            >
              <i className="pi pi-info-circle text-indigo-400 dark:text-indigo-500 mt-0.5" style={{ fontSize: "0.8rem" }} />
              <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 leading-relaxed">
                Guests scan once to open AI chat (when enabled), browse the menu, manage a cart, and place an order for
                this table.
              </p>
            </div>

            {entryUrl && (
              <div className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Table link</p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={entryUrl}
                    readOnly
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-mono border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950 text-gray-700 dark:text-gray-200"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    label="Copy"
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={async () => {
                      await copyText(entryUrl);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button
                label="Print"
                icon="pi pi-print"
                severity="secondary"
                outlined
                onClick={handlePrint}
                className="flex-1"
              />
              <Button label="Download" icon="pi pi-download" onClick={handleDownload} raised className="flex-1" />
            </div>

            {typeof onRegenerate === "function" && (
              <Button
                label="Regenerate QR"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={onRegenerate}
                className="w-full"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">No QR code yet</p>
            <p className="text-gray-400 text-xs">Regenerate from the table row actions after saving the table.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default QrCodeDialog;
