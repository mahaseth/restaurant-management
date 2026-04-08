"use client";

// Settings Page
// Central place for profile + account settings.
// (Moved "My Account" from Staff page to here.)

import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import MyAccountPanel from "@/component/staff/MyAccountPanel";
import StripeConnectPanel from "@/component/settings/StripeConnectPanel";

const SettingPage = () => {
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user?.user;
  const isOwner = Array.isArray(currentUser?.roles) && currentUser.roles.includes("OWNER");

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
            <i className="pi pi-cog text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              Settings
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage your account and profile settings
            </p>
          </div>
        </div>
      </div>

      {/* ===== Account Settings ===== */}
      <MyAccountPanel />

      {/* ===== Payment Settings (OWNER only) ===== */}
      {isOwner && (
        <Suspense fallback={null}>
          <StripeConnectPanel />
        </Suspense>
      )}
    </div>
  );
};

export default SettingPage;
