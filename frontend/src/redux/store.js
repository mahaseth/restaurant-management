import { configureStore } from "@reduxjs/toolkit";
import { PERSIST, persistReducer } from "redux-persist";
import persistStore from "redux-persist/es/persistStore";
import rootReducer from "./rootReducer";
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const createWebStorage = () => {
  return {
    getItem(key) {
      return Promise.resolve(localStorage.getItem(key));
    },
    setItem(key, value) {
      return Promise.resolve(localStorage.setItem(key, value));
    },
    removeItem(key) {
      return Promise.resolve(localStorage.removeItem(key));
    },
  };
};

const storage = typeof window !== "undefined" ? createWebStorage() : createNoopStorage();

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [PERSIST],
      },
    }),
});

const persistor = persistStore(store);

export { store, persistor };
