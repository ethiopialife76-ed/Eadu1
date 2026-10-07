import * as progressService from '../services/progressService.js';
import { storeFile } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submit = asyncHandler(async (req, res) => {
  const fileUrl = req.file ? await storeFile(req.file) : null;
  const data = await progressService.submit(req.user, req.body, fileUrl, req.app.get('io'));
  res.status(201).json({ success: true, data });
});

export const listTeam = asyncHandler(async (req, res) => {
  const data = await progressService.listForTeam(req.user, Number(req.params.id));
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const data = await progressService.getReport(req.user, Number(req.params.id));
  res.json({ success: true, data });
});

export const comment = asyncHandler(async (req, res) => {
  const data = await progressService.comment(req.user, Number(req.params.id), req.body.content);
  res.status(201).json({ success: true, data });
});
