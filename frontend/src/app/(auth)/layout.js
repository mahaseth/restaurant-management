"use client";

import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_ROUTE } from "@/constants/routes";
import Header from "@/component/Header";
import Footer from "@/component/Footer";

const AuthLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  const router = useRouter();

  useEffect(() => {
    if (user) router.push(DASHBOARD_ROUTE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <>
      <Header />
      <section className="bg-slate-50 dark:bg-slate-950 flex-1 py-20 flex items-center justify-center">
        <div className="container mx-auto px-6">{children}</div>
      </section>
      <Footer />
    </>
  );
};

export default AuthLayout;
