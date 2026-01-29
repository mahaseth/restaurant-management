"use client";

import { HOME_ROUTE } from "@/constants/routes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import navlinks from "@/constants/navlinks";

const Navlink = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex gap-5">
      {navlinks.map((navlink) => {
        const isActive =
          pathname == navlink.route ||
          (navlink.route !== HOME_ROUTE && pathname.startsWith(navlink.route));

        return (
          <Link
            key={navlink.route}
            href={navlink.route}
            className={`${
              isActive ? "text-primary" : "text-gray-700 dark:text-gray-300"
            }  font-medium hover:text-primary`}
          >
            {navlink.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navlink;
