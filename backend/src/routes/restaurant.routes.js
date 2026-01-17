import express from "express";
import restaurantController from "../controllers/restaurant.controller.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]),
  restaurantController.getRestaurantSettings
);

router.patch(
  "/",
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER]),
  restaurantController.updateRestaurantSettings
);

export default router;
