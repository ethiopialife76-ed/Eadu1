import * as supervisorRepo from '../repositories/supervisorRepository.js';
import * as projectRepo from '../repositories/projectRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';
import { AppError, AuthorizationError } from '../utils/AppError.js';
import { notifyUser } from '../sockets/index.js';

export const listInstructors = () => supervisorRepo.listInstructors();

export const requestSupervisor = async (user, project_id, instructor_id, io) => {
  if (user.role !== 'STUDENT') throw new AuthorizationError();
  const project = await projectRepo.findById(project_id);
  if (!project) throw new AppError('Project not found', 404);
  if (project.supervisor_id) throw new AppError('This project already has a supervisor', 400);
  const team = await teamRepo.findByProject(project_id);
  if (!team || team.leader_id !== user.id) {
    throw new AppError('Only the team leader can request a supervisor', 403);
  }
  if (team.status !== 'ACTIVE') throw new AppError('Team must be approved before requesting a supervisor', 400);

  const request = await supervisorRepo.createRequest(project_id, instructor_id);
  await notifyUser(io, instructor_id, {
    type: 'supervisor:request',
    title: 'Supervision request',
    body: `${user.name} requested you as supervisor for "${project.title}"`,
    link: '/supervisor-requests',
  });
  io?.to(`user:${instructor_id}`).emit('supervisor:request', {
    requestId: request.id,
    projectTitle: project.title,
  });
  return request;
};

export const listRequests = (user) => {
  if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') throw new AuthorizationError();
  return supervisorRepo.listForInstructor(user.id);
};

export const decideRequest = async (user, id, status, io) => {
  const request = await supervisorRepo.findRequest(id);
  if (!request) throw new AppError('Request not found', 404);
  if (request.instructor_id !== user.id && user.role !== 'ADMIN') throw new AuthorizationError();
  const updated = await supervisorRepo.updateRequest(id, { status });
  if (status === 'ACCEPTED') {
    await projectRepo.update(request.project_id, { supervisor_id: request.instructor_id });
  }
  await notifyUser(io, request.project.posted_by, {
    type: 'supervisor:decision',
    title: status === 'ACCEPTED' ? 'Supervisor accepted' : 'Supervisor declined',
    body: `Supervision request for "${request.project.title}" was ${status.toLowerCase()}`,
    link: `/projects/${request.project_id}`,
  });
  return updated;
};

export const adminAssign = async (user, projectId, instructorId) => {
  if (user.role !== 'ADMIN') throw new AuthorizationError();
  return projectRepo.update(projectId, { supervisor_id: instructorId });
};
