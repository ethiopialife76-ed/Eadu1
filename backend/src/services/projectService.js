import * as projectRepo from '../repositories/projectRepository.js';
import { AppError, AuthorizationError } from '../utils/AppError.js';
import { notifyUser } from '../sockets/index.js';

const publicStatuses = ['APPROVED', 'OPEN', 'COMPLETED'];

export const listProjects = async (query, user) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 12);
  const skip = (page - 1) * limit;
  const AND = [];

  if (query.status) AND.push({ status: query.status });
  if (query.department_id) AND.push({ department_id: Number(query.department_id) });
  if (query.type) AND.push({ type: query.type });
  if (query.q) {
    AND.push({
      OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }],
    });
  }

  if (user.role === 'STUDENT' || user.role === 'INDUSTRY') {
    AND.push({
      OR: [{ status: { in: publicStatuses } }, { posted_by: user.id }],
    });
  }

  const where = AND.length ? { AND } : {};
  const [items, total] = await Promise.all([
    projectRepo.list({ skip, take: limit, where }),
    projectRepo.count(where),
  ]);
  return { items, total, page, limit };
};

export const getProject = async (id) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  return project;
};

export const createProject = async (user, body, io) => {
  if (user.role === 'INDUSTRY' && !user.industry_approved) {
    throw new AppError('Industry partners must be approved by an admin before posting projects', 403);
  }
  if (!['STUDENT', 'INDUSTRY', 'ADMIN'].includes(user.role)) {
    throw new AuthorizationError('Only students and industry partners can post projects');
  }
  const project = await projectRepo.create({
    title: body.title,
    description: body.description,
    department_id: body.department_id,
    type: body.type || (user.role === 'INDUSTRY' ? 'INDUSTRY' : 'ACADEMIC'),
    posted_by: user.id,
    status: 'PENDING',
  });

  const admins = await (await import('../repositories/userRepository.js')).list({ role: 'ADMIN', is_active: true });
  for (const admin of admins) {
    await notifyUser(io, admin.id, {
      type: 'project:submitted_for_review',
      title: 'New project awaiting review',
      body: `${user.name} submitted "${project.title}"`,
      link: `/projects/${project.id}`,
    });
  }
  return project;
};

export const updateProject = async (user, id, body) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  if (project.posted_by !== user.id && user.role !== 'ADMIN') {
    throw new AuthorizationError('You can only edit your own projects');
  }
  return projectRepo.update(id, body);
};

export const deleteProject = async (user, id) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  if (user.role !== 'ADMIN' && project.posted_by !== user.id) {
    throw new AuthorizationError();
  }
  await projectRepo.remove(id);
};

export const updateStatus = async (user, id, status, reason, io) => {
  if (user.role !== 'ADMIN') throw new AuthorizationError();
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError('Project not found', 404);
  const updated = await projectRepo.update(id, { status });
  await notifyUser(io, project.posted_by, {
    type: 'project:status_changed',
    title: 'Project status updated',
    body: `"${project.title}" is now ${status}${reason ? `. ${reason}` : ''}`,
    link: `/projects/${project.id}`,
  });
  io?.to(`user:${project.posted_by}`).emit('project:status_changed', {
    projectId: project.id,
    newStatus: status,
  });
  return updated;
};
