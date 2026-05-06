import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new AppError("Authentication token required", 401);
  }

  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new AppError("Authenticated user no longer exists", 401);
  }

  req.user = user;
  next();
});
