import { userService } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userController = {
  list: asyncHandler(async (_req, res) => {
    const users = await userService.list();
    res.json({ success: true, data: { users } });
  }),

  updateRole: asyncHandler(async (req, res) => {
    const user = await userService.updateRole(req.params.userId, req.body.role, req.user);
    res.json({ success: true, data: { user } });
  })
};
