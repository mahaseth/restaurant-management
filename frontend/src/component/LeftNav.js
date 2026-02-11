"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_ROUTE,
  MENU_MANAGEMENT_ROUTE,
  ORDERS_ROUTE,
  STAFF_ROUTE,
  SETTINGS_ROUTE,
  TABLES_ROUTE,
} from "@/constants/routes";
import Logo from "@/component/Logo";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/auth/authSlice";

const LeftNav = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { label: "Dashboard", icon: "pi pi-home", href: DASHBOARD_ROUTE },
    { label: "Orders", icon: "pi pi-shopping-cart", href: ORDERS_ROUTE },
    { label: "Menu", icon: "pi pi-list", href: MENU_MANAGEMENT_ROUTE },
    { label: "Tables", icon: "pi pi-table", href: TABLES_ROUTE },
    { label: "Staff", icon: "pi pi-users", href: STAFF_ROUTE },
    { label: "Settings", icon: "pi pi-cog", href: SETTINGS_ROUTE },
  ];

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="h-full px-4 py-8 flex flex-col">
        {/* Header/Logo */}
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-primary dark:text-gray-400"
                  }`}
              >
                <i className={`${item.icon} ${isActive ? "text-white" : "group-hover:text-primary"} text-lg`} />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all dark:text-gray-400 dark:hover:bg-red-900/10 active:scale-95"
          >
            <i className="pi pi-sign-out text-lg" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftNav;