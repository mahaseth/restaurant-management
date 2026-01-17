import Restaurant from "../models/Restaurant.js";

const getRestaurantById = async (id) => {
  return await Restaurant.findById(id);
};

const updateRestaurant = async (id, data) => {
  return await Restaurant.findByIdAndUpdate(id, data, { new: true });
};

export default { getRestaurantById, updateRestaurant };
