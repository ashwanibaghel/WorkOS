import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { authSchemas } from "../validators/schemas.js";

export const authRoutes = Router();

authRoutes.post("/signup", validate(authSchemas.signup), authController.signup);
authRoutes.post("/login", validate(authSchemas.login), authController.login);
authRoutes.get("/verify-email/:token", validate(authSchemas.verifyEmail), authController.verifyEmail);
authRoutes.post("/resend-verification", validate(authSchemas.resendVerification), authController.resendVerification);
authRoutes.post("/google", validate(authSchemas.google), authController.google);
authRoutes.get("/me", authenticate, authController.me);
