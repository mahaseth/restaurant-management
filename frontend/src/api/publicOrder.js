// API helpers for the public QR ordering experience.
// These endpoints are public (no login required).

import api from "@/api";

export async function getPublicMenuItems(restaurantId) {
  const response = await api.get("/api/menuitems/public", {
    params: { restaurantId },
  });
  return response.data;
}

export async function getPublicTableInfo(tableId, restaurantId) {
  const response = await api.get(`/api/public/table/${tableId}`, {
    params: { restaurantId },
  });
  return response.data;
}

export async function createOrderPublic({ tableId, restaurantId, items, notes, clientOrderId, customerEmail, stripePaymentIntentId }) {
  const response = await api.post("/api/order", {
    tableId,
    restaurantId,
    items,
    notes,
    clientOrderId,
    customerEmail,
    stripePaymentIntentId,
  });
  return response.data;
}

export async function getPublicOrderByNumber(orderNumber, { tableId, restaurantId }) {
  const response = await api.get(`/api/public/order/${encodeURIComponent(orderNumber)}`, {
    params: { tableId, restaurantId },
  });
  return response.data;
}

export async function addItemsToPublicOrder(orderNumber, { tableId, restaurantId, items, notes, customerEmail }) {
  const response = await api.patch(`/api/public/order/${encodeURIComponent(orderNumber)}/items`, {
    tableId,
    restaurantId,
    items,
    notes,
    customerEmail,
  });
  return response.data;
}

