"use client";

import { Provider } from "react-redux";
import { PrimeReactProvider } from "primereact/api";
import { persistor, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";

const AppProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
      </PersistGate>
    </Provider>
  );
};

export default AppProvider;
