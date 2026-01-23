import express from "express";
import userController from "../controllers/user.controller.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import { ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]),
  userController.getUsers
);
router.post(
  "/",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]),
  userController.createUser
);
router.patch(
  "/:id",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]),
  userController.updateUser
);
router.delete(
  "/:id",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]),
  userController.deleteUser
);
router.post("/change-password", userController.changePassword);
router.patch("/profile-image", userController.updateProfileImage);

export default router;
