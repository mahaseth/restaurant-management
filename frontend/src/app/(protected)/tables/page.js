"use client";

// Tables Page - where the restaurant manager can manage dining tables.
// Supports: viewing all tables, adding new ones, editing, deleting,
// and viewing/downloading QR codes.
// I'm using PrimeReact's DataTable for the table list,
// and separate dialog components for add/edit/delete/QR.

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

// PrimeReact components
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";

// My Redux actions
import {
  fetchTables,
  addTable,
  editTable,
  removeTable,
} from "@/redux/tables/tableActions";

// My modular dialog components
import TableFormDialog from "@/component/tables/TableFormDialog";
import DeleteTableDialog from "@/component/tables/DeleteTableDialog";
import QrCodeDialog from "@/component/tables/QrCodeDialog";

const TablesPage = () => {
  const dispatch = useDispatch();
  const { tables, loading } = useSelector((state) => state.tables);

  // Which dialog is open
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // The table I'm currently editing / deleting / viewing QR for
  const [selectedTable, setSelectedTable] = useState(null);

  // Loading states for save and delete buttons
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search input value
  const [search, setSearch] = useState("");

  // Fetch tables when the page loads
  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  // =====================
  // Dialog open handlers
  // =====================

  const openAddDialog = () => {
    setSelectedTable(null); // null means "create new"
    setShowForm(true);
  };

  const openEditDialog = (table) => {
    setSelectedTable(table);
    setShowForm(true);
  };

  const openDeleteDialog = (table) => {
    setSelectedTable(table);
    setShowDelete(true);
  };

  const openQrDialog = (table) => {
    setSelectedTable(table);
    setShowQr(true);
  };

  // =====================
  // Save handler (create or edit)
  // =====================

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selectedTable) {
        await dispatch(editTable({ id: selectedTable._id, ...formData })).unwrap();
        toast.success("Table updated successfully");
      } else {
        await dispatch(addTable(formData)).unwrap();
        toast.success("Table created successfully");
      }
      setShowForm(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Something went wrong"));
    } finally {
      setSaving(false);
    }
  };

  // =====================
  // Delete handler
  // =====================

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(removeTable(selectedTable._id)).unwrap();
      toast.success("Table deleted successfully");
      setShowDelete(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Failed to delete table"));
    } finally {
      setDeleting(false);
    }
  };

  // =====================
  // Column body templates
  // =====================

  // Table number shown as a rich badge with identifier
  const tableNumberTemplate = (rowData) => (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                      flex items-center justify-center shadow-md shadow-blue-500/20
                      ring-2 ring-blue-400/10">
        <span className="text-white font-bold text-sm">
          {String(rowData.tableNumber).padStart(2, "0")}
        </span>
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
          Table {rowData.tableNumber}
        </p>
        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
          Dining area
        </p>
      </div>
    </div>
  );

  // Capacity shown with a visual mini-bar indicator
  const capacityTemplate = (rowData) => {
    // Show a little fill bar — max 12 for visual scale
    const fillPercent = Math.min((rowData.capacity / 12) * 100, 100);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20
                          flex items-center justify-center">
            <i className="pi pi-users text-violet-500 dark:text-violet-400" style={{ fontSize: "0.7rem" }} />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{rowData.capacity}</span>
          <span className="text-gray-400 text-xs">{rowData.capacity === 1 ? "seat" : "seats"}</span>
        </div>
        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500 transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    );
  };

  // Status as a beautifully styled pill with a dot indicator
  const statusTemplate = (rowData) => {
    const cfg = {
      ACTIVE: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-700 dark:text-emerald-400",
        dot: "bg-emerald-500",
        border: "border-emerald-200/60 dark:border-emerald-700/30",
        label: "Active",
      },
      INACTIVE: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-400",
        dot: "bg-red-500",
        border: "border-red-200/60 dark:border-red-700/30",
        label: "Inactive",
      },
      RESERVED: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-400",
        dot: "bg-amber-500",
        border: "border-amber-200/60 dark:border-amber-700/30",
        label: "Reserved",
      },
    };
    const s = cfg[rowData.status] || cfg.ACTIVE;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                         border ${s.bg} ${s.text} ${s.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse-slow`} />
        {s.label}
      </span>
    );
  };

  // QR code as a clickable thumbnail with hover overlay
  const qrTemplate = (rowData) => {
    if (!rowData.qrCode) {
      return (
        <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed
                        border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <i className="pi pi-qrcode text-gray-300 dark:text-gray-600" style={{ fontSize: "0.85rem" }} />
        </div>
      );
    }
    return (
      <div
        className="relative w-12 h-12 rounded-xl cursor-pointer group
                   transition-all duration-250"
        onClick={() => openQrDialog(rowData)}
      >
        {/* Outer ring that lights up on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                        opacity-0 group-hover:opacity-100 transition-opacity duration-250 blur-sm scale-110" />
        {/* White card holding the QR */}
        <div className="relative w-full h-full rounded-xl bg-white dark:bg-gray-800
                        border-2 border-gray-100 dark:border-gray-600
                        group-hover:border-indigo-300 dark:group-hover:border-indigo-500
                        shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/15
                        transition-all duration-250 overflow-hidden p-1">
          <img src={rowData.qrCode} alt="QR" className="w-full h-full rounded-md object-contain" />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10
                          dark:group-hover:bg-indigo-400/10
                          flex items-center justify-center transition-all duration-250 rounded-lg">
            <i className="pi pi-eye text-indigo-600 dark:text-indigo-400 opacity-0
                          group-hover:opacity-100 transition-opacity duration-200
                          drop-shadow-sm" style={{ fontSize: "0.8rem" }} />
          </div>
        </div>
      </div>
    );
  };

  // Date formatted with relative time hint
  const dateTemplate = (rowData) => {
    const date = new Date(rowData.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    let relativeText = "";
    if (diffDays === 0) relativeText = "Today";
    else if (diffDays === 1) relativeText = "Yesterday";
    else if (diffDays < 7) relativeText = `${diffDays} days ago`;
    else if (diffDays < 30) relativeText = `${Math.floor(diffDays / 7)}w ago`;
    else relativeText = `${Math.floor(diffDays / 30)}mo ago`;

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <i className="pi pi-clock" style={{ fontSize: "0.55rem" }} />
          {relativeText}
        </span>
      </div>
    );
  };

  // Action buttons with nice hover backgrounds
  const actionsTemplate = (rowData) => (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => openQrDialog(rowData)}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                   transition-all duration-150"
        title="View QR Code"
      >
        <i className="pi pi-qrcode" style={{ fontSize: "0.85rem" }} />
      </button>
      <button
        onClick={() => openEditDialog(rowData)}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20
                   transition-all duration-150"
        title="Edit Table"
      >
        <i className="pi pi-pencil" style={{ fontSize: "0.85rem" }} />
      </button>
      <button
        onClick={() => openDeleteDialog(rowData)}
        className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                   transition-all duration-150"
        title="Delete Table"
      >
        <i className="pi pi-trash" style={{ fontSize: "0.85rem" }} />
      </button>
    </div>
  );

  // =====================
  // Summary card data
  // =====================

  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "ACTIVE").length;
  const reservedTables = tables.filter((t) => t.status === "RESERVED").length;
  const inactiveTables = tables.filter((t) => t.status === "INACTIVE").length;
  const totalSeats = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);

  const summaryCards = [
    {
      label: "Total Tables", value: totalTables, icon: "pi pi-th-large",
      gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20",
      accent: "border-l-blue-500",
    },
    {
      label: "Active", value: activeTables, icon: "pi pi-check-circle",
      gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20",
      accent: "border-l-emerald-500",
    },
    {
      label: "Reserved", value: reservedTables, icon: "pi pi-clock",
      gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20",
      accent: "border-l-amber-500",
    },
    {
      label: "Total Seats", value: totalSeats, icon: "pi pi-users",
      gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20",
      accent: "border-l-violet-500",
    },
  ];

  // =====================
  // Filtered tables based on search
  // =====================

  const filteredTables = tables.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(t.tableNumber).includes(q) ||
      t.status.toLowerCase().includes(q) ||
      String(t.capacity).includes(q)
    );
  });

  // =====================
  // Loading skeleton cards
  // =====================

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800/80 rounded-2xl p-5
                                border border-gray-200 dark:border-gray-700/50
                                border-l-4 border-l-gray-300 dark:border-l-gray-600
                                shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
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
  // Empty state - beautiful and inviting
  // =====================

  const emptyMessage = (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      {/* Decorative icon stack */}
      <div className="relative">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100
                        dark:from-blue-900/20 dark:to-indigo-900/20
                        flex items-center justify-center
                        border border-blue-200/50 dark:border-blue-700/30
                        shadow-lg shadow-blue-500/5">
          <i className="pi pi-th-large text-5xl text-blue-400/60 dark:text-blue-500/40" />
        </div>
        {/* Floating decorative dots */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400/20 dark:bg-amber-400/10
                        border border-amber-300/30 dark:border-amber-600/20" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-emerald-400/20 dark:bg-emerald-400/10
                        border border-emerald-300/30 dark:border-emerald-600/20" />
      </div>

      <div className="text-center max-w-sm">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {search ? "No matching tables" : "No tables yet"}
        </p>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {search
            ? "We couldn't find any tables matching your search. Try a different keyword."
            : "Create your first dining table to start managing your restaurant seating layout and QR codes."}
        </p>
      </div>

      {!search && (
        <Button
          label="Create First Table"
          icon="pi pi-plus"
          onClick={openAddDialog}
          raised
          className="mt-1"
        />
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
            <i className="pi pi-th-large text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Tables Management
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage your restaurant seating, dining areas & QR codes
            </p>
          </div>
        </div>
        <Button
          label="Add Table"
          icon="pi pi-plus"
          onClick={openAddDialog}
          raised
          className="shadow-md shadow-blue-500/20"
        />
      </div>

      {/* ===== Summary Cards ===== */}
      {loading ? renderSkeletonCards() : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div
              key={card.label}
              className={`bg-white dark:bg-gray-800/80 rounded-2xl p-5
                          border border-gray-200 dark:border-gray-700/50
                          border-l-4 ${card.accent}
                          shadow-[0_1px_4px_rgba(0,0,0,0.06)]
                          hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                          cursor-default group animate-fade-in-up`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient}
                                flex items-center justify-center shadow-md ${card.shadow}
                                group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${card.icon} text-white text-sm`} />
                </div>
                {/* Subtle trend arrow — decorative */}
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50
                                flex items-center justify-center opacity-0 group-hover:opacity-100
                                transition-opacity duration-300">
                  <i className="pi pi-arrow-up-right text-gray-400" style={{ fontSize: "0.65rem" }} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                {card.value}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 font-semibold uppercase tracking-widest">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ===== Table Section ===== */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl
                      border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Toolbar — search bar + refresh + count badge */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/50
                        flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50
                            flex items-center justify-center">
              <i className="pi pi-list text-gray-400" style={{ fontSize: "0.8rem" }} />
            </div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              All Tables
            </h2>
            {filteredTables.length > 0 && (
              <span className="text-[11px] font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500
                              px-2.5 py-0.5 rounded-full shadow-sm shadow-blue-500/20">
                {filteredTables.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search bar */}
            <div className="relative flex-1 sm:flex-none group">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                            group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by number, status, capacity..."
                className="w-full sm:w-72 pl-9 pr-9 py-2.5 text-sm rounded-xl
                           border border-gray-200 dark:border-gray-600
                           bg-gray-50/80 dark:bg-gray-900 text-gray-700 dark:text-gray-200
                           placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800
                           transition-all duration-200"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-red-500 transition-colors duration-150">
                  <i className="pi pi-times text-xs" />
                </button>
              )}
            </div>

            {/* Refresh button */}
            <button onClick={() => dispatch(fetchTables())}
              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-gray-50/80 dark:bg-gray-900 flex items-center justify-center
                         text-gray-400 hover:text-blue-500 hover:border-blue-300
                         hover:bg-blue-50 dark:hover:bg-blue-900/20
                         active:scale-95 transition-all duration-200"
              title="Refresh tables">
              <i className="pi pi-refresh text-sm" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          value={filteredTables}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage={emptyMessage}
          removableSort
          sortField="tableNumber"
          sortOrder={1}
          rowHover
          className="border-none"
          stripedRows
        >
          <Column field="tableNumber" header="Table" sortable body={tableNumberTemplate} style={{ minWidth: "12rem" }} />
          <Column field="capacity" header="Capacity" sortable body={capacityTemplate} style={{ minWidth: "10rem" }} />
          <Column field="status" header="Status" sortable body={statusTemplate} style={{ minWidth: "9rem" }} />
          <Column header="QR Code" body={qrTemplate} style={{ minWidth: "5rem" }} />
          <Column field="createdAt" header="Created" sortable body={dateTemplate} style={{ minWidth: "10rem" }} />
          <Column header="Actions" body={actionsTemplate} style={{ minWidth: "8rem" }} frozen alignFrozen="right" />
        </DataTable>
      </div>

      {/* ===== Dialogs ===== */}
      <TableFormDialog visible={showForm} onHide={() => setShowForm(false)} onSave={handleSave} table={selectedTable} saving={saving} />
      <DeleteTableDialog visible={showDelete} onHide={() => setShowDelete(false)} onConfirm={handleDelete} table={selectedTable} deleting={deleting} />
      <QrCodeDialog visible={showQr} onHide={() => setShowQr(false)} table={selectedTable} />
    </div>
  );
};

export default TablesPage;
