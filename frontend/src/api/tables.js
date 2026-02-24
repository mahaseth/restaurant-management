// All my API calls for the Tables feature.
// I'm using the shared axios instance from @/api which already
// handles the base URL and auth token for me.

import api from "@/api";

const TABLES_ENDPOINT = "/api/tables";

// Get all tables for my restaurant
export async function getAllTables() {
  const response = await api.get(TABLES_ENDPOINT);
  return response.data;
}

// Get a single table by its ID
export async function getTableById(id) {
  const response = await api.get(`${TABLES_ENDPOINT}/${id}`);
  return response.data;
}

// Create a new table
export async function createTable({ tableNumber, capacity, status }) {
  const response = await api.post(TABLES_ENDPOINT, {
    tableNumber,
    capacity,
    status,
  });
  return response.data;
}

// Update an existing table
export async function updateTable(id, { tableNumber, capacity, status }) {
  const response = await api.put(`${TABLES_ENDPOINT}/${id}`, {
    tableNumber,
    capacity,
    status,
  });
  return response.data;
}

// Delete a table
export async function deleteTable(id) {
  const response = await api.delete(`${TABLES_ENDPOINT}/${id}`);
  return response.data;
}

// Regenerate QR code for a table (useful after changing APP_URL / host)
export async function regenerateTableQr(id) {
  const response = await api.post(`${TABLES_ENDPOINT}/${id}/regenerate-qr`);
  return response.data;
}
