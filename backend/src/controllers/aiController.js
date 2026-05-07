import { aiService } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const aiController = {
  breakdown: asyncHandler(async (req, res) => {
    const result = await aiService.breakdown(req.body, req.user);
    res.json({ success: true, data: result });
  }),

  description: asyncHandler(async (req, res) => {
    const result = await aiService.description(req.body, req.user);
    res.json({ success: true, data: result });
  }),

  suggestions: asyncHandler(async (req, res) => {
    const result = await aiService.suggestions(req.params.projectId, req.user);
    res.json({ success: true, data: result });
  }),

  chat: asyncHandler(async (req, res) => {
    const result = await aiService.chat({ projectId: req.params.projectId, question: req.body.question }, req.user);
    res.json({ success: true, data: result });
  }),

  dashboardChat: asyncHandler(async (req, res) => {
    const result = await aiService.dashboardChat({ question: req.body.question }, req.user);
    res.json({ success: true, data: result });
  }),

  summary: asyncHandler(async (req, res) => {
    const result = await aiService.summary(req.params.projectId, req.user);
    res.json({ success: true, data: result });
  }),

  reviewTask: asyncHandler(async (req, res) => {
    const result = await aiService.reviewTask(req.params.taskId, req.user);
    res.json({ success: true, data: result });
  })
};
