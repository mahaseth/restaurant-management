import express from "express";
import { homeController } from "../controllers/home.controller.js";

const homeRouter = express.Router();

homeRouter.get("/", homeController);

export { homeRouter };
