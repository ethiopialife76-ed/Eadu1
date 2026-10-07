import * as userRepo from '../repositories/userRepository.js';
import * as departmentRepo from '../repositories/departmentRepository.js';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

export const listUsers = (query) => {
  const where = {};
  if (query.role) where.role = query.role;
  return userRepo.list(where);
};


export const deactivateUser = async (adminId, id) => {
  if (adminId === id) throw new AppError('You cannot deactivate your own account', 400);
  const user = await userRepo.update(id, { is_active: false });
  await prisma.auditLog.create({
    data: { admin_id: adminId, action: 'DEACTIVATE_USER', target: `user:${id}` },
  });
  return user;
};

export const activateUser = async (adminId, id) => {
  if (adminId === id) {
    throw new AppError(
      'You cannot activate your own account',
      400
    );
  }

  const user = await userRepo.update(id, {
    is_active: true,
  });

  await prisma.auditLog.create({
    data: {
      admin_id: adminId,
      action: 'ACTIVATE_USER',
      target: `user:${id}`,
    },
  });

  return user;
};

export const deleteUser = async (adminId, id) => {
  if (adminId === id) throw new AppError('You cannot delete your own account', 400);
  await prisma.auditLog.create({
    data: { admin_id: adminId, action: 'DELETE_USER', target: `user:${id}` },
  });
  return userRepo.remove(id);
};

export const setRole = async (adminId, id, role) => {
  const user = await userRepo.update(id, { role });
  await prisma.auditLog.create({
    data: { admin_id: adminId, action: 'SET_ROLE', target: `user:${id}`, details: role },
  });
  return user;
};

export const approveIndustry = async (adminId, id, approved) => {
  const user = await userRepo.update(id, { industry_approved: approved });
  await prisma.auditLog.create({
    data: {
      admin_id: adminId,
      action: approved ? 'APPROVE_INDUSTRY' : 'REVOKE_INDUSTRY',
      target: `user:${id}`,
    },
  });
  return user;
};

export const listDepartments = () => departmentRepo.list();
export const createDepartment = (data) => departmentRepo.create(data);

export const stats = async () => {
  const [users, projects, teams, reports, pending] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.team.count(),
    prisma.progressReport.count(),
    prisma.project.count({ where: { status: 'PENDING' } }),
  ]);
  const byRole = await prisma.user.groupBy({ by: ['role'], _count: true });
  const byStatus = await prisma.project.groupBy({ by: ['status'], _count: true });
  return { users, projects, teams, reports, pending, byRole, byStatus };
};
