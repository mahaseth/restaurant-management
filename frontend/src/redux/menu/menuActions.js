// Async thunks for the Menu Management feature.
// Each thunk calls the corresponding API function and handles errors.
// Following the same pattern used in tableActions.js.

import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/api/menu";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Helper to extract a readable error message from any backend response
const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  // Backend returns { error: "message" }
  if (data?.error) return data.error;

  // Backend returns a plain string
  if (typeof data === "string") return data;

  // Network error or something else
  return error.message || fallback;
};

// Fetch all menu items from the backend
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllMenuItems();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch menu items"));
    }
  }
);

// Create a new menu item
export const addMenuItem = createAsyncThunk(
  "menu/add",
  async (data, { rejectWithValue }) => {
    try {
      return await createMenuItem(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create menu item"));
    }
  }
);

// Update an existing menu item
// Destructure `id` out and pass the rest as the update data
export const editMenuItem = createAsyncThunk(
  "menu/edit",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      return await updateMenuItem(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update menu item"));
    }
  }
);

// Delete a menu item
// On success, return the id so the slice can remove it from state
export const removeMenuItem = createAsyncThunk(
  "menu/remove",
  async (id, { rejectWithValue }) => {
    try {
      await deleteMenuItem(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete menu item"));
    }
  }
);
