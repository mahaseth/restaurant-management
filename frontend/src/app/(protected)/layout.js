"use client";

import LeftNav from "@/component/LeftNav";
import ProtectedHeader from "@/component/ProtectedHeader";
import Spinner from "@/component/Spinner";
import { LOGIN_ROUTE } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const ProtectedLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  const router = useRouter();

  useEffect(() => {
    if (!user) router.push(LOGIN_ROUTE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user)
    return (
      <div className="flex">
        <LeftNav />
        <div className="flex-1 flex flex-col sm:ml-64 min-h-screen transition-all duration-300">
          <ProtectedHeader />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    );

  return (
    <div className="py-24 flex items-center justify-center">
      <Spinner className="h-20 w-20 fill-primary" />
    </div>
  );
};

export default ProtectedLayout;
