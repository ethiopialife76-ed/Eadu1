import * as progressRepo from '../repositories/progressRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';
import { AppError, AuthorizationError } from '../utils/AppError.js';
import { notifyUser } from '../sockets/index.js';

export const submit = async (user, body, fileUrl, io) => {
  if (user.role !== 'STUDENT') throw new AuthorizationError();
  const team = await teamRepo.findById(body.team_id);
  if (!team) throw new AppError('Team not found', 404);
  const isMember = team.members.some((m) => m.student_id === user.id) || team.leader_id === user.id;
  if (!isMember) throw new AppError('You are not a member of this team', 403);

  try {
    const report = await progressRepo.create({
      team_id: body.team_id,
      week: Number(body.week),
      description: body.description,
      file_url: fileUrl || null,
    });
    const supervisorId = team.project?.supervisor_id;
    if (supervisorId) {
      await notifyUser(io, supervisorId, {
        type: 'report:submitted',
        title: 'New weekly progress report',
        body: `${user.name} submitted week ${body.week} for "${team.project.title}"`,
        link: `/progress/${team.id}`,
      });
      io?.to(`user:${supervisorId}`).emit('report:submitted', {
        teamId: team.id,
        week: Number(body.week),
        projectTitle: team.project.title,
      });
    }
    io?.to(`team:${team.id}`).emit('report:submitted', { teamId: team.id, week: Number(body.week) });
    return report;
  } catch {
    throw new AppError('A report for this week already exists', 400);
  }
};

export const listForTeam = async (user, teamId) => {
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  const isMember = team.members.some((m) => m.student_id === user.id) || team.leader_id === user.id;
  const isSupervisor = team.project.supervisor_id === user.id;
  if (!isMember && !isSupervisor && user.role !== 'ADMIN') throw new AuthorizationError();
  return progressRepo.listByTeam(teamId);
};

export const getReport = async (user, id) => {
  const report = await progressRepo.findById(id);
  if (!report) throw new AppError('Report not found', 404);
  return report;
};

export const comment = async (user, reportId, content) => {
  if (!['INSTRUCTOR', 'ADMIN'].includes(user.role)) throw new AuthorizationError();
  const report = await progressRepo.findById(reportId);
  if (!report) throw new AppError('Report not found', 404);
  return progressRepo.addComment(reportId, user.id, content);
};
