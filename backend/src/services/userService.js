import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const userService = {
  async list() {
    return User.find().select("name email role createdAt").sort({ name: 1 }).lean();
  },

  async updateRole(userId, role, actor) {
    if (String(userId) === String(actor._id) && role !== actor.role) {
      throw new AppError("You cannot change your own role", 400);
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true })
      .select("name email role createdAt")
      .lean();
    if (!user) throw new AppError("User not found", 404);
    return user;
  }
};
