import * as projectService from '../services/projectService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await projectService.listProjects(req.query, req.user);
  res.json({ success: true, data });
});

export const get = asyncHandler(async (req, res) => {
  const data = await projectService.getProject(Number(req.params.id));
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await projectService.createProject(req.user, req.body, req.app.get('io'));
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await projectService.updateProject(req.user, Number(req.params.id), req.body);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.user, Number(req.params.id));
  res.json({ success: true, data: { message: 'Project deleted' } });
});

export const status = asyncHandler(async (req, res) => {
  const data = await projectService.updateStatus(
    req.user,
    Number(req.params.id),
    req.body.status,
    req.body.reason,
    req.app.get('io')
  );
  res.json({ success: true, data });
});
