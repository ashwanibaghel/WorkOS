import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize, canManage } from "../middlewares/rbac.js";
import { validate } from "../middlewares/validate.js";
import { userSchemas } from "../validators/schemas.js";

export const userRoutes = Router();

userRoutes.get("/", authenticate, canManage, userController.list);
userRoutes.patch("/:userId/role", authenticate, authorize("admin"), validate(userSchemas.updateRole), userController.updateRole);
