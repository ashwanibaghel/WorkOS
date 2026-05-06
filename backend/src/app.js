import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { projectRoutes } from "./routes/projectRoutes.js";
import { taskRoutes } from "./routes/taskRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

export const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || env.clientUrls.includes(origin)),
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);
