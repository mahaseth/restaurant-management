"use client";

import { useRef, useState } from "react";
import { Button } from "primereact/button";

export default function AssetUploadRow({
  label,
  description,
  currentUrl,
  onUpload,
  accept = "image/*",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{label}</p>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt=""
              className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600" />
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
          <Button
            type="button"
            label={loading ? "Uploading…" : "Upload"}
            icon="pi pi-upload"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="p-button-sm"
          />
        </div>
      </div>
    </div>
  );
}
