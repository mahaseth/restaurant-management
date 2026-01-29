import { FaUtensils } from "react-icons/fa";
import { HOME_ROUTE } from "@/constants/routes";
import config from "@/config/config";
import Link from "next/link";

const Logo = () => {
  return (
    <h1 className="text-xl font-semibold text-primary">
      <Link href={HOME_ROUTE} className="flex items-center gap-1">
        <FaUtensils /> {config.appName}
      </Link>
    </h1>
  );
};

export default Logo;
