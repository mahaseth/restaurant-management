import bcrypt from "bcryptjs";
import User from "../models/User.js";

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

  return {
    _id: user._id,
    address: user.address,
    name: user.name,
    email: user.email,
    roles: user.roles,
    phone: user.phone,
    isActive: user.isActive,
  };
};

const register = async (data) => {
  const user = await User.findOne({
    $or: [{ email: data?.email }, { phone: data?.phone }],
  });

  if (user)
    throw {
      status: 409,
      message: "User already exists.",
    };

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(data.password, salt);

  const newUser = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    password: hashedPassword,
  });
  return {
    _id: newUser._id,
    address: newUser.address,
    name: newUser.name,
    email: newUser.email,
    roles: newUser.roles,
    phone: newUser.phone,
    isActive: newUser.isActive,
  };
};

export default { register, login };
