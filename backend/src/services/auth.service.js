import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import ResetPassword from "../models/ResetPassword.js";
import crypto from "crypto";
import config from "../config/config.js";
import sendEmail from "../utils/email.js";

const login = async (data) => {
  const user = await User.findOne({
    $or: [{ email: data?.email }, { phone: data?.phone }],
  });

  if (!user)
    throw {
      status: 404,
      message: "User not found.",
    };

  const isPasswordMatch = bcrypt.compareSync(data.password, user.password);

  if (!isPasswordMatch)
    throw { status: 400, message: "Incorrect email or password." };

  const restaurant = await Restaurant.findOne({ _id: user.restaurantId });
  if (!restaurant) {
    throw {
      status: 404,
      message: "User doesnot belong to any restaturant.",
    };
  }
  return {
    restaurant: {
      _id: restaurant._id,
      name: restaurant.name,
      address: restaurant.address,
      subscriptionPlan: restaurant.subscriptionPlan,
    },
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles,
    },
  };
};

const register = async (data) => {
  const restaurant = await Restaurant.findOne({ name: data?.restaurant?.name });
  if (restaurant) {
    throw {
      status: 409,
      message: "Restaurant with same name already exists.",
    };
  }

  const user = await User.findOne({
    $or: [{ email: data?.owner?.email }, { phone: data?.owner?.phone }],
  });

  if (user)
    throw {
      status: 409,
      message: "Owner with same eamil or phone number already exists.",
    };

  const newRestaurant = await Restaurant.create({
    name: data?.restaurant?.name,
    email: data?.owner?.email,
    phone: data?.owner?.phone,
    address: data?.restaurant?.address,
  });

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(data?.owner?.password, salt);

  const newUser = await User.create({
    restaurantId: newRestaurant._id,
    name: data?.owner?.name,
    email: data?.owner?.email,
    phone: data?.owner?.phone,
    password: hashedPassword,
  });

  return {
    restaurant: {
      _id: newRestaurant._id,
      name: newRestaurant.name,
      address: newRestaurant.address,
      subscriptionPlan: newRestaurant.subscriptionPlan,
    },
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      isActive: newUser.isActive,
      roles: newUser.roles,
    },
  };
};

const forgetPassword = async (email) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw {
      status: 404,
      message: "User with this email does not exist.",
    };
  }

  const token = crypto.randomUUID();

  await ResetPassword.create({
    userId: user._id,
    token: token,
  });

  const resetPasswordLink = `${config.appUrl}/api/auth/reset-password?userId=${user._id}&token=${token}`;

  await sendEmail(email, {
    subject: "Reset password link",
    html: `
      <div style="padding: 16px; font-family: sans-serif">
        <h1>Please click the link to reset your password.</h1>
        <a
          href="${resetPasswordLink}"
          style="
            background-color: dodgerblue;
            color: white;
            text-decoration: none;
            padding: 10px 32px;
            border-radius: 8px;
          "
        >
          Reset password
        </a>
      </div>
    `,
  });

  return { message: "Reset password link sent successfully." };
};

const resetPassword = async (userId, token, password) => {
  const resetPasswordRecord = await ResetPassword.findOne({
    userId: userId,
    expiresAt: { $gt: Date.now() },
  }).sort({ createdAt: -1 });

  // verify user and token
  if (!resetPasswordRecord || resetPasswordRecord.token !== token) {
    throw {
      status: 400,
      message: "Invalid or expired token.",
    };
  }

  if (resetPasswordRecord.isUsed) {
    throw {
      status: 400,
      message: "This reset password link has already been used.",
    };
  }

  // reset password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  await ResetPassword.findByIdAndUpdate(resetPasswordRecord._id, {
    isUsed: true,
  });

  return { message: "Password reset successfully." };
};

export default { register, login, forgetPassword, resetPassword };
