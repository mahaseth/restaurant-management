// Async thunks for the Tables feature.
// Each thunk calls the corresponding API function and handles errors.
// I'm following the same pattern I used in authActions.js.

import {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateTableQr,
} from "@/api/tables";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Helper to extract a readable error message from any backend response
const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  // Backend returns { error: "message" }
  if (data?.error) return data.error;

  // Backend returns a plain string like "User not authenticated."
  if (typeof data === "string") return data;

  // Network error or something else
  return error.message || fallback;
};

// Fetch all tables from the backend
export const fetchTables = createAsyncThunk(
  "tables/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllTables();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch tables"));
    }
  }
);

// Create a new table
export const addTable = createAsyncThunk(
  "tables/add",
  async (data, { rejectWithValue }) => {
    try {
      return await createTable(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create table"));
    }
  }
);

// Update an existing table
// I'm destructuring `id` out and passing the rest as the update data
export const editTable = createAsyncThunk(
  "tables/edit",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      return await updateTable(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update table"));
    }
  }
);

// Delete a table
// On success, I return the id so the slice can remove it from state
export const removeTable = createAsyncThunk(
  "tables/remove",
  async (id, { rejectWithValue }) => {
    try {
      await deleteTable(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete table"));
    }
  }
);

// Regenerate QR code for a table (updates the table record)
export const regenerateQr = createAsyncThunk(
  "tables/regenerateQr",
  async (id, { rejectWithValue }) => {
    try {
      return await regenerateTableQr(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to regenerate QR"));
    }
  }
);
