import prisma from '../config/prisma.js';

export const listInstructors = () =>
  prisma.user.findMany({
    where: { role: 'INSTRUCTOR', is_active: true },
    select: { id: true, name: true, email: true, department: true },
    orderBy: { name: 'asc' },
  });

export const createRequest = (project_id, instructor_id) =>
  prisma.supervisorRequest.create({
    data: { project_id, instructor_id },
    include: { project: true, instructor: { select: { id: true, name: true } } },
  });

export const findRequest = (id) =>
  prisma.supervisorRequest.findUnique({
    where: { id },
    include: { project: true, instructor: true },
  });

export const updateRequest = (id, data) =>
  prisma.supervisorRequest.update({
    where: { id },
    data,
    include: { project: true },
  });

export const listForInstructor = (instructor_id) =>
  prisma.supervisorRequest.findMany({
    where: { instructor_id },
    include: {
      project: { include: { poster: { select: { id: true, name: true } }, department: true } },
    },
    orderBy: { requested_at: 'desc' },
  });
