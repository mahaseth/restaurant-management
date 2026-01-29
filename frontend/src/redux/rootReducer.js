import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./auth/authSlice";
import userPreferenceReducer from "./userPreferences/userPreferenceSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  userPreferences: userPreferenceReducer,
});

export default rootReducer;
