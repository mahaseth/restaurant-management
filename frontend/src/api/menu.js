// All API calls for the Menu Management feature.
// Uses the shared axios instance from @/api which handles
// the base URL and auth token automatically.

import api from "@/api";

const MENU_ENDPOINT = "/api/menuitems";

// Get all menu items for the restaurant
export async function getAllMenuItems() {
  const response = await api.get(MENU_ENDPOINT);
  return response.data;
}

// Get a single menu item by ID
export async function getMenuItemById(id) {
  const response = await api.get(`${MENU_ENDPOINT}/${id}`);
  return response.data;
}

// Create a new menu item (body may include optional RAG fields: ingredients, allergens, dietaryTags, spiceLevel, cuisineType)
export async function createMenuItem(data) {
  const response = await api.post(MENU_ENDPOINT, data);
  return response.data;
}

// Update an existing menu item
export async function updateMenuItem(id, data) {
  const response = await api.put(`${MENU_ENDPOINT}/${id}`, data);
  return response.data;
}

// Delete a menu item
export async function deleteMenuItem(id) {
  const response = await api.delete(`${MENU_ENDPOINT}/${id}`);
  return response.data;
}

// =====================
// Image helpers
// =====================

export async function replaceMenuItemImage(id, file) {
  const form = new FormData();
  form.append("image", file);

  const response = await api.post(`${MENU_ENDPOINT}/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteMenuItemImage(id) {
  const response = await api.delete(`${MENU_ENDPOINT}/${id}/image`);
  return response.data;
}
