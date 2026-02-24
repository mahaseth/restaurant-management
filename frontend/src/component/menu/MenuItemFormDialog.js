"use client";

// Reusable dialog for both creating and editing a menu item.
// Pass `menuItem` prop to pre-fill the form when editing.
// If `menuItem` is null, it means we're creating a new one.

import React, { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

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

const MenuItemFormDialog = ({
  visible,
  onHide,
  onSave,
  menuItem,
  saving,
  onReplaceImage,
  onDeleteImage,
  imageBusy,
}) => {
  const isEdit = !!menuItem;
  const fileInputRef = useRef(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("main");
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState("");

  const initializeForm = () => {
    if (menuItem) {
      setName(menuItem.name || "");
      setDescription(menuItem.description || "");
      setPrice(menuItem.price ?? 0);
      setCategory(menuItem.category || "main");
      setAvailable(menuItem.available ?? true);
      setImage(menuItem.image || "");
      return;
    }
    setName("");
    setDescription("");
    setPrice(0);
    setCategory("main");
    setAvailable(true);
    setImage("");
  };

  // Validation before saving
  const handleSubmit = () => {
    if (!name.trim()) return;
    if (price < 0) return;
    if (!category) return;
    onSave({ name: name.trim(), description: description.trim(), price, category, available, image: image.trim() });
  };

  const handleChooseFile = () => {
    if (!isEdit) return;
    if (typeof onReplaceImage !== "function") return;
    fileInputRef.current?.click?.();
  };

  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0];
    // Reset the input so choosing the same file again re-triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (typeof onReplaceImage !== "function") return;

    const nextUrl = await onReplaceImage(file);
    if (typeof nextUrl === "string") setImage(nextUrl);
  };

  const handleRemoveImage = async () => {
    if (!isEdit) return;
    if (typeof onDeleteImage !== "function") {
      // Fallback: clear local state; saving the form will clear DB value
      setImage("");
      return;
    }
    const ok = await onDeleteImage();
    if (ok) setImage("");
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
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center
            ${isEdit
              ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25"
              : "bg-gradient-to-br from-orange-500 to-rose-500 shadow-md shadow-orange-500/25"
            } ring-4 ${isEdit ? "ring-amber-500/10" : "ring-orange-500/10"}`}>
            <i className={`pi ${isEdit ? "pi-pencil" : "pi-plus"} text-white`} style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">
              {isEdit ? "Edit Menu Item" : "Add New Menu Item"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
              {isEdit ? "Update the item details below" : "Fill in the details to add a new dish"}
            </p>
          </div>
        </div>
      }
      visible={visible}
      onShow={initializeForm}
      onHide={onHide}
      footer={footer}
      style={{ width: "540px" }}
      modal
      draggable={false}
    >
      <div className="flex flex-col gap-5 pt-5">

        {/* Item Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="menuName" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-900/30
                            flex items-center justify-center">
              <i className="pi pi-tag text-orange-500 dark:text-orange-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Item Name
            </span>
            <span className="text-red-400 text-xs">*</span>
          </label>
          <InputText
            id="menuName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grilled Salmon, Caesar Salad..."
            className="w-full"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="menuDesc" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30
                            flex items-center justify-center">
              <i className="pi pi-align-left text-blue-500 dark:text-blue-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Description
            </span>
          </label>
          <InputTextarea
            id="menuDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the dish..."
            rows={3}
            autoResize
            className="w-full"
          />
        </div>

        {/* Price & Category — side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div className="flex flex-col gap-2">
            <label htmlFor="menuPrice" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30
                              flex items-center justify-center">
                <i className="pi pi-dollar text-emerald-500 dark:text-emerald-400" style={{ fontSize: "0.65rem" }} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Price
              </span>
              <span className="text-red-400 text-xs">*</span>
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
              className="w-full"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label htmlFor="menuCategory" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/30
                              flex items-center justify-center">
                <i className="pi pi-bookmark text-violet-500 dark:text-violet-400" style={{ fontSize: "0.65rem" }} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Category
              </span>
              <span className="text-red-400 text-xs">*</span>
            </label>
            <Dropdown
              id="menuCategory"
              value={category}
              options={categoryOptions}
              onChange={(e) => setCategory(e.value)}
              itemTemplate={categoryItemTemplate}
              className="w-full"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="flex flex-col gap-2">
          <label htmlFor="menuAvailable" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-900/30
                            flex items-center justify-center">
              <i className="pi pi-check-circle text-teal-500 dark:text-teal-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
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

        {/* Image URL */}
        <div className="flex flex-col gap-2">
          <label htmlFor="menuImage" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-pink-50 dark:bg-pink-900/30
                            flex items-center justify-center">
              <i className="pi pi-image text-pink-500 dark:text-pink-400" style={{ fontSize: "0.65rem" }} />
            </div>
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Image URL
            </span>
          </label>
          <InputText
            id="menuImage"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/dish-photo.jpg"
            className="w-full"
          />
          <small className="text-gray-400 dark:text-gray-500 text-xs ml-0.5">
            Optional — paste a URL, or upload/replace the image (edit mode)
          </small>

          {/* Upload/Replace controls (edit mode) */}
          {isEdit && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                label={image ? "Replace Image" : "Upload Image"}
                icon="pi pi-upload"
                onClick={handleChooseFile}
                loading={!!imageBusy}
                outlined
                size="small"
                disabled={typeof onReplaceImage !== "function"}
              />
              <Button
                label="Delete Image"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleRemoveImage}
                loading={!!imageBusy}
                outlined
                size="small"
                disabled={!image}
              />
            </div>
          )}

          {/* Image preview */}
          {image && (
            <div className="mt-1 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700
                            bg-gray-50 dark:bg-gray-800">
              <img
                src={image}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}
        </div>

      </div>
    </Dialog>
  );
};

export default MenuItemFormDialog;
