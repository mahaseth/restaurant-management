"use client";

// Reusable dialog for both creating and editing a menu item.
// Pass `menuItem` prop to pre-fill the form when editing.
// If `menuItem` is null, it means we're creating a new one.

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const MAX_LIST_ITEMS = 40;
const MAX_LIST_ITEM_LEN = 120;

/** Comma / newline / semicolon separated — matches backend list parsing behavior. */
function parseListFromInput(raw) {
  if (raw == null || typeof raw !== "string") return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, MAX_LIST_ITEM_LEN))
    .slice(0, MAX_LIST_ITEMS);
}

function formatListForInput(arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .map((s) => s.slice(0, MAX_LIST_ITEM_LEN))
    .slice(0, MAX_LIST_ITEMS)
    .join(", ");
}

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

const spiceLevelOptions = [
  { label: "Not specified", value: null },
  { label: "Mild", value: "mild" },
  { label: "Medium", value: "medium" },
  { label: "Hot", value: "hot" },
];

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
  const [ingredientsText, setIngredientsText] = useState("");
  const [allergensText, setAllergensText] = useState("");
  const [dietaryTagsText, setDietaryTagsText] = useState("");
  const [spiceLevel, setSpiceLevel] = useState(null);
  const [cuisineType, setCuisineType] = useState("");

  const menuItemRef = useRef(menuItem);
  menuItemRef.current = menuItem;

  const initializeForm = useCallback(() => {
    const m = menuItemRef.current;
    if (m) {
      setName(m.name || "");
      setDescription(m.description || "");
      setPrice(m.price ?? 0);
      setCategory(m.category || "main");
      setAvailable(m.available ?? true);
      setImage(m.image || "");
      setIngredientsText(formatListForInput(m.ingredients));
      setAllergensText(formatListForInput(m.allergens));
      setDietaryTagsText(formatListForInput(m.dietaryTags));
      setSpiceLevel(m.spiceLevel || null);
      setCuisineType(m.cuisineType || "");
      return;
    }
    setName("");
    setDescription("");
    setPrice(0);
    setCategory("main");
    setAvailable(true);
    setImage("");
    setIngredientsText("");
    setAllergensText("");
    setDietaryTagsText("");
    setSpiceLevel(null);
    setCuisineType("");
  }, []);

  // PrimeReact Dialog `onShow` can run before `menuItem` updates when opening edit.
  // Re-init when the dialog opens or when switching to another item (`_id`), not on every parent re-render.
  useEffect(() => {
    if (!visible) return;
    initializeForm();
  }, [visible, menuItem?._id, initializeForm]);

  // Validation before saving
  const handleSubmit = () => {
    if (!name.trim()) return;
    if (price < 0) return;
    if (!category) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      price,
      category,
      available,
      image: image.trim(),
      ingredients: parseListFromInput(ingredientsText),
      allergens: parseListFromInput(allergensText),
      dietaryTags: parseListFromInput(dietaryTagsText),
      spiceLevel: spiceLevel == null ? "" : spiceLevel,
      cuisineType: cuisineType.trim(),
    });
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
      onHide={onHide}
      footer={footer}
      style={{ width: "580px" }}
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
                <i className="pi pi-wallet text-emerald-500 dark:text-emerald-400" style={{ fontSize: "0.65rem" }} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Price (Rs.)
              </span>
              <span className="text-red-400 text-xs">*</span>
            </label>
            <InputNumber
              id="menuPrice"
              value={price}
              onValueChange={(e) => setPrice(e.value)}
              mode="decimal"
              min={0}
              minFractionDigits={0}
              maxFractionDigits={2}
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

        {/* Optional: richer data for AI search & guest safety */}
        <div className="rounded-xl border border-violet-100 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20 px-3 py-3 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
            Dietary &amp; AI menu search
          </p>
          <p className="text-xs text-violet-900/70 dark:text-violet-300/80 -mt-2">
            All optional. Helps the assistant answer questions about allergens, spice, and diet. Use commas or
            line breaks between items (no need to press Enter per chip).
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor="ingredientsText" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ingredients
            </label>
            <InputTextarea
              id="ingredientsText"
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="e.g. chicken, butter, cream, tomato, spices"
              rows={2}
              autoResize
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="allergensText" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Allergens
            </label>
            <InputTextarea
              id="allergensText"
              value={allergensText}
              onChange={(e) => setAllergensText(e.target.value)}
              placeholder="e.g. dairy, peanuts"
              rows={2}
              autoResize
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="dietaryTagsText" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dietary tags
            </label>
            <InputTextarea
              id="dietaryTagsText"
              value={dietaryTagsText}
              onChange={(e) => setDietaryTagsText(e.target.value)}
              placeholder="e.g. vegetarian, vegan, gluten-free"
              rows={2}
              autoResize
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spice level</label>
              <Dropdown
                value={spiceLevel}
                options={spiceLevelOptions}
                onChange={(e) => setSpiceLevel(e.value)}
                placeholder="Not specified"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="cuisineType" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Cuisine type
              </label>
              <InputText
                id="cuisineType"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="e.g. Indian, Italian"
                className="w-full"
                maxLength={80}
              />
            </div>
          </div>
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
