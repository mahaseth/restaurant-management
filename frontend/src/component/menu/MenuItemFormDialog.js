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

// Category options with icons and colors
const categoryOptions = [
  { label: "Appetizer", value: "appetizer", icon: "pi pi-star", color: "text-amber-500" },
  { label: "Main Course", value: "main", icon: "pi pi-sun", color: "text-orange-500" },
  { label: "Dessert", value: "dessert", icon: "pi pi-heart", color: "text-pink-500" },
  { label: "Drink", value: "drink", icon: "pi pi-bolt", color: "text-blue-500" },
  { label: "Side", value: "side", icon: "pi pi-th-large", color: "text-emerald-500" },
];

// Availability options
const availabilityOptions = [
  { label: "Available", value: true, icon: "pi pi-check-circle", color: "text-emerald-500" },
  { label: "Unavailable", value: false, icon: "pi pi-times-circle", color: "text-red-500" },
];

// Custom template for dropdown items
const categoryItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} ${option.color}`} style={{ fontSize: "0.8rem" }} />
    <span className="font-medium text-sm">{option.label}</span>
  </div>
);

const availabilityItemTemplate = (option) => (
  <div className="flex items-center gap-2.5 py-0.5">
    <i className={`${option.icon} ${option.color}`} style={{ fontSize: "0.8rem" }} />
    <span className="font-medium text-sm">{option.label}</span>
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

  // Validation
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
      />
      <Button
        label={isEdit ? "Save Changes" : "Add Item"}
        icon={isEdit ? "pi pi-check" : "pi pi-plus"}
        onClick={handleSubmit}
        loading={saving}
        raised
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex items-center gap-3.5 relative">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
            bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/25
            ring-4 ring-blue-500/10`}>
            <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus"} text-white`} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-slate-50">
              {isEdit ? "Edit Menu Item" : "Add New Menu Item"}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-normal mt-0.5">
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
              <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-900/30
                              flex items-center justify-center">
                <i className="pi pi-tag text-orange-500 dark:text-orange-400" style={{ fontSize: "0.65rem" }} />
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
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30
                              flex items-center justify-center">
                <i className="pi pi-align-left text-blue-500 dark:text-blue-400" style={{ fontSize: "0.65rem" }} />
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
                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30
                                flex items-center justify-center">
                  <i className="pi pi-dollar text-emerald-500 dark:text-emerald-400" style={{ fontSize: "0.65rem" }} />
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
                <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/30
                                flex items-center justify-center">
                  <i className="pi pi-bookmark text-violet-500 dark:text-violet-400" style={{ fontSize: "0.65rem" }} />
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
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-900/30
                              flex items-center justify-center">
                <i className="pi pi-check-circle text-teal-500 dark:text-teal-400" style={{ fontSize: "0.65rem" }} />
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

        {/* Image Upload Group */}
        <div className="menu-dlg-field-group flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pink-50 dark:bg-pink-900/30
                            flex items-center justify-center">
              <i className="pi pi-image text-pink-500 dark:text-pink-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">
              Dish Image
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-normal ml-1">Optional</span>
          </label>

          {/* Upload button + hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />

          {!image && !uploading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6
                         flex flex-col items-center justify-center gap-2 cursor-pointer
                         hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                         transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <i className="pi pi-cloud-upload text-slate-400 dark:text-slate-400" style={{ fontSize: "1.1rem" }} />
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                Click to upload an image
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                JPG, PNG, WebP or GIF (max 5MB)
              </p>
            </div>
          )}

          {/* Uploading state */}
          {uploading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20
                            border border-blue-200 dark:border-blue-800/50">
              <i className="pi pi-spin pi-spinner text-blue-500" style={{ fontSize: "1rem" }} />
              <span className="text-[13px] text-blue-600 dark:text-blue-400 font-medium">Uploading image...</span>
            </div>
          )}

          {/* Image preview */}
          {image && !uploading && (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600
                            bg-slate-50 dark:bg-slate-800">
              <img
                src={image}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-md bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600
                             flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30
                             transition-colors cursor-pointer"
                  title="Change image"
                  type="button"
                >
                  <i className="pi pi-pencil text-slate-500 dark:text-slate-400" style={{ fontSize: "0.6rem" }} />
                </button>
                <button
                  onClick={() => setImage("")}
                  className="w-7 h-7 rounded-md bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600
                             flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30
                             transition-colors cursor-pointer"
                  title="Remove image"
                  type="button"
                >
                  <i className="pi pi-trash text-slate-500 dark:text-slate-400" style={{ fontSize: "0.6rem" }} />
                </button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium">
                  Preview
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {imageError && (
            <small className="text-red-500 dark:text-red-400 text-[11px] flex items-center gap-1">
              <i className="pi pi-exclamation-circle" style={{ fontSize: "0.6rem" }} />
              Upload failed. Please use JPG, PNG, WebP or GIF under 5MB.
            </small>
          )}
        </div>

      </div>
    </Dialog>
  );
};

export default MenuItemFormDialog;
