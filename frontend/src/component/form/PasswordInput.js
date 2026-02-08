import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = (props) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        placeholder="Please enter your password"
        className="mt-2 rounded-md ring ring-gray-200 focus:ring-2 focus:ring-primary outline-none px-3 py-3 w-full dark:bg-gray-900/50 dark:ring-gray-800 dark:text-white dark:placeholder-gray-500 transition"
        required
        type={show ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-1 top-4 p-2 cursor-pointer dark:text-gray-400"
      >
        {show ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );
};

export default PasswordInput;
