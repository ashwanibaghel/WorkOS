import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticate } from "../middlewares/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", authenticate, dashboardController.overview);
