"use client";

import React from "react";
import { BreadCrumb } from "primereact/breadcrumb";
import { usePathname } from "next/navigation";
import { HOME_ROUTE, DASHBOARD_ROUTE } from "@/constants/routes";
import ThemeToggler from "./ThemeToggler";
import User from "./User";
import Link from "next/link";

const ProtectedHeader = () => {
  const pathname = usePathname();

  // Generate breadcrumb items based on current path
  const pathParts = pathname.split("/").filter((x) => x);
  const items = pathParts.map((part, index) => {
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
    const url = "/" + pathParts.slice(0, index + 1).join("/");
    return {
      label,
      template: (item) => (
        <Link href={url} className="text-sm font-medium hover:text-primary transition-colors duration-200">
          {item.label}
        </Link>
      )
    };
  });

  const home = {
    icon: "pi pi-home",
    template: (item) => (
      <Link href={HOME_ROUTE} className="text-gray-500 hover:text-primary transition-colors duration-200">
        <i className={item.icon}></i>
      </Link>
    )
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-4">
          <BreadCrumb
            model={items}
            home={home}
            className="bg-transparent border-none p-0 text-gray-500 dark:text-gray-400"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
            <ThemeToggler />
          </div>
          <User />
        </div>
      </div>
    </header>
  );
};

export default ProtectedHeader;
