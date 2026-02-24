import crypto from "crypto";
import MenuItem from "../models/MenuItem.js";

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function modifiersTotal(modifiers) {
  if (!Array.isArray(modifiers) || modifiers.length === 0) return 0;
  return modifiers.reduce((acc, m) => acc + (Number(m?.price) || 0), 0);
}

function itemKey(item) {
  // Merge items with same productId + same modifiers (name+price).
  const mods = Array.isArray(item?.modifiers) ? item.modifiers : [];
  const normMods = mods
    .map((m) => ({ name: String(m?.name || ""), price: round2(m?.price) }))
    .sort((a, b) => (a.name + a.price).localeCompare(b.name + b.price));
  return `${String(item?.productId)}::${JSON.stringify(normMods)}`;
}

export function generateOrderNumber() {
  // 8 chars of base32-ish, no ambiguous chars (0/O, 1/I).
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return `RS-${out}`;
}

/**
 * Validate items and calculate totals.
 * Accepts "raw" items from the client: [{ productId, quantity, modifiers, restaurantId? }]
 * Returns snapshot order items suitable for persisting on Order.
 */
export async function validateAndCalculateOrder(items) {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const { productId, quantity, modifiers } = item || {};

    if (!productId || !quantity || Number(quantity) < 1) {
      throw new Error("Invalid product details in items");
    }

    const menuItem = await MenuItem.findById(productId).lean();
    if (!menuItem) {
      throw new Error(`Menu item ${productId} not found`);
    }

    // Ensure menu item belongs to the same restaurant being ordered from.
    if (menuItem.restaurantId && item.restaurantId && String(menuItem.restaurantId) !== String(item.restaurantId)) {
      throw new Error("Menu item does not belong to this restaurant");
    }

    if (menuItem.available === false) {
      throw new Error(`Menu item ${menuItem.name} is currently unavailable`);
    }

    const unitPrice = Number(menuItem.price) || 0;
    const mods = Array.isArray(modifiers) ? modifiers : [];
    const lineTotal = (unitPrice + modifiersTotal(mods)) * Number(quantity);
    subtotal += lineTotal;

    validatedItems.push({
      productId,
      name: menuItem.name,
      unitPrice,
      quantity: Number(quantity),
      modifiers: mods,
      lineTotal: round2(lineTotal),
    });
  }

  const taxRate = 0.08;
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + tax);

  return {
    validatedItems,
    subtotal: round2(subtotal),
    tax,
    total,
  };
}

export function mergeOrderItems(existingItems, newItems) {
  const map = new Map();

  for (const it of Array.isArray(existingItems) ? existingItems : []) {
    const key = itemKey(it);
    map.set(key, { ...it });
  }

  for (const it of Array.isArray(newItems) ? newItems : []) {
    const key = itemKey(it);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...it });
      continue;
    }

    const nextQty = (Number(prev.quantity) || 0) + (Number(it.quantity) || 0);
    const unitPrice = Number(prev.unitPrice) || 0;
    const modsTotal = modifiersTotal(prev.modifiers);
    map.set(key, {
      ...prev,
      quantity: nextQty,
      lineTotal: round2((unitPrice + modsTotal) * nextQty),
    });
  }

  return Array.from(map.values());
}

export function calculateTotalsFromItems(items) {
  const subtotal = round2(
    (Array.isArray(items) ? items : []).reduce((sum, it) => sum + (Number(it?.lineTotal) || 0), 0),
  );
  const taxRate = 0.08;
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + tax);
  return { subtotal, tax, total };
}

