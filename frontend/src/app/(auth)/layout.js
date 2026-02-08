"use client";

import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HOME_ROUTE } from "@/constants/routes";

const AuthLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  const router = useRouter();

  useEffect(() => {
    if (user) router.push(HOME_ROUTE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <section className="bg-slate-50 dark:bg-slate-950 min-h-screen py-5 flex items-center justify-center">
      <div className="container mx-auto px-6">{children}</div>
    </section>
  );
};

export default AuthLayout;
