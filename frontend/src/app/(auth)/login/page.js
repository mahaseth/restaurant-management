"use client";

import { loginUser } from "@/redux/auth/authActions";
import { REGISTER_ROUTE } from "@/constants/routes";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import Spinner from "@/component/Spinner";
import Logo from "@/component/Logo";
import PasswordInput from "@/component/form/PasswordInput";

const LoginPage = () => {
  const { register, handleSubmit } = useForm();

  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  function submitForm(data) {
    dispatch(loginUser(data));
  }

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center w-full px-4">
      <div className="flex w-full flex-col max-w-96 gap-5">
        <Logo />
        <form onSubmit={handleSubmit(submitForm)}>
          <h2 className="text-4xl font-medium text-gray-900 dark:text-white">Sign in</h2>
          <p className="mt-4 text-base text-gray-500/90 dark:text-gray-400">
            Please enter email and password to access.
          </p>
          <div className="mt-10">
            <label className="font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              placeholder="Please enter your email"
              className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500 transition"
              required
              type="email"
              {...register("email")}
            />
          </div>
          <div className="mt-6">
            <label className="font-medium text-gray-700 dark:text-gray-300">Password</label>
            <PasswordInput {...register("password")} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-3 mt-8 py-3 w-full cursor-pointer rounded-md bg-primary text-white transition hover:bg-blue-700 disabled:opacity-80"
          >
            Login
            {loading && <Spinner className="h-6 w-6 fill-primary" />}
          </button>
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?
            <Link
              href={REGISTER_ROUTE}
              className="text-primary hover:underline ml-2"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
