import prisma from '../config/prisma.js';

export const create = (data) =>
  prisma.progressReport.create({
    data,
    include: { comments: { include: { author: { select: { id: true, name: true, role: true } } } } },
  });

export const listByTeam = (team_id) =>
  prisma.progressReport.findMany({
    where: { team_id },
    include: { comments: { include: { author: { select: { id: true, name: true, role: true } } } } },
    orderBy: { week: 'asc' },
  });

export const findById = (id) =>
  prisma.progressReport.findUnique({
    where: { id },
    include: {
      team: { include: { project: true, leader: true } },
      comments: { include: { author: { select: { id: true, name: true, role: true } } } },
    },
  });

export const addComment = (report_id, author_id, content) =>
  prisma.progressComment.create({
    data: { report_id, author_id, content },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
