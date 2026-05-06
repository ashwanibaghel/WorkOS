import { dashboardService } from "../services/dashboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardController = {
  overview: asyncHandler(async (req, res) => {
    const overview = await dashboardService.overview(req.user);
    res.json({ success: true, data: { overview } });
  })
};
