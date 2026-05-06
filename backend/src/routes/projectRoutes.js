import { Router } from "express";
import { projectController } from "../controllers/projectController.js";
import { authenticate } from "../middlewares/auth.js";
import { canManage } from "../middlewares/rbac.js";
import { validate } from "../middlewares/validate.js";
import { projectSchemas } from "../validators/schemas.js";

export const projectRoutes = Router();

projectRoutes.use(authenticate);
projectRoutes.route("/")
  .get(projectController.list)
  .post(canManage, validate(projectSchemas.create), projectController.create);

projectRoutes.route("/:projectId")
  .get(validate(projectSchemas.id), projectController.get)
  .patch(canManage, validate(projectSchemas.update), projectController.update)
  .delete(canManage, validate(projectSchemas.id), projectController.remove);

projectRoutes.get("/:projectId/activity", validate(projectSchemas.id), projectController.activity);
projectRoutes.post("/:projectId/members/:memberId", canManage, validate(projectSchemas.member), projectController.addMember);
projectRoutes.delete("/:projectId/members/:memberId", canManage, validate(projectSchemas.member), projectController.removeMember);
