import { ActivityLog } from "../models/ActivityLog.js";

export const activityService = {
  async log({ action, entityType, entityId, userId, projectId, metadata = {} }) {
    return ActivityLog.create({ action, entityType, entityId, userId, projectId, metadata });
  },

  async listByProject(projectId, limit = 50) {
    return ActivityLog.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email role")
      .lean();
  }
};
