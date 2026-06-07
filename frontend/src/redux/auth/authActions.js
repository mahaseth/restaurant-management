import { login, signUp } from "@/api/auth";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginUser = createAsyncThunk(
  "login",
  async (data, { rejectWithValue }) => {
    try {
      const result = await login(data);

      localStorage.setItem("authToken", result.token);

      return result;
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || error.message || "Login failed";
      return rejectWithValue(message);
    }
  },
);

export const registerUser = createAsyncThunk(
  "signup",
  async (data, { rejectWithValue }) => {
    try {
      const result = await signUp(data);

      localStorage.setItem("authToken", result.token);

      return result;
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || error.message || "Registration failed";
      return rejectWithValue(message);
    }
  },
);


/**
 * Pending (Loading)
 * Fulfilled (Success)
 * Rejected (Error)
 */
