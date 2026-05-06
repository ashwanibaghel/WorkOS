import { env } from "../config/env.js";

export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.isOperational ? error.message : "Internal server error"
  };

  if (error.details) payload.details = error.details;
  if (env.nodeEnv !== "production") payload.stack = error.stack;

  res.status(statusCode).json(payload);
};
