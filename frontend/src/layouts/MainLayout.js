"use client";
import { useSelector } from "react-redux";
import { useEffect, useContext } from "react";
import { PrimeReactContext } from "primereact/api";

const MainLayout = ({ children }) => {
  const { theme } = useSelector((state) => state.userPreferences);
  const { changeTheme } = useContext(PrimeReactContext);

  useEffect(() => {
    let newTheme = theme === "dark" ? "lara-dark-blue" : "lara-light-blue";
    let prevTheme = theme === "dark" ? "lara-light-blue" : "lara-dark-blue";

    if (changeTheme) {
      changeTheme(prevTheme, newTheme, "theme-link", () => {
        console.log(`Theme changed to ${newTheme}`);
      });
    }
  }, [theme, changeTheme]);

  return <div className={theme}>{children}</div>;
};

export default MainLayout;
