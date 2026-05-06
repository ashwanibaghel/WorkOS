import { Router } from "express";
import { taskController } from "../controllers/taskController.js";
import { authenticate } from "../middlewares/auth.js";
import { canManage } from "../middlewares/rbac.js";
import { validate } from "../middlewares/validate.js";
import { taskSchemas } from "../validators/schemas.js";

export const taskRoutes = Router();

taskRoutes.use(authenticate);
taskRoutes.get("/project/:projectId", validate(taskSchemas.list), taskController.list);
taskRoutes.post("/", canManage, validate(taskSchemas.create), taskController.create);
taskRoutes.patch("/:taskId", validate(taskSchemas.update), taskController.update);
taskRoutes.delete("/:taskId", canManage, validate(taskSchemas.remove), taskController.remove);
