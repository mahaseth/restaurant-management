import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./auth/authSlice";
import userPreferenceReducer from "./userPreferences/userPreferenceSlice";
import tableReducer from "./tables/tableSlice";
import menuReducer from "./menu/menuSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  userPreferences: userPreferenceReducer,
  tables: tableReducer,
  menu: menuReducer,
});

export default rootReducer;
