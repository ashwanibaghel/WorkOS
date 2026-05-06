import { notificationService } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const notifications = await notificationService.list(req.user._id);
    res.json({ success: true, data: { notifications } });
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.user._id, req.params.notificationId);
    res.json({ success: true, data: { notification } });
  })
};
