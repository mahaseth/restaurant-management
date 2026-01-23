import restaurantService from "../services/restaurant.service.js";

const getRestaurantSettings = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.restaurant._id);
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateRestaurantSettings = async (req, res) => {
  try {
    const data = await restaurantService.updateRestaurant(req.restaurant._id, req.body);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

export default { getRestaurantSettings, updateRestaurantSettings };
