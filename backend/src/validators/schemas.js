import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'INDUSTRY']),
  department_id: z.preprocess((v) => (v === null || v === '' || v === undefined ? undefined : v), z.coerce.number().int().optional()),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  department_id: z.number().int().optional().nullable(),
});

export const projectSchema = z.object({
  title: z.string().min(4).max(200),
  description: z.string().min(20).max(5000),
  department_id: z.number().int(),
  type: z.enum(['ACADEMIC', 'INDUSTRY']).optional(),
});

export const statusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED', 'OPEN', 'PENDING']),
  reason: z.string().optional(),
});

export const teamCreateSchema = z.object({
  project_id: z.number().int(),
});

export const joinDecisionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const supervisorRequestSchema = z.object({
  project_id: z.number().int(),
  instructor_id: z.number().int(),
});

export const supervisorDecisionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export const progressSchema = z.object({
  team_id: z.coerce.number().int(),
  week: z.coerce.number().int().min(1).max(52),
  description: z.string().min(10).max(5000),
});

export const commentSchema = z.object({
  content: z.string().min(2).max(2000),
});

export const departmentSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
});

export const voiceSchema = z.object({
  message: z.string().min(1).max(2000),
  path: z.string().optional(),
});
