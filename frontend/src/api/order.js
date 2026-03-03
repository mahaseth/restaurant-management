// All API calls for the Orders feature (staff view + by-table view).
// Uses the shared axios instance from @/api which handles:
// - base URL
// - Authorization header (Bearer token)

import api from "@/api";

const ORDER_ENDPOINT = "/api/order";

// =====================
// Staff: list + details
// =====================

export async function getRecentOrdersStaff({ status, limit, tableId } = {}) {
  const response = await api.get(`${ORDER_ENDPOINT}/staff/recent`, {
    params: {
      ...(status ? { status } : {}),
      ...(limit ? { limit } : {}),
      ...(tableId ? { tableId } : {}),
    },
  });
  return response.data;
}

export async function getRecentOrdersStaffByWindow({ status, limit, tableId, sinceHours, orderType } = {}) {
  const response = await api.get(`${ORDER_ENDPOINT}/staff/recent`, {
    params: {
      ...(status ? { status } : {}),
      ...(limit ? { limit } : {}),
      ...(tableId ? { tableId } : {}),
      ...(sinceHours !== undefined && sinceHours !== null ? { sinceHours } : {}),
      ...(orderType ? { orderType } : {}),
    },
  });
  return response.data;
}

export async function getOrderByIdStaff(orderId) {
  const response = await api.get(`${ORDER_ENDPOINT}/staff/${orderId}`);
  return response.data;
}

// =====================
// Public: by-table
// =====================

export async function getOrdersByTable(tableId, { status, limit } = {}) {
  const response = await api.get(`${ORDER_ENDPOINT}/${tableId}`, {
    params: {
      ...(status ? { status } : {}),
      ...(limit ? { limit } : {}),
    },
  });
  return response.data;
}

// =====================
// Staff: actions
// =====================

export async function updateOrderStatusStaff(orderId, { status, reason } = {}) {
  const response = await api.patch(`${ORDER_ENDPOINT}/staff/${orderId}/status`, { status, reason });
  return response.data;
}

export async function updateOrderPaymentStatusStaff(orderId, { paymentStatus } = {}) {
  const response = await api.patch(`${ORDER_ENDPOINT}/staff/${orderId}/payment-status`, { paymentStatus });
  return response.data;
}

export async function editOrderItemsStaff(orderId, { items, notes } = {}) {
  const response = await api.patch(`${ORDER_ENDPOINT}/staff/${orderId}/items`, { items, notes });
  return response.data;
}

export async function createOrderStaff({
  tableId,
  items,
  notes,
  paymentStatus,
  orderType,
  walkInName,
} = {}) {
  const response = await api.post(`${ORDER_ENDPOINT}/staff`, {
    tableId,
    items,
    notes,
    paymentStatus,
    orderType,
    walkInName,
  });
  return response.data;
}

