"use client";
import { useSelector } from "react-redux";
import { useEffect, useContext } from "react";
import { PrimeReactContext } from "primereact/api";

const MainLayout = ({ children }) => {
  const { theme } = useSelector((state) => state.userPreferences);
  const { changeTheme } = useContext(PrimeReactContext);

  useEffect(() => {
    // PrimeReact Dialog/Overlay components can render outside the app root (portals).
    // Toggling the class on <html> ensures dark mode styles apply everywhere.
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }

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
