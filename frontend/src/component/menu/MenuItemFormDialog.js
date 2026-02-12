"use client";

// Reusable dialog for both creating and editing a menu item.
// Pass `menuItem` prop to pre-fill the form when editing.
// If `menuItem` is null, it means we're creating a new one.

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { uploadMenuImage } from "@/api/menu";

// Category options
const categoryOptions = [
  { label: "Appetizer", value: "appetizer", icon: "pi pi-star" },
  { label: "Main Course", value: "main", icon: "pi pi-sun" },
  { label: "Dessert", value: "dessert", icon: "pi pi-heart" },
  { label: "Drink", value: "drink", icon: "pi pi-bolt" },
  { label: "Side", value: "side", icon: "pi pi-th-large" },
];

// Availability options
const availabilityOptions = [
  { label: "Available", value: true, icon: "pi pi-check-circle" },
  { label: "Unavailable", value: false, icon: "pi pi-times-circle" },
];

// Custom template for dropdown items
const categoryItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} text-slate-500 dark:text-slate-400`} style={{ fontSize: "0.8rem" }} />
    <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
  </div>
);

const availabilityItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} text-slate-500 dark:text-slate-400`} style={{ fontSize: "0.8rem" }} />
    <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
  </div>
);

const MenuItemFormDialog = ({ visible, onHide, onSave, menuItem, saving }) => {
  const isEdit = !!menuItem;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(null);
  const [category, setCategory] = useState("main");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // When the dialog opens, reset or pre-fill the form
  useEffect(() => {
    if (visible) {
      if (menuItem) {
        setName(menuItem.name || "");
        setDescription(menuItem.description || "");
        setPrice(menuItem.price ?? 0);
        setCategory(menuItem.category || "main");
        setAvailable(menuItem.available ?? true);
        setImage(menuItem.image || "");
        setImageError(false);
        setSubmitted(false);
      } else {
        setName("");
        setDescription("");
        setPrice(null);
        setCategory("main");
        setAvailable(true);
        setImage("");
        setImageError(false);
        setSubmitted(false);
      }
    }
  }, [visible, menuItem]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setImageError(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError(true);
      return;
    }

    try {
      setUploading(true);
      setImageError(false);
      const data = await uploadMenuImage(file);
      setImage(data.url);
    } catch {
      setImageError(true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Validation before saving
  const nameInvalid = !name.trim();
  const priceInvalid = price === null || price === undefined || price < 0;
  const categoryInvalid = !category;

  const handleSubmit = () => {
    setSubmitted(true);
    if (nameInvalid || priceInvalid || categoryInvalid) return;
    onSave({ name: name.trim(), description: description.trim(), price, category, available, image: image.trim() });
  };

  // Footer buttons
  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        className="menu-dlg-btn-cancel"
      />
      <Button
        label={isEdit ? "Save Changes" : "Add Item"}
        icon={isEdit ? "pi pi-check" : "pi pi-plus"}
        onClick={handleSubmit}
        loading={saving}
        raised
        className="menu-dlg-btn-submit"
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex items-center gap-4 relative">
          <div className="menu-dlg-header-icon">
            <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus"} text-white`} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-50 tracking-tight">
              {isEdit ? "Edit Menu Item" : "Add New Menu Item"}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
              {isEdit ? "Update the item details below" : "Fill in the details to add a new dish"}
            </p>
          </div>
        </div>
      }
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: "560px" }}
      modal
      draggable={false}
      className="menu-form-dialog"
    >
      <div className="flex flex-col gap-4 pt-5">

        {/* Basic Info Group */}
        <div className="menu-dlg-field-group flex flex-col gap-4">
          {/* Item Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="menuName" className="flex items-center gap-2">
              <div className="menu-dlg-label-icon">
                <i className="pi pi-tag" style={{ fontSize: "0.6rem" }} />
              </div>
              <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
                Item Name
              </span>
              <span className="text-blue-500 dark:text-blue-400 text-[10px] font-bold">*</span>
            </label>
            <InputText
              id="menuName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Salmon, Caesar Salad..."
              className={`w-full ${submitted && nameInvalid ? "!border-red-400 dark:!border-red-500" : ""}`}
            />
            {submitted && nameInvalid && (
              <small className="text-red-500 dark:text-red-400 text-[11px] flex items-center gap-1 mt-0.5">
                <i className="pi pi-exclamation-circle" style={{ fontSize: "0.6rem" }} />
                Item name is required
              </small>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="menuDesc" className="flex items-center gap-2">
              <div className="menu-dlg-label-icon">
                <i className="pi pi-align-left" style={{ fontSize: "0.6rem" }} />
              </div>
              <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
                Description
              </span>
            </label>
            <InputTextarea
              id="menuDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the dish..."
              rows={2}
              autoResize
              className="w-full"
            />
          </div>
        </div>

        {/* Price, Category & Availability Group */}
        <div className="menu-dlg-field-group flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="menuPrice" className="flex items-center gap-2">
                <div className="menu-dlg-label-icon">
                  <i className="pi pi-dollar" style={{ fontSize: "0.6rem" }} />
                </div>
                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
                  Price
                </span>
                <span className="text-blue-500 dark:text-blue-400 text-[10px] font-bold">*</span>
              </label>
              <InputNumber
                id="menuPrice"
                value={price}
                onValueChange={(e) => setPrice(e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                min={0}
                minFractionDigits={2}
                placeholder="0.00"
                className={`w-full ${submitted && priceInvalid ? "!border-red-400 dark:!border-red-500" : ""}`}
                inputClassName={submitted && priceInvalid ? "!border-red-400 dark:!border-red-500" : ""}
              />
              {submitted && priceInvalid && (
                <small className="text-red-500 dark:text-red-400 text-[11px] flex items-center gap-1 mt-0.5">
                  <i className="pi pi-exclamation-circle" style={{ fontSize: "0.6rem" }} />
                  Price is required
                </small>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="menuCategory" className="flex items-center gap-2">
                <div className="menu-dlg-label-icon">
                  <i className="pi pi-bookmark" style={{ fontSize: "0.6rem" }} />
                </div>
                <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
                  Category
                </span>
                <span className="text-blue-500 dark:text-blue-400 text-[10px] font-bold">*</span>
              </label>
              <Dropdown
                id="menuCategory"
                value={category}
                options={categoryOptions}
                onChange={(e) => setCategory(e.value)}
                itemTemplate={categoryItemTemplate}
                className={`w-full ${submitted && categoryInvalid ? "!border-red-400 dark:!border-red-500" : ""}`}
              />
              {submitted && categoryInvalid && (
                <small className="text-red-500 dark:text-red-400 text-[11px] flex items-center gap-1 mt-0.5">
                  <i className="pi pi-exclamation-circle" style={{ fontSize: "0.6rem" }} />
                  Category is required
                </small>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="menuAvailable" className="flex items-center gap-2">
              <div className="menu-dlg-label-icon">
                <i className="pi pi-check-circle" style={{ fontSize: "0.6rem" }} />
              </div>
              <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
                Availability
              </span>
            </label>
            <Dropdown
              id="menuAvailable"
              value={available}
              options={availabilityOptions}
              onChange={(e) => setAvailable(e.value)}
              itemTemplate={availabilityItemTemplate}
              className="w-full"
            />
          </div>
        </div>

        {/* Dish Image Group */}
        <div className="menu-dlg-field-group flex flex-col gap-2.5">
          <label htmlFor="menuImage" className="flex items-center gap-2">
            <div className="menu-dlg-label-icon">
              <i className="pi pi-image" style={{ fontSize: "0.6rem" }} />
            </div>
            <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
              Dish Image
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium ml-auto">Optional</span>
          </label>

          {/* Upload button + URL input row */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="menu-dlg-upload-btn"
            >
              {uploading ? (
                <i className="pi pi-spin pi-spinner" style={{ fontSize: "0.75rem" }} />
              ) : (
                <i className="pi pi-upload" style={{ fontSize: "0.75rem" }} />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </button>

            <div className="relative flex-1">
              <InputText
                id="menuImage"
                value={image}
                onChange={(e) => { setImage(e.target.value); setImageError(false); }}
                placeholder="Or paste image URL here..."
                className={`w-full ${imageError ? "!border-red-400 dark:!border-red-500" : ""}`}
              />
              {image && (
                <button
                  type="button"
                  onClick={() => { setImage(""); setImageError(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                             bg-slate-200 dark:bg-slate-600 flex items-center justify-center
                             hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 dark:hover:text-red-400
                             text-slate-400 dark:text-slate-400 transition-all duration-150 cursor-pointer"
                  title="Clear image"
                >
                  <i className="pi pi-times" style={{ fontSize: "0.5rem" }} />
                </button>
              )}
            </div>
          </div>

          {imageError && (
            <small className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1.5 pl-0.5">
              <i className="pi pi-exclamation-circle" style={{ fontSize: "0.65rem" }} />
              Could not load image. Check the file or URL and try again.
            </small>
          )}

          {/* Image preview */}
          {image && !uploading && (
            <div className={`menu-dlg-preview-wrap ${imageError ? "menu-dlg-preview-error" : ""}`}>
              {!imageError ? (
                <img
                  src={image}
                  alt="Dish preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2
                                text-slate-400 dark:text-slate-500">
                  <i className="pi pi-image" style={{ fontSize: "1.5rem" }} />
                  <span className="text-xs font-medium">Image failed to load</span>
                </div>
              )}

              {!imageError && (
                <div className="absolute bottom-2.5 left-2.5 menu-dlg-preview-badge">
                  <i className="pi pi-check-circle" style={{ fontSize: "0.55rem" }} />
                  Preview
                </div>
              )}
            </div>
          )}

          {/* Upload progress indicator */}
          {uploading && (
            <div className="menu-dlg-upload-progress">
              <div className="menu-dlg-upload-spinner">
                <i className="pi pi-spin pi-spinner text-blue-500 dark:text-blue-400" style={{ fontSize: "0.9rem" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Uploading image...</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">This may take a few seconds</p>
              </div>
            </div>
          )}

          {/* Help text when no image and not uploading */}
          {!image && !uploading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="menu-dlg-dropzone"
            >
              <div className="menu-dlg-dropzone-icon">
                <i className="pi pi-cloud-upload" style={{ fontSize: "0.85rem" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Click to upload or paste a URL above
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  JPG, PNG, WebP or GIF -- Max 5 MB
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </Dialog>
  );
};

export default MenuItemFormDialog;
