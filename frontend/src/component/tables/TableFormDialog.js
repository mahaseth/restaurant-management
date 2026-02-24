"use client";

// Reusable dialog for both creating and editing a table.
// I pass `table` prop to pre-fill the form when editing.
// If `table` is null, it means I'm creating a new one.

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

// Dropdown options for table status
const statusOptions = [
  { label: "Active", value: "ACTIVE", icon: "pi pi-check-circle", color: "text-emerald-500" },
  { label: "Inactive", value: "INACTIVE", icon: "pi pi-times-circle", color: "text-red-500" },
  { label: "Reserved", value: "RESERVED", icon: "pi pi-clock", color: "text-amber-500" },
];

// Custom template for the status dropdown items
const statusItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} ${option.color}`} style={{ fontSize: "0.8rem" }} />
    <span className="font-medium text-sm">{option.label}</span>
  </div>
);

const TableFormDialog = ({ visible, onHide, onSave, table, saving }) => {
  const isEdit = !!table;

  // Form state
  const [tableNumber, setTableNumber] = useState(null);
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState("ACTIVE");

  const initializeForm = () => {
    if (table) {
      setTableNumber(table.tableNumber);
      setCapacity(table.capacity);
      setStatus(table.status);
      return;
    }
    setTableNumber(null);
    setCapacity(4);
    setStatus("ACTIVE");
  };

  // Simple validation before saving
  const handleSubmit = () => {
    if (!tableNumber || tableNumber < 1) return;
    if (!capacity || capacity < 1) return;
    onSave({ tableNumber, capacity, status });
  };

  // Footer buttons
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
        label={isEdit ? "Save Changes" : "Create Table"}
        icon={isEdit ? "pi pi-check" : "pi pi-plus"}
        onClick={handleSubmit}
        loading={saving}
        raised
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex items-center gap-3.5">
          {/* Gradient icon badge */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
            ${isEdit
              ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25"
              : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25"
            } ring-4 ${isEdit ? "ring-amber-500/10" : "ring-blue-500/10"}`}>
            <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus"} text-white`} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">
              {isEdit ? "Edit Table" : "Add New Table"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
              {isEdit ? "Update the table details below" : "Fill in the details to create a new table"}
            </p>
          </div>
        </div>
      }
      visible={visible}
      onShow={initializeForm}
      onHide={onHide}
      footer={footer}
      style={{ width: "480px" }}
      modal
      draggable={false}
    >
      <div className="flex flex-col gap-6 pt-5">

        {/* Table Number */}
        <div className="flex flex-col gap-2">
          <label htmlFor="tableNumber" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30
                            flex items-center justify-center">
              <i className="pi pi-hashtag text-blue-500 dark:text-blue-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Table Number
            </span>
            <span className="text-red-400 text-xs">*</span>
          </label>
          <InputNumber
            id="tableNumber"
            value={tableNumber}
            onValueChange={(e) => setTableNumber(e.value)}
            min={1}
            placeholder="e.g. 1, 2, 3..."
            className="w-full"
          />
          <small className="text-gray-400 dark:text-gray-500 text-xs ml-0.5">
            Must be unique across your restaurant
          </small>
        </div>

        {/* Seating Capacity */}
        <div className="flex flex-col gap-2">
          <label htmlFor="capacity" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/30
                            flex items-center justify-center">
              <i className="pi pi-users text-violet-500 dark:text-violet-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Seating Capacity
            </span>
            <span className="text-red-400 text-xs">*</span>
          </label>
          <InputNumber
            id="capacity"
            value={capacity}
            onValueChange={(e) => setCapacity(e.value)}
            min={1}
            max={50}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            placeholder="Number of seats"
            className="w-full"
          />
          <small className="text-gray-400 dark:text-gray-500 text-xs ml-0.5">
            How many people can sit at this table (1-50)
          </small>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30
                            flex items-center justify-center">
              <i className="pi pi-circle-fill text-emerald-500 dark:text-emerald-400" style={{ fontSize: "0.4rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Status
            </span>
          </label>
          <Dropdown
            id="status"
            value={status}
            options={statusOptions}
            onChange={(e) => setStatus(e.value)}
            itemTemplate={statusItemTemplate}
            className="w-full"
          />
          <small className="text-gray-400 dark:text-gray-500 text-xs ml-0.5">
            Set the current availability of this table
          </small>
        </div>

      </div>
    </Dialog>
  );
};

export default TableFormDialog;
