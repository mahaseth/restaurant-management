import express from "express";
import authController from "../controllers/auth.controller.js";
import validate from "../middlewares/validators.js";
import {
  forgetPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../libs/schemas/auth.js";

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/register-restaurant",
  validate(registerSchema),
  authController.register
);
router.post(
  "/forget-password",
  validate(forgetPasswordSchema),
  authController.forgetPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
