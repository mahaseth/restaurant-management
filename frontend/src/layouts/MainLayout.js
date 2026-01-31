"use client";
import { useSelector } from "react-redux";

const MainLayout = ({ children }) => {
  const state = useSelector((state) => state.userPreferences);

  return <div className={state.theme}>{children}</div>;
};

export default MainLayout;
