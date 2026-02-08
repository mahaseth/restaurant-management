"use client";

import { LOGIN_ROUTE } from "@/constants/routes";
import { registerUser } from "@/redux/auth/authActions";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import Logo from "@/component/Logo";
import Spinner from "@/component/Spinner";
import PasswordInput from "@/component/form/PasswordInput";

const RegisterPage = () => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      country: "Nepal",
    },
  });

  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  function submitForm(data) {
    dispatch(registerUser(data));
  }

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="flex mt-8 mb-16 items-center justify-center w-full px-4">
      <div className="flex w-full flex-col max-w-2xl gap-8">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="text-center">
            <h2 className="text-4xl font-semibold text-gray-900 dark:text-white">Create Account</h2>
            <p className="mt-2 text-base text-gray-500/90 dark:text-gray-400">
              Join RestoSmart and start managing your restaurant efficiently.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-8">
          {/* Restaurant Details Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              Restaurant Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Restaurant Name</label>
                <input
                  placeholder="Enter your restaurant's name"
                  className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                  required
                  type="text"
                  {...register("restaurantName")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">City</label>
                  <input
                    placeholder="City"
                    className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                    type="text"
                    {...register("city")}
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">Province</label>
                  <input
                    placeholder="Province"
                    className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                    type="text"
                    {...register("province")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">Street</label>
                  <input
                    placeholder="Street / Area"
                    className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                    type="text"
                    {...register("street")}
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">Country</label>
                  <input
                    placeholder="Country"
                    className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                    required
                    type="text"
                    {...register("country")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Details Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              Owner Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Owner Full Name</label>
                <input
                  placeholder="Owner's Name"
                  className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                  required
                  type="text"
                  {...register("ownerName")}
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input
                  placeholder="Phone number"
                  className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                  required
                  type="tel"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  placeholder="Email to be used for login"
                  className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full transition bg-white dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500"
                  required
                  type="email"
                  {...register("email")}
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="mt-2">
                  <PasswordInput {...register("password")} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 disabled:opacity-80 py-4 w-full cursor-pointer rounded-md bg-primary text-white font-medium text-lg shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-[0.98]"
            >
              Finish Registration
              {loading && <Spinner className="h-6 w-6 fill-white" />}
            </button>
            <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
              Already have an account?
              <Link
                href={LOGIN_ROUTE}
                className="text-primary font-medium hover:underline ml-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
