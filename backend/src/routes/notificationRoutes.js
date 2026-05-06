import { Router } from "express";
import { notificationController } from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { notificationSchemas } from "../validators/schemas.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", notificationController.list);
notificationRoutes.patch("/:notificationId/read", validate(notificationSchemas.markRead), notificationController.markRead);
