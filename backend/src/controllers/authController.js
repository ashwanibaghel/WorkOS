import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.params.token);
    res.json({ success: true, data: result });
  }),

  resendVerification: asyncHandler(async (req, res) => {
    const result = await authService.resendVerification(req.body);
    res.json({ success: true, data: result });
  }),

  google: asyncHandler(async (req, res) => {
    const result = await authService.googleLogin(req.body);
    res.json({ success: true, data: result });
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
  })
};
