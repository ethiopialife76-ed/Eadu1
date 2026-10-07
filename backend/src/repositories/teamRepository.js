import prisma from '../config/prisma.js';

const teamInclude = {
  project: { include: { department: true, supervisor: { select: { id: true, name: true } } } },
  leader: { select: { id: true, name: true, email: true } },
  members: { include: { student: { select: { id: true, name: true, email: true } } } },
  joinRequests: { include: { student: { select: { id: true, name: true, email: true } } } },
};

export const findById = (id) =>
  prisma.team.findUnique({
    where: { id: Number(id) },
    include: teamInclude,
  });
  export const findByProject = (project_id) =>
    prisma.team.findUnique({
      where: { project_id: Number(project_id) },
      include: teamInclude,
    });
export const create = (data) => prisma.team.create({ data, include: teamInclude });
export const update = (id, data) => prisma.team.update({ where: { id }, data, include: teamInclude });
export const getMembership = (studentId) =>
  prisma.teamMember.findFirst({
    where: {
      student_id: studentId,
      team: { status: { in: ['FORMING', 'ACTIVE'] } },
    },
    include: { team: true },
  });
export const addMember = (teamId, studentId) =>
  prisma.teamMember.create({ data: { team_id: teamId, student_id: studentId } });
export const removeMember = (teamId, studentId) =>
  prisma.teamMember.deleteMany({ where: { team_id: teamId, student_id: studentId } });
export const members = (teamId) =>
  prisma.teamMember.findMany({
    where: { team_id: teamId },
    include: { student: { select: { id: true, name: true, email: true, role: true } } },
  });
export const createJoinRequest = (teamId, studentId) =>
  prisma.teamJoinRequest.create({ data: { team_id: teamId, student_id: studentId } });
export const findJoinRequest = (id) =>
  prisma.teamJoinRequest.findUnique({ where: { id }, include: { team: true, student: true } });
export const updateJoinRequest = (id, data) => prisma.teamJoinRequest.update({ where: { id }, data });
export const listMessages = (teamId) =>
  prisma.chatMessage.findMany({
    where: { team_id: teamId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { created_at: 'asc' },
    take: 200,
  });
