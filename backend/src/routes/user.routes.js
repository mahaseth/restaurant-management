import express from "express";
import userController from "../controllers/user.controller.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import {
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_CASHIER,
  ROLE_WAITER,
  ROLE_KITCHEN,
} from "../constants/roles.js";

const router = express.Router();

// Current user profile (any authenticated user)
router.get("/me", userController.getMe);
router.patch(
  "/me/active",
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]),
  userController.updateMyActiveStatus
);

router.get(
  "/",
  // Every staff member can view staff list
  roleBasedAuth([ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN]),
  userController.getUsers
);
router.post(
  "/",
  roleBasedAuth([ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]),
  userController.createUser
);

// IMPORTANT: Put fixed paths before "/:id" to avoid route collisions.
// Otherwise "/profile-image" gets treated as ":id" = "profile-image".
router.post("/change-password", userController.changePassword);
router.patch("/profile-image", userController.updateProfileImage);
router.delete("/profile-image", userController.removeProfileImage);

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

export default router;
