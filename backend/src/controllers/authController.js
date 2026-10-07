import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({ success: true, data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ success: true, data });
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  res.json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, data });
});

export const forgot = asyncHandler(async (req, res) => {
  const data = await authService.requestReset(req.body.email);
  res.json({ success: true, data });
});

export const reset = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ success: true, data });
});
