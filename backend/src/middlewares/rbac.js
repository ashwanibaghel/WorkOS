import { AppError } from "../utils/AppError.js";

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AppError("You do not have permission to perform this action", 403);
  }
  next();
};

export const canManage = authorize("admin", "manager");
