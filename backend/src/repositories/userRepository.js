import prisma from '../config/prisma.js';

export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
export const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { department: true },
  });
export const create = (data) => prisma.user.create({ data });
export const update = (id, data) => prisma.user.update({ where: { id }, data });
export const list = (where = {}) =>
  prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department_id: true,
      is_active: true,
      industry_approved: true,
      created_at: true,
      department: true,
    },
    orderBy: { created_at: 'desc' },
  });
export const remove = (id) => prisma.user.delete({ where: { id } });
