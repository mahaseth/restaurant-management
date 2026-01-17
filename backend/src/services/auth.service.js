import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

const login = async ({ email, phone, password }) => {
  const user = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const restaurant = await Restaurant.findById(user.restaurantId);
  if (!restaurant) {
    throw { status: 404, message: "Restaurant not found" };
  }

  return {
    userId: user._id,
    restaurantId: restaurant._id,
    user: {
      name: user.name,
      roles: user.roles
    },
    restaurant: {
      res_name: restaurant.res_name,
      address: restaurant.address,
      phoneNo: restaurant.phoneNo,
      panNo: restaurant.panNo,
      regNo: restaurant.regNo
    }
  };
};

const register = async (data) => {
  const exists = await Restaurant.findOne({ res_name: data.restaurant.name });
  if (exists) {
    throw { status: 409, message: "Restaurant exists" };
  }

  const restaurant = await Restaurant.create({
    res_name: data.restaurant.name,
    address: data.restaurant.address,
    phoneNo: data.restaurant.phoneNo ,
    panNo: data.restaurant.panNo || "",
    regNo: data.restaurant.regNo || ""
  });

  const hash = bcrypt.hashSync(data.owner.password, 10);

  const user = await User.create({
    restaurantId: restaurant._id,
    name: data.owner.name,
    email: data.owner.email,
    phone: data.owner.phone,
    password: hash,
    roles: ["OWNER"]
  });

  return {
    userId: user._id,
    restaurantId: restaurant._id
  };
};

export default { login, register };
