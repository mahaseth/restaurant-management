"use client";

// Staff Page
// - Staff Members: CRUD for restaurant staff users (/api/users)
//
// Goal: modular, simple, readable, professional UI (no emojis).

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

// PrimeReact components
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";

// API
import { createUser, deleteUser, getUsers, updateUser } from "@/api/users";

// Modular components
import StaffFormDialog from "@/component/staff/StaffFormDialog";
import DeleteStaffDialog from "@/component/staff/DeleteStaffDialog";
import ImagePreviewDialog from "@/component/common/ImagePreviewDialog";

const TAB_STAFF = "staff";

const StaffPage = () => {
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user?.user;

  const [activeTab, setActiveTab] = useState(TAB_STAFF);

  // =====================
  // Staff list state
  // =====================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Image preview dialog state (used in Staff Members tab)
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSubtitle, setPreviewSubtitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // =====================
  // Fetch users
  // =====================
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(typeof err?.response?.data === "string" ? err.response.data : (err?.message || "Failed to load staff."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================
  // Open/close dialogs
  // =====================
  const openAddDialog = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDelete(true);
  };

  // =====================
  // Save / Delete handlers
  // =====================
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (selectedUser?._id) {
        await updateUser(selectedUser._id, payload);
        toast.success("Staff member updated.");
      } else {
        await createUser(payload);
        toast.success("Staff member created.");
      }
      setShowForm(false);
      await fetchAllUsers();
    } catch (err) {
      // Backend often returns a string message
      toast.error(typeof err?.response?.data === "string" ? err.response.data : (err?.message || "Failed to save staff."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser?._id) return;
    setDeleting(true);
    try {
      await deleteUser(selectedUser._id);
      toast.success("Staff member deleted.");
      setShowDelete(false);
      await fetchAllUsers();
    } catch (err) {
      toast.error(typeof err?.response?.data === "string" ? err.response.data : (err?.message || "Failed to delete staff."));
    } finally {
      setDeleting(false);
    }
  };

  // =====================
  // Derived data (summary + filtering)
  // =====================
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = (u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const phone = String(u?.phone || "").toLowerCase();
      const roles = Array.isArray(u?.roles) ? u.roles.join(",").toLowerCase() : "";
      return name.includes(q) || email.includes(q) || phone.includes(q) || roles.includes(q);
    });
  }, [users, search]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u?.isActive !== false).length;
  const inactiveUsers = users.filter((u) => u?.isActive === false).length;
  const managers = users.filter((u) => Array.isArray(u?.roles) && u.roles.includes("MANAGER")).length;

  const summaryCards = [
    { label: "Total Staff", value: totalUsers, icon: "pi pi-users", gradient: "from-blue-500 to-indigo-600", accent: "border-l-blue-500" },
    { label: "Active", value: activeUsers, icon: "pi pi-check-circle", gradient: "from-emerald-500 to-teal-600", accent: "border-l-emerald-500" },
    { label: "Inactive", value: inactiveUsers, icon: "pi pi-times-circle", gradient: "from-red-500 to-rose-600", accent: "border-l-red-500" },
    { label: "Managers", value: managers, icon: "pi pi-briefcase", gradient: "from-amber-500 to-orange-500", accent: "border-l-amber-500" },
  ];

  // =====================
  // Column templates
  // =====================

  // Keep the same role hierarchy as the backend guard.
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

  const actorRank = highestRoleRank(currentUser?.roles);
  // Only Owner/Admin/Manager can create or manage staff users.
  const canCreateStaff = actorRank >= ROLE_RANK.MANAGER;
  const isSelfRow = (row) => String(row?._id) === String(currentUser?._id);
  const canManageUser = (targetUser) => {
    // Editing your own account from Staff list is not allowed.
    // Use Settings -> Account to manage your own profile.
    if (isSelfRow(targetUser)) return false;
    return actorRank >= highestRoleRank(targetUser?.roles);
  };

  const staffTemplate = (row) => {
    const name = row?.name || "Unknown";
    const email = row?.email || "";
    const isMe = String(row?._id) === String(currentUser?._id);
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                      flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-400/10 overflow-hidden
                      ${row?.profileImageUrl ? "cursor-pointer hover:brightness-[1.03] active:scale-[0.98]" : "cursor-default"}`}
          disabled={!row?.profileImageUrl}
          onClick={() => {
            if (!row?.profileImageUrl) return;
            setPreviewTitle(`${name} - Profile Photo`);
            setPreviewSubtitle(email);
            setPreviewUrl(row.profileImageUrl);
            setShowImagePreview(true);
          }}
          title={row?.profileImageUrl ? "Click to preview" : "No image"}
        >
          {row?.profileImageUrl ? (
            <img src={row.profileImageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">{initials}</span>
          )}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{name}</p>
            {isMe && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full
                               bg-blue-50 dark:bg-blue-900/25
                               text-blue-700 dark:text-blue-300
                               border border-blue-200/70 dark:border-blue-700/30
                               shrink-0">
                You
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">{email}</p>
        </div>
      </div>
    );
  };

  const roleTemplate = (row) => {
    const role = Array.isArray(row?.roles) && row.roles.length ? row.roles[0] : "STAFF";
    const cfg = {
      ADMIN: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-700/30",
      OWNER: "bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/30",
      MANAGER: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/30",
      CASHIER: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/30",
      WAITER: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/30",
      KITCHEN: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/30",
    };
    const cls = cfg[role] || cfg.MANAGER;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        {String(role).replaceAll("_", " ")}
      </span>
    );
  };

  const statusTemplate = (row) => {
    const active = row?.isActive !== false;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
          ${active
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/30"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-700/30"
          }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"} animate-pulse-slow`} />
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  const createdTemplate = (row) => {
    if (!row?.createdAt) return "-";
    const d = new Date(row.createdAt);
    return (
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
    );
  };

  const actionsTemplate = (row) => (
    <div className="flex items-center gap-0.5">
      {canCreateStaff && canManageUser(row) && (
        <button
          onClick={() => openEditDialog(row)}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20
                     transition-all duration-150"
          title="Edit"
        >
          <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
        </button>
      )}

      {/* Never allow deleting your own account, and never show delete for higher roles */}
      {canCreateStaff && canManageUser(row) && String(row?._id) !== String(currentUser?._id) && (
        <button
          onClick={() => openDeleteDialog(row)}
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                     transition-all duration-150"
          title="Delete"
        >
          <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
        </button>
      )}
    </div>
  );

  // =====================
  // Skeleton summary cards
  // =====================
  const renderSkeletonCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="menu-stat-card rounded-2xl p-4 border-l-4 border-l-gray-300 dark:border-l-gray-600">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="2.5rem" height="2.5rem" className="rounded-xl" />
          </div>
          <Skeleton width="3rem" height="2rem" className="mb-3" />
          <Skeleton width="6rem" height="0.7rem" />
        </div>
      ))}
    </div>
  );

  // =====================
  // Empty state
  // =====================
  const emptyMessage = (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100
                      dark:from-blue-900/20 dark:to-indigo-900/20
                      flex items-center justify-center
                      border border-blue-200/50 dark:border-blue-700/30
                      shadow-lg shadow-blue-500/5">
        <i className="pi pi-users text-5xl text-blue-400/60 dark:text-blue-500/40" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {search ? "No matching staff" : "No staff members yet"}
        </p>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {search
            ? "Try a different search term."
            : "Create your first staff member to manage roles and access for your restaurant team."}
        </p>
      </div>
      {!search && canCreateStaff && (
        <Button label="Add Staff" icon="pi pi-plus" onClick={openAddDialog} raised />
      )}
    </div>
  );

  // =====================
  // Render
  // =====================
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                      bg-white dark:bg-gray-800/80 rounded-2xl p-5
                      border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center shadow-lg shadow-blue-500/25
                          ring-4 ring-blue-500/10">
            <i className="pi pi-users text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Staff Management
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage staff accounts and roles
            </p>
          </div>
        </div>

        {activeTab === TAB_STAFF && canCreateStaff && (
          <Button
            label="Add Staff"
            icon="pi pi-plus"
            onClick={openAddDialog}
            raised
            className="shadow-md shadow-blue-500/20"
          />
        )}
      </div>

      {/* ===== Tabs ===== */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2
            ${activeTab === TAB_STAFF
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
              : "bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-700/50 hover:border-blue-300"
            }`}
          onClick={() => setActiveTab(TAB_STAFF)}
        >
          <i className="pi pi-users" />
          Staff Members
        </button>
      </div>

      {/* ===== Staff Members Tab ===== */}
      {activeTab === TAB_STAFF && (
        <>
          {/* Summary Cards */}
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

          {/* Staff table */}
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl
                          border border-gray-200 dark:border-gray-700/50
                          shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/50
                            flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                  <i className="pi pi-list text-gray-400" style={{ fontSize: "0.8rem" }} />
                </div>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Staff Members
                </h2>
                {filteredUsers.length > 0 && (
                  <span className="text-[11px] font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500
                                  px-2.5 py-0.5 rounded-full shadow-sm shadow-blue-500/20">
                    {filteredUsers.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none group">
                  <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                                group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, phone, role..."
                    className="w-full sm:w-80 pl-9 pr-9 py-2.5 text-sm rounded-xl
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

                {/* Refresh */}
                <button
                  onClick={fetchAllUsers}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-600
                             bg-gray-50/80 dark:bg-gray-900 flex items-center justify-center
                             text-gray-400 hover:text-blue-500 hover:border-blue-300
                             hover:bg-blue-50 dark:hover:bg-blue-900/20
                             active:scale-95 transition-all duration-200"
                  title="Refresh staff list"
                >
                  <i className="pi pi-refresh text-sm" />
                </button>
              </div>
            </div>

            <DataTable
              value={filteredUsers}
              loading={loading}
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
              <Column header="Staff" body={staffTemplate} style={{ minWidth: "16rem" }} />
              <Column field="phone" header="Phone" sortable style={{ minWidth: "10rem" }} />
              <Column header="Role" body={roleTemplate} style={{ minWidth: "9rem" }} />
              <Column header="Status" body={statusTemplate} style={{ minWidth: "9rem" }} />
              <Column field="createdAt" header="Created" sortable body={createdTemplate} style={{ minWidth: "10rem" }} />
              <Column header="Actions" body={actionsTemplate} style={{ minWidth: "7rem" }} frozen alignFrozen="right" />
            </DataTable>
          </div>

          {/* Dialogs */}
          <StaffFormDialog
            visible={showForm}
            onHide={() => setShowForm(false)}
            onSave={handleSave}
            user={selectedUser}
            saving={saving}
            actorRoles={currentUser?.roles}
          />
          <DeleteStaffDialog
            visible={showDelete}
            onHide={() => setShowDelete(false)}
            onConfirm={handleDelete}
            user={selectedUser}
            deleting={deleting}
          />
        </>
      )}

      <ImagePreviewDialog
        visible={showImagePreview}
        onHide={() => setShowImagePreview(false)}
        title={previewTitle}
        subtitle={previewSubtitle}
        imageUrl={previewUrl}
      />
    </div>
  );
};

export default StaffPage;