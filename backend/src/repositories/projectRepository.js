import prisma from '../config/prisma.js';

const projectInclude = {
  department: true,
  poster: { select: { id: true, name: true, email: true, role: true } },
  supervisor: { select: { id: true, name: true, email: true, role: true } },
  team: {
    include: {
      leader: { select: { id: true, name: true } },
      members: { include: { student: { select: { id: true, name: true, email: true } } } },
    },
  },
};

export const list = ({ skip, take, where }) =>
  prisma.project.findMany({
    where,
    skip,
    take,
    include: projectInclude,
    orderBy: { created_at: 'desc' },
  });

export const count = (where) => prisma.project.count({ where });
export const findById = (id) => prisma.project.findUnique({ where: { id }, include: projectInclude });
export const create = (data) => prisma.project.create({ data, include: projectInclude });
export const update = (id, data) => prisma.project.update({ where: { id }, data, include: projectInclude });
export const remove = (id) => prisma.project.delete({ where: { id } });
