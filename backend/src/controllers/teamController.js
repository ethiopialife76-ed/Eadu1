import * as teamService from '../services/teamService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const data = await teamService.createTeam(req.user, req.body.project_id, req.app.get('io'));
  res.status(201).json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const data = await teamService.getTeam(Number(req.params.id));
  res.json({ success: true, data });
});

export const join = asyncHandler(async (req, res) => {
  const data = await teamService.requestJoin(req.user, Number(req.params.id), req.app.get('io'));
  res.status(201).json({ success: true, data });
});

export const decideJoin = asyncHandler(async (req, res) => {
  const data = await teamService.decideJoin(
    req.user,
    Number(req.params.id),
    Number(req.params.requestId),
    req.body.status,
    req.app.get('io')
  );
  res.json({ success: true, data });
});

export const leave = asyncHandler(async (req, res) => {
  await teamService.leaveTeam(req.user, Number(req.params.id));
  res.json({ success: true, data: { message: 'Left team' } });
});

export const removeMember = asyncHandler(async (req, res) => {
  await teamService.removeMember(req.user, Number(req.params.id), Number(req.params.studentId));
  res.json({ success: true, data: { message: 'Member removed' } });
});

export const approve = asyncHandler(async (req, res) => {
  const data = await teamService.approveTeam(req.user, Number(req.params.id), req.app.get('io'));
  res.json({ success: true, data });
});

export const members = asyncHandler(async (req, res) => {
  const data = await teamService.members(Number(req.params.id));
  res.json({ success: true, data });
});

export const messages = asyncHandler(async (req, res) => {
  const data = await teamService.messages(Number(req.params.id));
  res.json({ success: true, data });
});
