import * as teamRepo from '../repositories/teamRepository.js';
import * as projectRepo from '../repositories/projectRepository.js';
import { AppError, AuthorizationError } from '../utils/AppError.js';
import { notifyUser } from '../sockets/index.js';

export const createTeam = async (user, project_id, io) => {
  if (user.role !== 'STUDENT') throw new AuthorizationError('Only students can create teams');
  const existing = await teamRepo.getMembership(user.id);
  if (existing) throw new AppError('You are already in an active team', 400);

  const project = await projectRepo.findById(project_id);
  if (!project) throw new AppError('Project not found', 404);
  if (project.status !== 'APPROVED' && project.status !== 'OPEN') {
    throw new AppError('Teams can only be created for approved projects', 400);
  }
  const already = await teamRepo.findByProject(project_id);
  if (already) throw new AppError('This project already has a team', 400);

  const team = await teamRepo.create({
    project_id,
    leader_id: user.id,
    status: 'FORMING',
  });
  await teamRepo.addMember(team.id, user.id);
  return teamRepo.findById(team.id);
};

export const getTeam = async (id) => {
  const team = await teamRepo.findById(id);
  if (!team) throw new AppError('Team not found', 404);
  return team;
};

export const requestJoin = async (user, teamId, io) => {
  if (user.role !== 'STUDENT') throw new AuthorizationError();
  const existing = await teamRepo.getMembership(user.id);
  if (existing) throw new AppError('You are already in an active team', 400);
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.status === 'DISBANDED') throw new AppError('This team is no longer active', 400);
  try {
    const request = await teamRepo.createJoinRequest(teamId, user.id);
    await notifyUser(io, team.leader_id, {
      type: 'team:join_request',
      title: 'Join request',
      body: `${user.name} asked to join your team for "${team.project.title}"`,
      link: `/teams/${team.id}`,
    });
    return request;
  } catch {
    throw new AppError('You already requested to join this team', 400);
  }
};

export const decideJoin = async (user, teamId, requestId, status, io) => {
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.leader_id !== user.id && user.role !== 'ADMIN') throw new AuthorizationError();
  const request = await teamRepo.findJoinRequest(requestId);
  if (!request || request.team_id !== teamId) throw new AppError('Join request not found', 404);
  if (status === 'ACCEPTED') {
    const already = await teamRepo.getMembership(request.student_id);
    if (already) throw new AppError('That student is already in a team', 400);
    await teamRepo.addMember(teamId, request.student_id);
  }
  const updated = await teamRepo.updateJoinRequest(requestId, { status });
  await notifyUser(io, request.student_id, {
    type: 'team:join_decision',
    title: status === 'ACCEPTED' ? 'Join request accepted' : 'Join request rejected',
    body: `Your request to join "${team.project.title}" was ${status.toLowerCase()}`,
    link: `/projects/${team.project_id}`,
  });
  return updated;
};

export const leaveTeam = async (user, teamId) => {
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.leader_id === user.id) throw new AppError('Team leaders cannot leave; ask an admin to disband the team', 400);
  await teamRepo.removeMember(teamId, user.id);
};

export const removeMember = async (user, teamId, studentId) => {
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.leader_id !== user.id && user.role !== 'ADMIN') throw new AuthorizationError();
  if (studentId === team.leader_id) throw new AppError('Cannot remove the team leader', 400);
  await teamRepo.removeMember(teamId, studentId);
};

export const approveTeam = async (user, teamId, io) => {
  if (!['INSTRUCTOR', 'ADMIN'].includes(user.role)) throw new AuthorizationError();
  const team = await teamRepo.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  const updated = await teamRepo.update(teamId, { status: 'ACTIVE' });
  await notifyUser(io, team.leader_id, {
    type: 'team:approved',
    title: 'Team approved',
    body: `Your team for "${team.project.title}" is now active`,
    link: `/teams/${team.id}`,
  });
  return updated;
};

export const members = (id) => teamRepo.members(id);
export const messages = (id) => teamRepo.listMessages(id);
