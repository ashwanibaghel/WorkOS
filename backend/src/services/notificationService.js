import { Notification } from "../models/Notification.js";
import { Task } from "../models/Task.js";
import { emitUserEvent } from "../socket/socket.js";

const notify = async (payload) => {
  const notification = await Notification.create(payload);
  emitUserEvent(String(payload.userId), "notification:new", notification);
  return notification;
};

export const notificationService = {
  notify,

  async assignment({ userId, projectId, taskId, taskTitle }) {
    if (!userId) return null;
    return notify({
      userId,
      projectId,
      taskId,
      type: "assignment",
      message: `You were assigned to "${taskTitle}".`
    });
  },

  async statusChange({ userId, projectId, taskId, taskTitle, actorName, status }) {
    if (!userId) return null;
    const statusLabel = {
      "todo": "Todo",
      "in-progress": "In Progress",
      "review": "Review",
      "done": "Done"
    }[status] || status;

    return notify({
      userId,
      projectId,
      taskId,
      type: "status",
      message: `${actorName} moved "${taskTitle}" to ${statusLabel}.`
    });
  },

  async reviewRequested({ userId, projectId, taskId, taskTitle, actorName }) {
    if (!userId) return null;
    return notify({
      userId,
      projectId,
      taskId,
      type: "status",
      message: `${actorName} submitted "${taskTitle}" for review.`
    });
  },

  async taskApproved({ userId, projectId, taskId, taskTitle, actorName }) {
    if (!userId) return null;
    return notify({
      userId,
      projectId,
      taskId,
      type: "status",
      message: `${actorName} approved "${taskTitle}" as Done.`
    });
  },

  async overdueScan() {
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $ne: "done" },
      assignedTo: { $exists: true, $ne: null }
    }).select("_id title projectId assignedTo");

    const created = [];
    for (const task of overdueTasks) {
      const exists = await Notification.exists({ taskId: task._id, type: "overdue", read: false });
      if (!exists) {
        created.push(
          await notify({
            userId: task.assignedTo,
            projectId: task.projectId,
            taskId: task._id,
            type: "overdue",
            message: `"${task.title}" is overdue.`
          })
        );
      }
    }
    return created;
  },

  async list(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  },

  async markRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  }
};
