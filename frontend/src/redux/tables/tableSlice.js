// Redux slice for the Tables feature.
// Manages the tables list, loading state, and errors.
// I handle all 4 actions: fetch, add, edit, remove.

import { createSlice } from "@reduxjs/toolkit";
import { fetchTables, addTable, editTable, removeTable } from "./tableActions";

const tableSlice = createSlice({
  name: "tables",
  initialState: {
    tables: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTableError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) =>
    builder

      // --- Fetch all tables ---
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Add a new table ---
      // After adding, I sort by tableNumber so the list stays in order
      .addCase(addTable.pending, (state) => {
        state.error = null;
      })
      .addCase(addTable.fulfilled, (state, action) => {
        state.tables.push(action.payload);
        state.tables.sort((a, b) => a.tableNumber - b.tableNumber);
      })
      .addCase(addTable.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Edit an existing table ---
      // I find the table by _id and replace it with the updated one
      .addCase(editTable.pending, (state) => {
        state.error = null;
      })
      .addCase(editTable.fulfilled, (state, action) => {
        const index = state.tables.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        state.tables.sort((a, b) => a.tableNumber - b.tableNumber);
      })
      .addCase(editTable.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Remove a table ---
      // I filter out the deleted table using the returned id
      .addCase(removeTable.pending, (state) => {
        state.error = null;
      })
      .addCase(removeTable.fulfilled, (state, action) => {
        state.tables = state.tables.filter((t) => t._id !== action.payload);
      })
      .addCase(removeTable.rejected, (state, action) => {
        state.error = action.payload;
      }),
});

export const { clearTableError } = tableSlice.actions;

export default tableSlice.reducer;
