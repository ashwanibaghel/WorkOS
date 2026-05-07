import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { emitProjectEvent } from "../socket/socket.js";
import { activityService } from "./activityService.js";
import { notificationService } from "./notificationService.js";
import { assertProjectAccess } from "./projectService.js";

const populateTask = (query) => query.populate("assignedTo", "name email role").populate("projectId", "name");

const assertMemberCanUpdate = (task, user, updates) => {
  if (user.role !== "member") return;

  const allowedKeys = ["status"];
  const keys = Object.keys(updates);
  const assigned = task.assignedTo && String(task.assignedTo) === String(user._id);
  if (!assigned || keys.some((key) => !allowedKeys.includes(key))) {
    throw new AppError("Members can only update status for their assigned tasks", 403);
  }
};

const assertAssignableAssignee = async (assignedTo, user) => {
  if (!assignedTo) return;
  const assignee = await User.findById(assignedTo).select("role").lean();
  if (!assignee) throw new AppError("Assignee not found", 400);
  if (user.role === "manager" && assignee.role !== "member") {
    throw new AppError("Managers can only assign tasks to member users", 403);
  }
};

const assertProjectOpenForTasks = (project) => {
  if (project.status === "completed") {
    throw new AppError("Reopen the project before changing tasks", 400);
  }
};

export const taskService = {
  async create(data, user) {
    const project = await assertProjectAccess(data.projectId, user);
    assertProjectOpenForTasks(project);
    await assertAssignableAssignee(data.assignedTo, user);
    const task = await Task.create({
      ...data,
      completedAt: data.status === "done" ? new Date() : null
    });
    const fullTask = await populateTask(Task.findById(task._id));

    if (data.assignedTo) {
      await notificationService.assignment({
        userId: data.assignedTo,
        projectId: data.projectId,
        taskId: task._id,
        taskTitle: task.title
      });
    }

    await activityService.log({
      action: "task.created",
      entityType: "task",
      entityId: task._id,
      userId: user._id,
      projectId: data.projectId,
      metadata: { title: task.title }
    });
    emitProjectEvent(data.projectId, "task:created", fullTask);
    return fullTask;
  },

  async list(projectId, user) {
    await assertProjectAccess(projectId, user);
    return populateTask(Task.find({ projectId }).sort({ createdAt: -1 })).lean();
  },

  async update(taskId, updates, user) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);
    const project = await assertProjectAccess(task.projectId, user);
    assertProjectOpenForTasks(project);
    assertMemberCanUpdate(task, user, updates);
    if (Object.prototype.hasOwnProperty.call(updates, "assignedTo")) {
      await assertAssignableAssignee(updates.assignedTo, user);
    }

    const previousAssignee = task.assignedTo ? String(task.assignedTo) : null;
    Object.assign(task, updates);
    if (updates.status === "done" && !task.completedAt) task.completedAt = new Date();
    if (updates.status && updates.status !== "done") task.completedAt = null;
    await task.save();

    const fullTask = await populateTask(Task.findById(task._id));
    if (updates.assignedTo && String(updates.assignedTo) !== previousAssignee) {
      await notificationService.assignment({
        userId: updates.assignedTo,
        projectId: task.projectId,
        taskId: task._id,
        taskTitle: task.title
      });
    }

    await activityService.log({
      action: "task.updated",
      entityType: "task",
      entityId: task._id,
      userId: user._id,
      projectId: task.projectId,
      metadata: updates
    });
    emitProjectEvent(task.projectId, "task:updated", fullTask);
    return fullTask;
  },

  async remove(taskId, user) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);
    const project = await assertProjectAccess(task.projectId, user);
    assertProjectOpenForTasks(project);

    if (user.role === "member") {
      throw new AppError("Members cannot delete tasks", 403);
    }

    await task.deleteOne();
    await activityService.log({
      action: "task.deleted",
      entityType: "task",
      entityId: task._id,
      userId: user._id,
      projectId: task.projectId
    });
    emitProjectEvent(task.projectId, "task:deleted", { taskId });
    return task;
  }
};
