// backend/src/routes/auth.routes.js
import express from "express";
import authController from "../controllers/auth.controller.js";
import validate from "../middlewares/validators.js";
import { loginSchema, registerSchema } from "../libs/schemas/auth.js";

const router = express.Router();
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

export default router;