import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepo from '../repositories/userRepository.js';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const signToken = (user) =>
  jwt.sign(
    { sub: String(user.id), role: user.role, departmentId: user.department_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department_id: user.department_id,
  department: user.department || undefined,
  is_active: user.is_active,
  industry_approved: user.industry_approved,
  created_at: user.created_at,
});

export const register = async (payload) => {
  const existing = await userRepo.findByEmail(payload.email.toLowerCase());
  if (existing) throw new AppError('Email already in use', 409);

  if (payload.role !== 'INDUSTRY' && !payload.department_id) {
    throw new AppError('Department is required for students and instructors', 400);
  }

  const password = await bcrypt.hash(payload.password, 12);
  const user = await userRepo.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password,
    role: payload.role,
    department_id: payload.department_id || null,
    industry_approved: payload.role !== 'INDUSTRY',
  });

  const full = await userRepo.findById(user.id);
  return { user: publicUser(full), token: signToken(full) };
};

export const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.is_active) throw new AppError('This account has been deactivated', 403);
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError('Invalid email or password', 401);
  const full = await userRepo.findById(user.id);
  return { user: publicUser(full), token: signToken(full) };
};

export const me = async (id) => publicUser(await userRepo.findById(id));

export const updateProfile = async (id, data) => {
  const user = await userRepo.update(id, data);
  return publicUser(await userRepo.findById(user.id));
};

export const changePassword = async (id, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id } });
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new AppError('Current password is incorrect', 400);
  const password = await bcrypt.hash(newPassword, 12);
  await userRepo.update(id, { password });
  return { message: 'Password updated' };
};

export const requestReset = async (email) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) return { message: 'If that email exists, a reset link was prepared' };
  const token = crypto.randomBytes(24).toString('hex');
  const expires_at = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordReset.create({ data: { user_id: user.id, token, expires_at } });
  return {
    message: 'If that email exists, a reset link was prepared',
    ...(process.env.NODE_ENV !== 'production' ? { devToken: token } : {}),
  };
};

export const resetPassword = async (token, newPassword) => {
  const row = await prisma.passwordReset.findUnique({ where: { token } });
  if (!row || row.used || row.expires_at < new Date()) throw new AppError('Invalid or expired reset token', 400);
  const password = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.user_id }, data: { password } }),
    prisma.passwordReset.update({ where: { id: row.id }, data: { used: true } }),
  ]);
  return { message: 'Password has been reset. You can now sign in.' };
};
