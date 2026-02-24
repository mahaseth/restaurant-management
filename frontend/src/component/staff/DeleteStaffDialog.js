"use client";

// Confirmation dialog for deleting a staff member.
// Kept separate to keep the Staff page simple and modular.

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const DeleteStaffDialog = ({ visible, onHide, onConfirm, user, deleting }) => {
  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        disabled={deleting}
      />
      <Button
        label="Delete"
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
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: "min(520px, 95vw)" }}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center
                          shadow-lg shadow-red-500/20 ring-4 ring-red-500/10">
            <i className="pi pi-trash text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Delete Staff Member
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>
      }
    >
      <div className="pt-4">
        <div className="p-4 rounded-xl border border-red-200/70 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/10">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            You are about to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || "this user"}
            </span>
            .
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            If you want to block access without deleting the account, edit the user and set Status to Inactive.
          </p>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteStaffDialog;

