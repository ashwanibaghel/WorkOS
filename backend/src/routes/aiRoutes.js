import { Router } from "express";
import { aiController } from "../controllers/aiController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { aiSchemas } from "../validators/schemas.js";

export const aiRoutes = Router();

aiRoutes.use(authenticate);
aiRoutes.post("/breakdown", validate(aiSchemas.breakdown), aiController.breakdown);
aiRoutes.post("/description", validate(aiSchemas.description), aiController.description);
aiRoutes.post("/dashboard/chat", validate(aiSchemas.dashboardChat), aiController.dashboardChat);
aiRoutes.post("/tasks/:taskId/review", validate(aiSchemas.taskReview), aiController.reviewTask);
aiRoutes.get("/projects/:projectId/suggestions", validate(aiSchemas.projectId), aiController.suggestions);
aiRoutes.get("/projects/:projectId/summary", validate(aiSchemas.projectId), aiController.summary);
aiRoutes.post("/projects/:projectId/chat", validate(aiSchemas.chat), aiController.chat);
