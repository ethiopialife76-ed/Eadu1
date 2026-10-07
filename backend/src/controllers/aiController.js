import * as aiService from '../services/aiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const voice = asyncHandler(async (req, res) => {
  const data = await aiService.assist({ message: req.body.message, path: req.body.path }, req.user || null);
  res.json({ success: true, data });
});
