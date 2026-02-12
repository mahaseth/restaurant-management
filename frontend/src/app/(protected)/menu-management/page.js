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
    gradient: "from-gray-500 to-gray-600",
  },
  appetizer: {
    label: "Appetizers", emoji: "🥗",
    gradient: "from-gray-500 to-gray-600",
  },
  main: {
    label: "Main Course", emoji: "🥩",
    gradient: "from-gray-500 to-gray-600",
  },
  dessert: {
    label: "Desserts", emoji: "🍰",
    gradient: "from-gray-500 to-gray-600",
  },
  drink: {
    label: "Drinks", emoji: "🍹",
    gradient: "from-gray-500 to-gray-600",
  },
  side: {
    label: "Sides", emoji: "🍟",
    gradient: "from-gray-500 to-gray-600",
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
          background: `radial-gradient(circle at ${(tilt.y / 12 + 0.5) * 100}% ${(-tilt.x / 12 + 0.5) * 100}%, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0.06) 30%, transparent 60%)`,
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
    { label: "Total Dishes", value: totalItems, icon: "pi pi-book",
      accent: "border-l-slate-400 dark:border-l-slate-500",
      iconBg: "bg-slate-100 dark:bg-slate-800/60", iconColor: "text-slate-500 dark:text-slate-400" },
    { label: "Available", value: availableItems, icon: "pi pi-check-circle",
      accent: "border-l-stone-400 dark:border-l-stone-500",
      iconBg: "bg-stone-100 dark:bg-stone-800/60", iconColor: "text-stone-500 dark:text-stone-400" },
    { label: "Unavailable", value: unavailableItems, icon: "pi pi-times-circle",
      accent: "border-l-zinc-400 dark:border-l-zinc-500",
      iconBg: "bg-zinc-100 dark:bg-zinc-800/60", iconColor: "text-zinc-500 dark:text-zinc-400" },
    { label: "Avg. Price", value: `$${avgPrice}`, icon: "pi pi-dollar",
      accent: "border-l-neutral-400 dark:border-l-neutral-500",
      iconBg: "bg-neutral-100 dark:bg-neutral-800/60", iconColor: "text-neutral-500 dark:text-neutral-400" },
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
          <div className="menu-3d-icon bg-stone-50 dark:bg-stone-900/60">
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
          className="mt-2 relative z-10" />
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
                <div className="menu-deco-lines" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="menu-3d-float">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30
                                    border border-blue-200 dark:border-blue-800/50
                                    flex items-center justify-center
                                    rotate-6 group-hover:rotate-0 transition-all duration-500"
                         style={{ boxShadow: '0 8px 24px rgba(59,130,246,0.1)' }}>
                      <span className="text-2xl">{cat.emoji}</span>
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
                             line-clamp-1 transition-colors duration-300">
                {item.name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEditDialog(item)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                             bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400
                             border border-blue-200 dark:border-blue-800/50
                             hover:bg-blue-100 dark:hover:bg-blue-800/40 hover:text-blue-700 dark:hover:text-blue-300
                             hover:border-blue-300 dark:hover:border-blue-700
                             transition-all duration-150 cursor-pointer"
                  title="Edit">
                  <i className="pi pi-pencil" style={{ fontSize: "0.65rem" }} />
                </button>
                <button onClick={() => openDeleteDialog(item)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                             bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-400
                             border border-red-200 dark:border-red-800/40
                             hover:bg-red-100 dark:hover:bg-red-800/30 hover:text-red-600 dark:hover:text-red-300
                             hover:border-red-300 dark:hover:border-red-700
                             transition-all duration-150 cursor-pointer"
                  title="Delete">
                  <i className="pi pi-trash" style={{ fontSize: "0.65rem" }} />
                </button>
              </div>
            </div>

            {/* Description — readable, proper size & contrast */}
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-[1.6] line-clamp-3 min-h-[3.2rem]">
              {item.description || "No description available."}
            </p>

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-auto pt-3
                            border-t border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full
                  ${item.available
                    ? "bg-blue-500 dark:bg-blue-400"
                    : "bg-slate-300 dark:bg-slate-600"
                  }`} />
                <span className={`text-[11px] font-semibold ${item.available
                  ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {item.available ? "In Stock" : "Sold Out"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium
                               bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
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
              <div className="menu-header-icon-3d w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800/70
                              flex items-center justify-center">
                <span className="text-lg">🍽️</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Menu Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">
                Manage dishes, prices & categories
              </p>
            </div>
          </div>
          <Button label="Add Dish" icon="pi pi-plus" onClick={openAddDialog} raised
            className="relative z-10" />
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
                <div className={`w-9 h-9 rounded-lg ${card.iconBg}
                                border border-gray-200/80 dark:border-gray-700/60
                                flex items-center justify-center flex-shrink-0`}>
                  <i className={`${card.icon} ${card.iconColor}`} style={{ fontSize: "0.85rem" }} />
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-bold uppercase
                              tracking-wider leading-tight">
                  {card.label}
                </p>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight relative z-10">
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
                          group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors duration-200" />
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
            Showing <span className="text-gray-700 dark:text-gray-300 font-bold">{filteredItems.length}</span> {filteredItems.length === 1 ? "item" : "items"}
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
                           : "menu-cat-inactive"}`}>
              <span className="text-sm leading-none">{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                               inline-flex items-center justify-center leading-none
                ${isActive
                  ? "bg-white/20 text-white"
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
        onSave={handleSave} menuItem={selectedItem} saving={saving} />
      <DeleteMenuItemDialog visible={showDelete} onHide={() => setShowDelete(false)}
        onConfirm={handleDelete} menuItem={selectedItem} deleting={deleting} />
    </div>
  );
};

export default MenuManagementPage;
