import * as adminService from '../services/adminService.js';
import prisma from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const users = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json({ success: true, data });
});

export const deactivate = asyncHandler(async (req, res) => {
  const data = await adminService.deactivateUser(req.user.id, Number(req.params.id));
  res.json({ success: true, data });
});

export const activate = asyncHandler(async (req, res) => {
  const data = await adminService.activateUser(
    req.user.id,
    Number(req.params.id)
  );

  res.json({ success: true, data });
});

export const removeUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.user.id, Number(req.params.id));
  res.json({ success: true, data: { message: 'User deleted' } });
});

export const setRole = asyncHandler(async (req, res) => {
  const data = await adminService.setRole(req.user.id, Number(req.params.id), req.body.role);
  res.json({ success: true, data });
});

export const approveIndustry = asyncHandler(async (req, res) => {
  const data = await adminService.approveIndustry(req.user.id, Number(req.params.id), Boolean(req.body.approved));
  res.json({ success: true, data });
});

export const departments = asyncHandler(async (req, res) => {
  const data = await adminService.listDepartments();
  res.json({ success: true, data });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const data = await adminService.createDepartment(req.body);
  res.status(201).json({ success: true, data });
});

export const stats = asyncHandler(async (req, res) => {
  const data = await adminService.stats();
  res.json({ success: true, data });
});

export const notifications = asyncHandler(async (req, res) => {
  const data = await prisma.notification.findMany({
    where: { user_id: req.user.id },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  res.json({ success: true, data });
});

export const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { user_id: req.user.id, id: Number(req.params.id) },
    data: { read: true },
  });
  res.json({ success: true, data: { message: 'Marked as read' } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { user_id: req.user.id }, data: { read: true } });
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
});
