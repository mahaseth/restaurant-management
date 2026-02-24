"use client";

// Reusable dialog for both creating and editing a staff user.
// If `user` is null => create new staff user.
// If `user` is provided => edit existing staff user.

import React, { useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN", icon: "pi pi-shield", color: "text-indigo-500" },
  { label: "Manager", value: "MANAGER", icon: "pi pi-briefcase", color: "text-blue-500" },
  { label: "Cashier", value: "CASHIER", icon: "pi pi-dollar", color: "text-emerald-500" },
  { label: "Waiter", value: "WAITER", icon: "pi pi-user", color: "text-amber-500" },
  { label: "Kitchen", value: "KITCHEN", icon: "pi pi-sliders-h", color: "text-rose-500" },
];

const roleItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} ${option.color}`} style={{ fontSize: "0.85rem" }} />
    <span className="font-medium text-sm">{option.label}</span>
  </div>
);

function normalizeRoleValue(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return "WAITER";
  return roles[0];
}

const StaffFormDialog = ({ visible, onHide, onSave, user, saving, actorRoles }) => {
  const isEdit = !!user;

  // Keep this consistent with backend rules.
  const ROLE_RANK = {
    OWNER: 100,
    ADMIN: 90,
    MANAGER: 80,
    CASHIER: 30,
    WAITER: 20,
    KITCHEN: 20,
  };

  const highestRoleRank = (roles) => {
    const list = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    if (list.length === 0) return 0;
    return Math.max(...list.map((r) => ROLE_RANK[r] || 0));
  };

  const allowedRoleOptions = useMemo(() => {
    const rank = highestRoleRank(actorRoles);

    // Owner: can create/admin-promote ADMIN + MANAGER + other staff.
    if (rank >= ROLE_RANK.OWNER) {
      return ROLE_OPTIONS;
    }

    // Admin: can create/promote MANAGER + other staff (no ADMIN).
    if (rank >= ROLE_RANK.ADMIN) {
      return ROLE_OPTIONS.filter((r) => r.value !== "ADMIN");
    }

    // Manager: can create/promote only non-manager staff roles.
    if (rank >= ROLE_RANK.MANAGER) {
      return ROLE_OPTIONS.filter((r) => ["CASHIER", "WAITER", "KITCHEN"].includes(r.value));
    }

    return [];
  }, [actorRoles]);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("WAITER");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");

  // Validation state (kept simple)
  const [submitted, setSubmitted] = useState(false);

  const roleValueTemplate = useMemo(() => roleItemTemplate, []);

  const initializeForm = () => {
    setSubmitted(false);
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(normalizeRoleValue(user.roles));
      setIsActive(user.isActive !== false);
      setPassword(""); // never prefill passwords
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRole("WAITER");
      setIsActive(true);
      setPassword("");
    }
  };

  const nameInvalid = submitted && !name.trim();
  const emailInvalid = submitted && !email.trim();
  const phoneInvalid = submitted && !phone.trim();
  const roleInvalid = submitted && !role;
  const roleNotAllowed = submitted && !!role && !allowedRoleOptions.some((r) => r.value === role);
  const passwordInvalid = submitted && !isEdit && !password;

  const handleSubmit = () => {
    setSubmitted(true);

    if (!name.trim() || !email.trim() || !phone.trim() || !role) return;
    if (!isEdit && !password) return;
    if (!allowedRoleOptions.some((r) => r.value === role)) return;

    // Backend expects: roles: [ROLE]
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      roles: [role],
      isActive,
    };

    // Only send password if user typed something.
    // Backend will re-hash when password is included.
    if (password) payload.password = password;

    onSave(payload);
  };

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
        label={isEdit ? "Save Changes" : "Create Staff"}
        icon={isEdit ? "pi pi-check" : "pi pi-plus"}
        onClick={handleSubmit}
        loading={saving}
        raised
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onShow={initializeForm}
      onHide={onHide}
      footer={footer}
      style={{ width: "min(680px, 95vw)" }}
      header={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center
                          shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
            <i className={`pi ${isEdit ? "pi-user-edit" : "pi-user-plus"} text-white`} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {isEdit ? "Edit Staff Member" : "Add Staff Member"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit ? "Update staff details and permissions." : "Create a new account for your team."}
            </p>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Full Name <span className="text-red-500">*</span>
          </label>
          <InputText
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className={nameInvalid ? "p-invalid" : ""}
          />
          {nameInvalid && <small className="text-red-500">Name is required.</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Phone <span className="text-red-500">*</span>
          </label>
          <InputText
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className={phoneInvalid ? "p-invalid" : ""}
          />
          {phoneInvalid && <small className="text-red-500">Phone is required.</small>}
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Email <span className="text-red-500">*</span>
          </label>
          <InputText
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. staff@restaurant.com"
            className={emailInvalid ? "p-invalid" : ""}
          />
          {emailInvalid && <small className="text-red-500">Email is required.</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Role <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={role}
            onChange={(e) => setRole(e.value)}
            options={allowedRoleOptions}
            optionLabel="label"
            optionValue="value"
            itemTemplate={roleItemTemplate}
            valueTemplate={roleValueTemplate}
            placeholder="Select a role"
            className={`w-full ${roleInvalid || roleNotAllowed ? "p-invalid" : ""}`}
          />
          {roleInvalid && <small className="text-red-500">Role is required.</small>}
          {roleNotAllowed && <small className="text-red-500">You are not allowed to assign this role.</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Status
          </label>
          <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                            bg-gray-50/70 dark:bg-gray-900/40">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {isActive ? "Active" : "Inactive"}
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 accent-blue-600"
            />
          </label>
          <small className="text-[12px] text-gray-500 dark:text-gray-400">
            Inactive users can still exist, but should not access staff tools.
          </small>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {isEdit ? "New Password" : "Password"} {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <InputText
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}
            className={passwordInvalid ? "p-invalid" : ""}
          />
          {passwordInvalid && <small className="text-red-500">Password is required for new staff.</small>}
        </div>
      </div>
    </Dialog>
  );
};

export default StaffFormDialog;

