import { FaBars } from "react-icons/fa";

import Logo from "./Logo";
import Navlink from "./Navlink.js";
import ThemeToggler from "./ThemeToggler";
import User from "./User";

const Header = () => {
  return (
    <>
      <div className="w-full text-center py-2 text-xs font-medium tracking-wider uppercase text-white bg-primary">
        Welcome to RestoSmart — The Future of Modern QR Ordering & POS
      </div>
      <header className="w-full bg-white dark:bg-gray-950 sticky top-0 shadow z-50">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Navlink />
            <div className="flex items-center gap-2">
              <ThemeToggler />
              <User />
              <button className="block md:hidden text-gray-700 px-2 py-1 dark:text-gray-300">
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
