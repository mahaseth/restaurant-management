"use client";

// Simple confirmation dialog before deleting a table.
// Shows a nice warning message with table details.

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const DeleteTableDialog = ({ visible, onHide, onConfirm, table, deleting }) => {

  // Footer with Cancel and Delete buttons
  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
      />
      <Button
        label="Yes, Delete"
        icon="pi pi-trash"
        severity="danger"
        onClick={onConfirm}
        loading={deleting}
        raised
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600
                          flex items-center justify-center shadow-md shadow-red-500/25
                          ring-4 ring-red-500/10">
            <i className="pi pi-trash text-white" style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">Delete Table</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
              This action is permanent
            </p>
          </div>
        </div>
      }
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: "440px" }}
      modal
      draggable={false}
    >
      <div className="pt-5 flex flex-col gap-4">
        {/* Warning card */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50
                        dark:from-red-950/20 dark:to-rose-950/20
                        border border-red-200/70 dark:border-red-800/30 rounded-2xl p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40
                            flex items-center justify-center shrink-0 mt-0.5">
              <i className="pi pi-exclamation-triangle text-red-500 dark:text-red-400"
                 style={{ fontSize: "1.1rem" }} />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100">
                Are you sure you want to delete this table?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                You are about to permanently remove this table and its QR code. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Table info summary being deleted */}
        {table && (
          <div className="flex items-center gap-3 px-4 py-3
                          bg-gray-50 dark:bg-gray-800/50 rounded-xl
                          border border-gray-100 dark:border-gray-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                            flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">
                {String(table.tableNumber).padStart(2, "0")}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Table #{table.tableNumber}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {table.capacity} {table.capacity === 1 ? "seat" : "seats"} &middot; {table.status}
              </p>
            </div>
            {/* Red indicator — about to be deleted */}
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-slow shrink-0" />
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default DeleteTableDialog;
