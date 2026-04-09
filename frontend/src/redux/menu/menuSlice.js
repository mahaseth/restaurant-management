// Redux slice for the Menu Management feature.
// Manages the menu items list, loading state, and errors.
// Handles all 4 actions: fetch, add, edit, remove.

import { createSlice } from "@reduxjs/toolkit";
import { fetchMenuItems, addMenuItem, editMenuItem, removeMenuItem, replaceMenuItemImage, removeMenuItemImage } from "./menuActions";

function sameMenuItemId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

const menuSlice = createSlice({
  name: "menu",
  initialState: {
    menuItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMenuError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) =>
    builder

      // --- Fetch all menu items ---
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Add a new menu item ---
      .addCase(addMenuItem.pending, (state) => {
        state.error = null;
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.menuItems.push(action.payload);
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Edit an existing menu item ---
      .addCase(editMenuItem.pending, (state) => {
        state.error = null;
      })
      .addCase(editMenuItem.fulfilled, (state, action) => {
        const index = state.menuItems.findIndex((item) =>
          sameMenuItemId(item._id, action.payload._id)
        );
        if (index !== -1) {
          state.menuItems[index] = action.payload;
        }
      })
      .addCase(editMenuItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Remove a menu item ---
      .addCase(removeMenuItem.pending, (state) => {
        state.error = null;
      })
      .addCase(removeMenuItem.fulfilled, (state, action) => {
        state.menuItems = state.menuItems.filter(
          (item) => !sameMenuItemId(item._id, action.payload)
        );
      })
      .addCase(removeMenuItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Replace image ---
      .addCase(replaceMenuItemImage.pending, (state) => {
        state.error = null;
      })
      .addCase(replaceMenuItemImage.fulfilled, (state, action) => {
        const index = state.menuItems.findIndex((item) =>
          sameMenuItemId(item._id, action.payload._id)
        );
        if (index !== -1) state.menuItems[index] = action.payload;
      })
      .addCase(replaceMenuItemImage.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Remove image ---
      .addCase(removeMenuItemImage.pending, (state) => {
        state.error = null;
      })
      .addCase(removeMenuItemImage.fulfilled, (state, action) => {
        const index = state.menuItems.findIndex((item) =>
          sameMenuItemId(item._id, action.payload._id)
        );
        if (index !== -1) state.menuItems[index] = action.payload;
      })
      .addCase(removeMenuItemImage.rejected, (state, action) => {
        state.error = action.payload;
      }),
});

export const { clearMenuError } = menuSlice.actions;

export default menuSlice.reducer;
