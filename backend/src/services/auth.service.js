import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

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

  const restaurant = await Restaurant.findOne({_id: user.restaurantId});
  if(!restaurant) {
    throw {
      status: 404,
      message: "User doesnot belong to any restaturant."
    }
  }
  return {
    restaurant: {
      _id: restaurant._id,
      name: restaurant.name,
      address: restaurant.address,
      subscriptionPlan: restaurant.subscriptionPlan
    },
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles
    }
  }
};

const register = async (data) => {
  const restaurant = await Restaurant.findOne({ name: data?.restaurant?.name })
  if(restaurant) {
    throw {
      status: 409,
      message: "Restaurant with same name already exists."
    }
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
    address: data?.restaurant?.address
  })

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
      subscriptionPlan: newRestaurant.subscriptionPlan
    },
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      isActive: newUser.isActive,
      roles: newUser.roles
    }
  };
};

export default { register, login };
