import { ProjectMessage } from "../models/ProjectMessage.js";
import { emitProjectEvent } from "../socket/socket.js";
import { activityService } from "./activityService.js";
import { assertProjectAccess } from "./projectService.js";

const populateMessage = (query) => query.populate("sender", "name email role avatar");

export const projectChatService = {
  async list(projectId, user) {
    await assertProjectAccess(projectId, user);
    return populateMessage(ProjectMessage.find({ projectId }).sort({ createdAt: 1 }).limit(100)).lean();
  },

  async create(projectId, message, user) {
    await assertProjectAccess(projectId, user);
    const created = await ProjectMessage.create({
      projectId,
      sender: user._id,
      message
    });
    const fullMessage = await populateMessage(ProjectMessage.findById(created._id)).lean();

    await activityService.log({
      action: "project.message_created",
      entityType: "project",
      entityId: created._id,
      userId: user._id,
      projectId,
      metadata: { messagePreview: message.slice(0, 120) }
    });
    emitProjectEvent(projectId, "chat:message", fullMessage);
    return fullMessage;
  }
};
