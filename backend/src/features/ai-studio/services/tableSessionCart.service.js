import mongoose from "mongoose";
import MenuItem from "../../../models/MenuItem.js";
import * as tableChatSessionRepo from "../../../repositories/tableChatSession.repository.js";

const MAX_QTY = 99;

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function normalizeCartDoc(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    return { items: [], subtotal: 0, updatedAt: new Date() };
  }
  return {
    items: cart.items.map((it) => ({
      menuItemId: it.menuItemId,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(it.quantity) || 1))),
      notes: typeof it.notes === "string" ? it.notes.trim().slice(0, 500) : "",
    })),
    subtotal: round2(Number(cart.subtotal) || 0),
    updatedAt: cart.updatedAt || new Date(),
  };
}

function recomputeSubtotal(items) {
  const subtotal = items.reduce((sum, it) => sum + round2(Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  return round2(subtotal);
}

async function loadSession(sessionToken) {
  const token = String(sessionToken || "").trim();
  if (!token) return null;
  return tableChatSessionRepo.findSessionByToken(token);
}

async function validateMenuItemForRestaurant(menuItemId, restaurantId) {
  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    throw new Error("Invalid menu item");
  }
  const item = await MenuItem.findById(menuItemId).lean();
  if (!item) throw new Error("Menu item not found");
  if (String(item.restaurantId) !== String(restaurantId)) throw new Error("Menu item not available here");
  if (item.available === false) throw new Error(`${item.name} is currently unavailable`);
  return item;
}

export function serializeCart(cart) {
  const c = normalizeCartDoc(cart);
  return {
    items: c.items.map((it) => ({
      menuItemId: String(it.menuItemId),
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      notes: it.notes || "",
      lineTotal: round2(it.price * it.quantity),
    })),
    subtotal: recomputeSubtotal(c.items),
    updatedAt: c.updatedAt,
  };
}

export async function getCart(sessionToken) {
  const session = await loadSession(sessionToken);
  if (!session) return null;
  return serializeCart(session.cart);
}

export async function addCartItem(sessionToken, body) {
  const session = await loadSession(sessionToken);
  if (!session) return null;

  const menuItemId = body?.menuItemId;
  let qty = Math.floor(Number(body?.quantity) || 1);
  if (qty < 1) throw new Error("Quantity must be at least 1");
  if (qty > MAX_QTY) qty = MAX_QTY;

  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 500) : "";
  const item = await validateMenuItemForRestaurant(menuItemId, session.restaurantId);

  const cart = normalizeCartDoc(session.cart);
  const price = round2(Number(item.price) || 0);
  const idx = cart.items.findIndex(
    (it) => String(it.menuItemId) === String(menuItemId) && (it.notes || "") === notes
  );
  if (idx >= 0) {
    const nextQty = Math.min(MAX_QTY, cart.items[idx].quantity + qty);
    cart.items[idx].quantity = nextQty;
    cart.items[idx].price = price;
    cart.items[idx].name = item.name;
  } else {
    cart.items.push({
      menuItemId: item._id,
      name: item.name,
      price,
      quantity: qty,
      notes,
    });
  }
  cart.subtotal = recomputeSubtotal(cart.items);
  await tableChatSessionRepo.saveCart(session._id, cart);
  return serializeCart(cart);
}

export async function updateCartItemQuantity(sessionToken, menuItemId, body) {
  const session = await loadSession(sessionToken);
  if (!session) return null;

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) throw new Error("Invalid menu item");
  let qty = Math.floor(Number(body?.quantity));
  if (!Number.isFinite(qty)) throw new Error("quantity is required");

  const cart = normalizeCartDoc(session.cart);
  const idx = cart.items.findIndex((it) => String(it.menuItemId) === String(menuItemId));
  if (idx < 0) throw new Error("Item not in cart");

  if (qty <= 0) {
    cart.items.splice(idx, 1);
  } else {
    if (qty > MAX_QTY) qty = MAX_QTY;
    const item = await validateMenuItemForRestaurant(menuItemId, session.restaurantId);
    cart.items[idx].quantity = qty;
    cart.items[idx].price = round2(Number(item.price) || 0);
    cart.items[idx].name = item.name;
  }
  cart.subtotal = recomputeSubtotal(cart.items);
  await tableChatSessionRepo.saveCart(session._id, cart);
  return serializeCart(cart);
}

export async function removeCartItem(sessionToken, menuItemId) {
  const session = await loadSession(sessionToken);
  if (!session) return null;

  if (!mongoose.Types.ObjectId.isValid(menuItemId)) throw new Error("Invalid menu item");

  const cart = normalizeCartDoc(session.cart);
  const next = cart.items.filter((it) => String(it.menuItemId) !== String(menuItemId));
  if (next.length === cart.items.length) throw new Error("Item not in cart");
  cart.items = next;
  cart.subtotal = recomputeSubtotal(cart.items);
  await tableChatSessionRepo.saveCart(session._id, cart);
  return serializeCart(cart);
}

export async function clearSessionCart(sessionToken) {
  const session = await loadSession(sessionToken);
  if (!session) return null;
  const empty = { items: [], subtotal: 0, updatedAt: new Date() };
  await tableChatSessionRepo.saveCart(session._id, empty);
  return serializeCart(empty);
}
