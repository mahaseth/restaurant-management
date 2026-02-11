"use client";

// Dialog to view a table's QR code in full size.
// Has download and print buttons for the manager.
// Designed to look premium with a nice frame around the QR code.

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const QrCodeDialog = ({ visible, onHide, table }) => {

  // Download the QR code as a PNG
  const handleDownload = () => {
    if (!table?.qrCode) return;
    const link = document.createElement("a");
    link.href = table.qrCode;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
  };

  // Open print dialog with just the QR code
  const handlePrint = () => {
    if (!table?.qrCode) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Table ${table.tableNumber} - QR Code</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <h2 style="margin-bottom:8px;">Table ${table.tableNumber}</h2>
          <p style="color:#666;margin-bottom:24px;">Scan to order</p>
          <img src="${table.qrCode}" style="width:300px;height:300px;" />
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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-md shadow-indigo-500/25
                          ring-4 ring-indigo-500/10">
            <i className="pi pi-qrcode text-white" style={{ fontSize: "0.95rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">
              Table #{table?.tableNumber}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
              QR Code for customer ordering
            </p>
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
            {/* ===== QR Code display — premium card look ===== */}
            <div className="relative w-full flex items-center justify-center">
              {/* Glow effect behind the QR card */}
              <div className="absolute w-52 h-52 rounded-full bg-indigo-400/10
                              dark:bg-indigo-500/5 blur-3xl" />

              {/* The QR card itself */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-2
                              shadow-xl shadow-gray-200/50 dark:shadow-black/30
                              border border-gray-100 dark:border-gray-700">

                {/* Inner frame with subtle gradient border */}
                <div className="relative rounded-xl overflow-hidden
                                bg-gradient-to-br from-indigo-50 via-white to-purple-50
                                dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/30
                                p-5">
                  {/* Corner brackets for a scan-frame feel */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-[2.5px] border-l-[2.5px]
                                  border-indigo-400 dark:border-indigo-500 rounded-tl-lg opacity-60" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-[2.5px] border-r-[2.5px]
                                  border-indigo-400 dark:border-indigo-500 rounded-tr-lg opacity-60" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-[2.5px] border-l-[2.5px]
                                  border-indigo-400 dark:border-indigo-500 rounded-bl-lg opacity-60" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-[2.5px] border-r-[2.5px]
                                  border-indigo-400 dark:border-indigo-500 rounded-br-lg opacity-60" />

                  {/* The QR image */}
                  <img
                    src={table.qrCode}
                    alt={`QR Code for Table ${table.tableNumber}`}
                    className="w-52 h-52 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* ===== Table info mini-card ===== */}
            <div className="w-full flex items-center gap-3 px-4 py-3
                            bg-gray-50 dark:bg-gray-800/50 rounded-xl
                            border border-gray-100 dark:border-gray-700/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600
                              flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white font-bold text-xs">
                  {String(table.tableNumber).padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                  Table {table.tableNumber}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {table.capacity} {table.capacity === 1 ? "seat" : "seats"} &middot; {table.status}
                </p>
              </div>
              {/* Status indicator dot */}
              <div className={`w-2.5 h-2.5 rounded-full shrink-0
                ${table.status === "ACTIVE" ? "bg-emerald-500" :
                  table.status === "RESERVED" ? "bg-amber-500" : "bg-red-500"
                } animate-pulse-slow`} />
            </div>

            {/* ===== Scan-to-order info tip ===== */}
            <div className="flex items-start gap-2.5 px-4 py-3 w-full rounded-xl
                            bg-indigo-50/60 dark:bg-indigo-950/30
                            border border-indigo-100/60 dark:border-indigo-800/30">
              <i className="pi pi-info-circle text-indigo-400 dark:text-indigo-500 mt-0.5"
                 style={{ fontSize: "0.8rem" }} />
              <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 leading-relaxed">
                Place this QR code on the table so customers can scan and order directly from their phone.
              </p>
            </div>

            {/* ===== Action buttons ===== */}
            <div className="flex gap-3 w-full">
              <Button
                label="Print"
                icon="pi pi-print"
                severity="secondary"
                outlined
                onClick={handlePrint}
                className="flex-1"
              />
              <Button
                label="Download"
                icon="pi pi-download"
                onClick={handleDownload}
                raised
                className="flex-1"
              />
            </div>
          </>
        ) : (
          /* ===== No QR code state ===== */
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
                            dark:from-gray-800 dark:to-gray-700/80
                            flex items-center justify-center
                            border border-gray-200 dark:border-gray-600
                            shadow-inner">
              <i className="pi pi-qrcode text-4xl text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">
                No QR code available
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                This table does not have a QR code generated yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default QrCodeDialog;
