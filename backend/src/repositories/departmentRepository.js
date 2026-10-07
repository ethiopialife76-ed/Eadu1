import prisma from '../config/prisma.js';

export const list = () => prisma.department.findMany({ orderBy: { name: 'asc' } });
export const create = (data) => prisma.department.create({ data });
export const findById = (id) => prisma.department.findUnique({ where: { id } });
