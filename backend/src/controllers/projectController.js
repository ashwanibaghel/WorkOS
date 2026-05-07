import { activityService } from "../services/activityService.js";
import { projectChatService } from "../services/projectChatService.js";
import { projectService } from "../services/projectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const projectController = {
  create: asyncHandler(async (req, res) => {
    const project = await projectService.create(req.body, req.user);
    res.status(201).json({ success: true, data: { project } });
  }),

  list: asyncHandler(async (req, res) => {
    const projects = await projectService.list(req.user);
    res.json({ success: true, data: { projects } });
  }),

  get: asyncHandler(async (req, res) => {
    const project = await projectService.get(req.params.projectId, req.user);
    res.json({ success: true, data: { project } });
  }),

  update: asyncHandler(async (req, res) => {
    const project = await projectService.update(req.params.projectId, req.body, req.user);
    res.json({ success: true, data: { project } });
  }),

  remove: asyncHandler(async (req, res) => {
    await projectService.remove(req.params.projectId, req.user);
    res.status(204).send();
  }),

  addMember: asyncHandler(async (req, res) => {
    const project = await projectService.addMember(req.params.projectId, req.params.memberId, req.user);
    res.json({ success: true, data: { project } });
  }),

  removeMember: asyncHandler(async (req, res) => {
    const project = await projectService.removeMember(req.params.projectId, req.params.memberId, req.user);
    res.json({ success: true, data: { project } });
  }),

  activity: asyncHandler(async (req, res) => {
    await projectService.get(req.params.projectId, req.user);
    const logs = await activityService.listByProject(req.params.projectId);
    res.json({ success: true, data: { logs } });
  }),

  messages: asyncHandler(async (req, res) => {
    const messages = await projectChatService.list(req.params.projectId, req.user);
    res.json({ success: true, data: { messages } });
  }),

  createMessage: asyncHandler(async (req, res) => {
    const message = await projectChatService.create(req.params.projectId, req.body.message, req.user);
    res.status(201).json({ success: true, data: { message } });
  })
};
