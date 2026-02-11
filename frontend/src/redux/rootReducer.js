import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./auth/authSlice";
import userPreferenceReducer from "./userPreferences/userPreferenceSlice";
import tableReducer from "./tables/tableSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  userPreferences: userPreferenceReducer,
  tables: tableReducer,
});

export default rootReducer;
