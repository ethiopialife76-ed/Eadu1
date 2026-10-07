import * as supervisorService from '../services/supervisorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await supervisorService.listInstructors();
  res.json({ success: true, data });
});

export const request = asyncHandler(async (req, res) => {
  const data = await supervisorService.requestSupervisor(
    req.user,
    req.body.project_id,
    req.body.instructor_id,
    req.app.get('io')
  );
  res.status(201).json({ success: true, data });
});

export const incoming = asyncHandler(async (req, res) => {
  const data = await supervisorService.listRequests(req.user);
  res.json({ success: true, data });
});

export const decide = asyncHandler(async (req, res) => {
  const data = await supervisorService.decideRequest(
    req.user,
    Number(req.params.id),
    req.body.status,
    req.app.get('io')
  );
  res.json({ success: true, data });
});

export const assign = asyncHandler(async (req, res) => {
  const data = await supervisorService.adminAssign(req.user, Number(req.body.project_id), Number(req.body.instructor_id));
  res.json({ success: true, data });
});
