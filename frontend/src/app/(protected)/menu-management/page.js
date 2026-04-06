"use client";

// Menu Management Page — brand-themed (navy + cyan/teal) 3D UI
// with glows, floating decor, bold clear cards, restaurant vibe.

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

// PrimeReact
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";

// Redux
import {
  fetchMenuItems,
  addMenuItem,
  editMenuItem,
  removeMenuItem,
  replaceMenuItemImage,
  removeMenuItemImage,
} from "@/redux/menu/menuActions";

// Dialogs
import MenuItemFormDialog from "@/component/menu/MenuItemFormDialog";
import DeleteMenuItemDialog from "@/component/menu/DeleteMenuItemDialog";

// =====================
// Category config
// =====================
const CATEGORIES = {
  all: {
    label: "All Items", emoji: "🍽️",
    gradient: "from-slate-500 to-gray-600",
    color: "#64748b", colorEnd: "#475569",
    glow: "rgba(100,116,139,0.35)", glowDark: "rgba(148,163,184,0.2)",
    lightText: "text-gray-600 dark:text-gray-400",
  },
  appetizer: {
    label: "Appetizers", emoji: "🥗",
    gradient: "from-amber-500 to-orange-500",
    color: "#f59e0b", colorEnd: "#f97316",
    glow: "rgba(245,158,11,0.4)", glowDark: "rgba(245,158,11,0.25)",
    lightText: "text-amber-700 dark:text-amber-400",
  },
  main: {
    label: "Main Course", emoji: "🥩",
    gradient: "from-orange-500 to-red-500",
    color: "#f97316", colorEnd: "#ef4444",
    glow: "rgba(249,115,22,0.4)", glowDark: "rgba(249,115,22,0.25)",
    lightText: "text-orange-700 dark:text-orange-400",
  },
  dessert: {
    label: "Desserts", emoji: "🍰",
    gradient: "from-pink-500 to-rose-500",
    color: "#ec4899", colorEnd: "#f43f5e",
    glow: "rgba(236,72,153,0.4)", glowDark: "rgba(236,72,153,0.25)",
    lightText: "text-pink-700 dark:text-pink-400",
  },
  drink: {
    label: "Drinks", emoji: "🍹",
    gradient: "from-blue-500 to-cyan-500",
    color: "#3b82f6", colorEnd: "#06b6d4",
    glow: "rgba(59,130,246,0.4)", glowDark: "rgba(59,130,246,0.25)",
    lightText: "text-blue-700 dark:text-blue-400",
  },
  side: {
    label: "Sides", emoji: "🍟",
    gradient: "from-emerald-500 to-teal-500",
    color: "#10b981", colorEnd: "#14b8a6",
    glow: "rgba(16,185,129,0.4)", glowDark: "rgba(16,185,129,0.25)",
    lightText: "text-emerald-700 dark:text-emerald-400",
  },
};

// =====================
// 3D Tilt Card wrapper
// =====================
const TiltCard = ({ children, className = "", style = {} }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -12,
      y: (x - 0.5) * 12,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  }, []);

  return (
    <div
      className={`menu-tilt-card ${className}`}
      style={{
        ...style,
        transform: isHovering
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Specular highlight following cursor */}
      <div
        className="menu-tilt-shine"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(circle at ${(tilt.y / 12 + 0.5) * 100}% ${(-tilt.x / 12 + 0.5) * 100}%, rgba(34,211,238,0.1) 0%, rgba(255,255,255,0.08) 30%, transparent 60%)`,
        }}
      />
    </div>
  );
};

// =====================
// Main component
// =====================
const MenuManagementPage = () => {
  const dispatch = useDispatch();
  const { menuItems, loading } = useSelector((state) => state.menu);

  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  // ---- Handlers ----
  const openAddDialog = () => { setSelectedItem(null); setShowForm(true); };
  const openEditDialog = (item) => { setSelectedItem(item); setShowForm(true); };
  const openDeleteDialog = (item) => { setSelectedItem(item); setShowDelete(true); };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selectedItem) {
        await dispatch(editMenuItem({ id: selectedItem._id, ...formData })).unwrap();
        toast.success("Menu item updated successfully");
      } else {
        await dispatch(addMenuItem(formData)).unwrap();
        toast.success("Menu item created successfully");
      }
      setShowForm(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Something went wrong"));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(removeMenuItem(selectedItem._id)).unwrap();
      toast.success("Menu item deleted successfully");
      setShowDelete(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Failed to delete item"));
    } finally { setDeleting(false); }
  };

  const handleReplaceImage = async (file) => {
    if (!selectedItem?._id || !file) return null;
    setImageBusy(true);
    try {
      const updated = await dispatch(replaceMenuItemImage({ id: selectedItem._id, file })).unwrap();
      setSelectedItem(updated);
      toast.success("Image updated.");
      return updated?.image || "";
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Failed to update image"));
      return null;
    } finally {
      setImageBusy(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedItem?._id) return false;
    setImageBusy(true);
    try {
      const updated = await dispatch(removeMenuItemImage(selectedItem._id)).unwrap();
      setSelectedItem(updated);
      toast.success("Image removed.");
      return true;
    } catch (err) {
      toast.error(typeof err === "string" ? err : (err?.error || "Failed to delete image"));
      return false;
    } finally {
      setImageBusy(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await dispatch(editMenuItem({ id: item._id, available: !item.available })).unwrap();
      toast.success(`${item.name} is now ${!item.available ? "available" : "unavailable"}`);
    } catch { toast.error("Failed to update availability"); }
  };

  // ---- Computed ----
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    Object.keys(CATEGORIES).forEach((key) => {
      if (key !== "all") counts[key] = menuItems.filter((i) => i.category === key).length;
    });
    return counts;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) || String(item.price).includes(q);
    });
  }, [menuItems, activeCategory, search]);

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter((i) => i.available).length;
  const unavailableItems = menuItems.filter((i) => !i.available).length;
  const avgPrice = totalItems > 0
    ? (menuItems.reduce((s, i) => s + (i.price || 0), 0) / totalItems).toFixed(2) : "0.00";

  const summaryCards = [
    { label: "Total Dishes", value: totalItems, icon: "pi pi-book", emoji: "📋",
      gradient: "from-sky-500 to-cyan-600", glow: "rgba(14,165,233,0.35)",
      accent: "border-l-sky-500" },
    { label: "Available", value: availableItems, icon: "pi pi-check-circle", emoji: "✅",
      gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.35)",
      accent: "border-l-emerald-500" },
    { label: "Unavailable", value: unavailableItems, icon: "pi pi-times-circle", emoji: "⏸️",
      gradient: "from-red-500 to-rose-600", glow: "rgba(239,68,68,0.35)",
      accent: "border-l-red-500" },
    { label: "Avg. Price", value: `$${avgPrice}`, icon: "pi pi-dollar", emoji: "💰",
      gradient: "from-cyan-500 to-teal-500", glow: "rgba(6,182,212,0.35)",
      accent: "border-l-cyan-500" },
  ];

  // ---- Skeletons ----
  const renderSkeletonCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="menu-solid-card rounded-2xl p-5 border-l-4 border-l-gray-300 dark:border-l-gray-600">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="2.5rem" height="2.5rem" className="rounded-xl" />
          </div>
          <Skeleton width="3rem" height="2rem" className="mb-3" />
          <Skeleton width="6rem" height="0.7rem" />
        </div>
      ))}
    </div>
  );

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="menu-solid-card rounded-2xl overflow-hidden">
          <Skeleton width="100%" height="11rem" className="!rounded-none" />
          <div className="p-5 flex flex-col gap-3">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="100%" height="0.7rem" />
            <Skeleton width="40%" height="1.2rem" />
          </div>
        </div>
      ))}
    </div>
  );

  // ---- Empty state ----
  const renderEmptyState = () => (
    <div className="menu-solid-card rounded-3xl p-16 flex flex-col items-center justify-center gap-8
                    relative overflow-hidden">
      {/* Ambient floating orbs */}
      <div className="menu-float-orb menu-float-orb-1" />
      <div className="menu-float-orb menu-float-orb-2" />
      <div className="menu-float-orb menu-float-orb-3" />

      {/* Floating restaurant decor */}
      <div className="menu-deco menu-deco-1">🍴</div>
      <div className="menu-deco menu-deco-2">🍷</div>
      <div className="menu-deco menu-deco-3">🧑‍🍳</div>
      <div className="menu-deco menu-deco-4">🍕</div>

      {/* 3D floating plate */}
      <div className="relative z-10">
        <div className="menu-3d-icon-wrapper">
          <div className="menu-3d-icon bg-gradient-to-br from-sky-500 to-cyan-600">
            <span className="text-4xl">🍽️</span>
          </div>
          <div className="menu-3d-icon-shadow" />
        </div>
      </div>

      <div className="text-center max-w-md relative z-10">
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {search || activeCategory !== "all" ? "No matching items" : "Your menu is empty"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          {search || activeCategory !== "all"
            ? "Try adjusting your search or category filter to find what you're looking for."
            : "Start building your restaurant menu by adding your first signature dish. Your guests are waiting!"}
        </p>
      </div>

      {!search && activeCategory === "all" && (
        <Button label="Add First Dish" icon="pi pi-plus" onClick={openAddDialog} raised
          className="mt-2 relative z-10 shadow-lg shadow-sky-500/25" />
      )}
    </div>
  );

  // ---- Menu card ----
  const renderMenuCard = (item, index) => {
    const cat = CATEGORIES[item.category] || CATEGORIES.main;

    return (
      <TiltCard
        key={item._id}
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="group menu-item-card rounded-2xl overflow-hidden flex flex-col h-full
                        transition-all duration-300">

          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              /* Animated gradient mesh placeholder */
              <div className="w-full h-full menu-placeholder-bg relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-[0.06]
                                dark:opacity-[0.12]`} />
                <div className="menu-deco-lines" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="menu-3d-float">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.gradient}
                                    flex items-center justify-center
                                    rotate-6 group-hover:rotate-0 transition-all duration-500`}
                         style={{ boxShadow: `0 12px 40px ${cat.glow}, inset 0 -3px 6px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.2)` }}>
                      <span className="text-3xl">{cat.emoji}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom gradient veil */}
            <div className="absolute inset-x-0 bottom-0 h-16
                            bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

            {/* Price badge */}
            <div className="absolute bottom-3 left-3">
              <span className="menu-price-3d inline-flex items-center px-3 py-1.5 rounded-lg
                              text-sm font-extrabold">
                ${item.price?.toFixed(2)}
              </span>
            </div>

            {/* Availability toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleAvailability(item); }}
              className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold
                          cursor-pointer transition-all duration-300
                          ${item.available
                            ? "menu-avail-on text-white"
                            : "menu-avail-off text-white"
                          }`}
              title={item.available ? "Mark unavailable" : "Mark available"}
            >
              {item.available ? "Available" : "Unavailable"}
            </button>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
                            opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
          </div>

          {/* Content */}
          <div className="px-4 pb-4 pt-3.5 flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug
                             line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400
                             transition-colors duration-300">
                {item.name}
              </h3>
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100
                              transition-opacity duration-200">
                <button onClick={() => openEditDialog(item)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400
                             hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30
                             transition-all duration-150 cursor-pointer"
                  title="Edit">
                  <i className="pi pi-pencil" style={{ fontSize: "0.7rem" }} />
                </button>
                <button onClick={() => openDeleteDialog(item)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400
                             hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30
                             transition-all duration-150 cursor-pointer"
                  title="Delete">
                  <i className="pi pi-trash" style={{ fontSize: "0.7rem" }} />
                </button>
              </div>
            </div>

            {/* Description — readable, proper size & contrast */}
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-[1.6] line-clamp-3 min-h-[3.2rem]">
              {item.description || "No description available."}
            </p>

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-auto pt-3
                            border-t border-gray-200/80 dark:border-white/8">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full
                  ${item.available
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  } animate-pulse-slow`} />
                <span className={`text-[11px] font-semibold ${item.available
                  ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {item.available ? "In Stock" : "Sold Out"}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                {CATEGORIES[item.category]?.label || item.category}
              </span>
            </div>
          </div>
        </div>
      </TiltCard>
    );
  };

  // =====================
  // Render
  // =====================
  return (
    <div className="flex flex-col gap-5 animate-fade-in-up menu-page-wrapper relative">

      {/* Ambient background orbs */}
      <div className="menu-ambient-bg">
        <div className="menu-ambient-orb menu-ambient-orb-1" />
        <div className="menu-ambient-orb menu-ambient-orb-2" />
        <div className="menu-ambient-orb menu-ambient-orb-3" />
      </div>

      {/* ===== Header ===== */}
      <div className="menu-hero-header rounded-2xl px-6 py-5 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full
                        bg-cyan-500/12 dark:bg-cyan-500/8 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="menu-header-icon">
              <div className="menu-header-icon-3d w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600
                              flex items-center justify-center">
                <span className="text-lg">🍽️</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Menu Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5 max-w-xl">
                Manage dishes, prices & categories. Changes sync automatically to the guest AI chat (AI Studio).
              </p>
            </div>
          </div>
          <Button label="Add Dish" icon="pi pi-plus" onClick={openAddDialog} raised
            className="shadow-lg shadow-sky-500/20 dark:shadow-cyan-500/15 relative z-10" />
        </div>
      </div>

      {/* ===== Summary Cards ===== */}
      {loading ? renderSkeletonCards() : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div key={card.label} className={`menu-stat-card rounded-2xl p-4 border-l-4 ${card.accent}
                            cursor-default group relative overflow-hidden animate-fade-in-up`}
                 style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className={`menu-stat-icon w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient}
                                flex items-center justify-center flex-shrink-0
                                group-hover:scale-110 transition-transform duration-400`}
                     style={{ boxShadow: `0 6px 18px ${card.glow}` }}>
                  <span className="text-sm">{card.emoji}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase
                              tracking-wider leading-tight">
                  {card.label}
                </p>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight relative z-10">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ===== Toolbar: Search + Refresh ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:flex-none group">
            <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm
                          group-focus-within:text-cyan-500 transition-colors duration-200" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="menu-search-input w-full sm:w-80 pl-10 pr-9 py-2.5 text-sm rounded-xl" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-red-500 transition-colors duration-150 cursor-pointer">
                <i className="pi pi-times text-xs" />
              </button>
            )}
          </div>
          <button onClick={() => dispatch(fetchMenuItems())}
            className="menu-refresh-btn w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            title="Refresh menu">
            <i className="pi pi-refresh text-sm" />
          </button>
        </div>

        {filteredItems.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Showing <span className="text-cyan-600 dark:text-cyan-400 font-bold">{filteredItems.length}</span> {filteredItems.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {/* ===== Category Tabs ===== */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = activeCategory === key;
          const count = categoryCounts[key] || 0;
          return (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`menu-cat-chip flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5
                         rounded-full text-[13px] font-semibold cursor-pointer
                         transition-all duration-300
                         ${isActive
                           ? "menu-cat-active text-white"
                           : "menu-cat-inactive"}`}
              style={isActive ? {
                background: `linear-gradient(135deg, ${cat.color}, ${cat.colorEnd})`,
                boxShadow: `0 4px 14px ${cat.glow}, 0 0 30px ${cat.glowDark}`,
              } : {}}>
              <span className="text-sm leading-none">{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                               inline-flex items-center justify-center leading-none
                ${isActive
                  ? "bg-white/25 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== Grid ===== */}
      {loading ? renderSkeletonGrid() : (
        filteredItems.length === 0 ? renderEmptyState() : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, idx) => renderMenuCard(item, idx))}
          </div>
        )
      )}

      {/* ===== Dialogs ===== */}
      <MenuItemFormDialog visible={showForm} onHide={() => setShowForm(false)}
        onSave={handleSave}
        menuItem={selectedItem}
        saving={saving}
        onReplaceImage={handleReplaceImage}
        onDeleteImage={handleDeleteImage}
        imageBusy={imageBusy}
      />
      <DeleteMenuItemDialog visible={showDelete} onHide={() => setShowDelete(false)}
        onConfirm={handleDelete} menuItem={selectedItem} deleting={deleting} />
    </div>
  );
};

export default MenuManagementPage;
