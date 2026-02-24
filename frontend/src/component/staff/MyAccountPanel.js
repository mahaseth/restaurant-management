"use client";

// My Account panel:
// - Change password for the currently logged-in user
// - Update profile image for the currently logged-in user
//
// Note: The backend endpoint /api/users/profile-image updates the current user only.

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import { changePassword, deleteProfileImage, getMe, updateMyActiveStatus, updateProfileImage } from "@/api/users";
import ImagePreviewDialog from "@/component/common/ImagePreviewDialog";

const MyAccountPanel = () => {
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user?.user;

  // =====================
  // Change password form
  // =====================
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // =====================
  // Profile image upload
  // =====================
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [serverImageUrl, setServerImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingActive, setSavingActive] = useState(false);

  // Always fetch current user profile from backend so we can show the latest image.
  // This avoids relying only on what the login payload stored in Redux contains.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          setServerImageUrl(me?.profileImageUrl || "");
          setIsActive(me?.isActive !== false);
        }
      } catch {
        // If this fails, fall back to whatever is in auth state.
        if (!cancelled) {
          setServerImageUrl(currentUser?.profileImageUrl || "");
          setIsActive(currentUser?.isActive !== false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const initials = useMemo(() => {
    const n = (currentUser?.name || "").trim();
    if (!n) return "U";
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  }, [currentUser?.name]);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please fill old password and new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword({ oldPassword, newPassword });
      toast.success(res?.message || "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err?.response?.data || err?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUploadProfileImage = async () => {
    if (!file) {
      toast.error("Please choose an image file.");
      return;
    }

    // Keep it lightweight; backend also validates/handles upload.
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }

    setUploading(true);
    try {
      const updated = await updateProfileImage(file);
      toast.success("Profile image updated.");
      setServerImageUrl(updated?.profileImageUrl || "");
      setFile(null);
    } catch (err) {
      toast.error(err?.response?.data || err?.message || "Failed to upload profile image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    setUploading(true);
    try {
      await deleteProfileImage();
      toast.success("Profile image removed.");
      setServerImageUrl("");
      setFile(null);
    } catch (err) {
      toast.error(err?.response?.data || err?.message || "Failed to remove profile image.");
    } finally {
      setUploading(false);
    }
  };

  const openPreview = () => {
    const urlToPreview = previewUrl || serverImageUrl;
    if (!urlToPreview) return;
    setShowPreview(true);
  };

  const handleToggleActive = async (next) => {
    setSavingActive(true);
    try {
      const updated = await updateMyActiveStatus(!!next);
      setIsActive(updated?.isActive !== false);
      toast.success(updated?.isActive !== false ? "Status set to Active." : "Status set to Off duty.");
    } catch (err) {
      toast.error(err?.response?.data || err?.message || "Failed to update status.");
    } finally {
      setSavingActive(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Profile ===== */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openPreview}
            disabled={!serverImageUrl && !previewUrl}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                        flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 overflow-hidden
                        ${serverImageUrl || previewUrl ? "cursor-pointer hover:brightness-[1.03] active:scale-[0.98]" : "cursor-default"}`}
            title={serverImageUrl || previewUrl ? "Click to preview" : "No image to preview"}
          >
            {serverImageUrl ? (
              <img src={serverImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold">{initials}</span>
            )}
          </button>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
              {currentUser?.name || "My Account"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {currentUser?.email || "Signed in user"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-8">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full mt-1 text-sm text-gray-600 dark:text-gray-300
                         file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                         dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30"
            />
            {previewUrl && (
              <div className="mt-3">
                <button type="button" onClick={openPreview} className="block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-28 h-28 rounded-2xl object-cover border border-gray-200 dark:border-gray-700
                               hover:opacity-95 active:scale-[0.99] transition"
                  />
                </button>
              </div>
            )}
            {!previewUrl && serverImageUrl && (
              <div className="mt-3">
                <button type="button" onClick={openPreview} className="block">
                  <img
                    src={serverImageUrl}
                    alt="Current profile"
                    className="w-28 h-28 rounded-2xl object-cover border border-gray-200 dark:border-gray-700
                               hover:opacity-95 active:scale-[0.99] transition"
                  />
                </button>
              </div>
            )}
          </div>
          <div className="lg:col-span-4 flex gap-2 justify-end">
            <Button
              label="Upload"
              icon="pi pi-upload"
              onClick={handleUploadProfileImage}
              loading={uploading}
              raised
              disabled={!file}
            />
            <Button
              label="Remove"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={handleRemoveProfileImage}
              disabled={uploading || !serverImageUrl}
            />
            <Button
              label="Clear"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setFile(null)}
              disabled={!file || uploading}
            />
          </div>
        </div>
      </div>

      <ImagePreviewDialog
        visible={showPreview}
        onHide={() => setShowPreview(false)}
        title={currentUser?.name ? `${currentUser.name} - Profile Photo` : "Profile Photo"}
        subtitle={currentUser?.email || ""}
        imageUrl={previewUrl || serverImageUrl}
      />

      {/* ===== Attendance / Active Status ===== */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-4
                          ${isActive
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20 ring-emerald-500/10"
                            : "bg-gradient-to-br from-slate-500 to-gray-600 shadow-gray-500/20 ring-gray-500/10"
                          }`}
          >
            <i className={`pi ${isActive ? "pi-check-circle" : "pi-pause"} text-white`} />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Work Status
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Turn this on when you are on duty. Turn it off when you are off duty.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Current:{" "}
              <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}>
                {isActive ? "Active" : "Off duty"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              label="Set Active"
              icon="pi pi-check"
              onClick={() => handleToggleActive(true)}
              loading={savingActive}
              disabled={savingActive || isActive}
              raised
            />
            <Button
              label="Set Off Duty"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => handleToggleActive(false)}
              disabled={savingActive || !isActive}
            />
          </div>
        </div>
      </div>

      {/* ===== Change Password ===== */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50
                      shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center
                          shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <i className="pi pi-lock text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">Change Password</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              For security, you must enter your current password.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Current Password</label>
            <InputText
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full mt-1"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">New Password</label>
            <InputText
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Confirm</label>
            <InputText
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full mt-1"
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            label="Update Password"
            icon="pi pi-check"
            onClick={handleChangePassword}
            loading={savingPassword}
            raised
          />
        </div>
      </div>
    </div>
  );
};

export default MyAccountPanel;

