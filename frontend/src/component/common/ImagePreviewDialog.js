"use client";

// Generic image preview dialog used across the app.
// Purpose: click a thumbnail/avatar and view the image in large size.

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const ImagePreviewDialog = ({ visible, onHide, title, subtitle, imageUrl }) => {
  const footer = (
    <div className="flex justify-end">
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined onClick={onHide} />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: "min(980px, 96vw)" }}
      header={
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center shadow-md shadow-blue-500/25
                          ring-4 ring-blue-500/10">
            <i className="pi pi-image text-white" style={{ fontSize: "0.95rem" }} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">
              {title || "Image Preview"}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      }
    >
      <div className="pt-5 pb-2">
        {imageUrl ? (
          <div className="relative w-full">
            {/* Soft glow behind the image */}
            <div className="absolute inset-0 rounded-2xl bg-blue-500/5 dark:bg-blue-500/4 blur-3xl" />

            <div className="relative bg-white dark:bg-gray-900/30 rounded-2xl p-3
                            border border-gray-100 dark:border-gray-700/60
                            shadow-xl shadow-gray-200/40 dark:shadow-black/30">
              <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
                <img
                  src={imageUrl}
                  alt={title || "Preview"}
                  className="w-full max-h-[72vh] object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
                            dark:from-gray-800 dark:to-gray-700/80
                            flex items-center justify-center
                            border border-gray-200 dark:border-gray-600
                            shadow-inner">
              <i className="pi pi-image text-4xl text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">
                No image available
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Upload an image to preview it here.
              </p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ImagePreviewDialog;

