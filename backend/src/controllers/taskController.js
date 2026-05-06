import { taskService } from "../services/taskService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const taskController = {
  create: asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body, req.user);
    res.status(201).json({ success: true, data: { task } });
  }),

  list: asyncHandler(async (req, res) => {
    const tasks = await taskService.list(req.params.projectId, req.user);
    res.json({ success: true, data: { tasks } });
  }),

  update: asyncHandler(async (req, res) => {
    const task = await taskService.update(req.params.taskId, req.body, req.user);
    res.json({ success: true, data: { task } });
  }),

  remove: asyncHandler(async (req, res) => {
    await taskService.remove(req.params.taskId, req.user);
    res.status(204).send();
  })
};
