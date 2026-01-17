// backend/src/routes/user.routes.js
import express from "express";
import userController from "../controllers/user.controller.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import { ROLE_OWNER, ROLE_ADMIN } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER]),
  userController.getUsers
);
router.post(
  "/",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER]),
  userController.createUser
);
router.patch("/profile-image", userController.updateProfileImage);

export default router;
