import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  updateProfile: (payload) => api.patch('/auth/profile', payload).then((r) => r.data.data),
  changePassword: (payload) => api.patch('/auth/password', payload).then((r) => r.data.data),
  forgot: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  reset: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data.data),
};

export const projectService = {
  list: (params) => api.get('/projects', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/projects', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data.data),
  status: (id, payload) => api.patch(`/projects/${id}/status`, payload).then((r) => r.data.data),
};

export const teamService = {
  create: (project_id) => api.post('/teams', { project_id }).then((r) => r.data.data),
  get: (id) => api.get(`/teams/${id}`).then((r) => r.data.data),
  join: (id) => api.post(`/teams/${id}/join`).then((r) => r.data.data),
  decide: (id, requestId, status) =>
    api.patch(`/teams/${id}/requests/${requestId}`, { status }).then((r) => r.data.data),
  leave: (id) => api.delete(`/teams/${id}/leave`).then((r) => r.data.data),
  approve: (id) => api.patch(`/teams/${id}/approve`).then((r) => r.data.data),
  removeMember: (id, studentId) => api.delete(`/teams/${id}/members/${studentId}`).then((r) => r.data.data),
  messages: (id) => api.get(`/teams/${id}/messages`).then((r) => r.data.data),
};

export const supervisorService = {
  list: () => api.get('/supervisors').then((r) => r.data.data),
  request: (payload) => api.post('/supervisors/request', payload).then((r) => r.data.data),
  incoming: () => api.get('/supervisors/requests').then((r) => r.data.data),
  decide: (id, status) => api.patch(`/supervisors/requests/${id}`, { status }).then((r) => r.data.data),
};

export const progressService = {
  submit: (formData) =>
    api.post('/progress-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data),
  list: (teamId) => api.get(`/progress-reports/team/${teamId}`).then((r) => r.data.data),
  comment: (id, content) => api.post(`/progress-reports/${id}/comments`, { content }).then((r) => r.data.data),
};

export const adminService = {
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data.data),
  stats: () => api.get('/admin/stats').then((r) => r.data.data),
  departmentsAdmin: () => api.get('/admin/departments').then((r) => r.data.data),
  createDepartment: (payload) => api.post('/admin/departments', payload).then((r) => r.data.data),
  deactivate: (id) => api.patch(`/admin/users/${id}/deactivate`).then((r) => r.data.data),
  activate: (id) => api.patch(`/admin/users/${id}/activate`).then((r) => r.data.data),
  remove: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data.data),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data.data),
  approveIndustry: (id, approved) =>
    api.patch(`/admin/users/${id}/industry`, { approved }).then((r) => r.data.data),
};

export const miscService = {
  departments: () => api.get('/departments').then((r) => r.data.data),
  notifications: () => api.get('/notifications').then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data),
  markAll: () => api.patch('/notifications/read-all').then((r) => r.data.data),
  voice: (payload) => api.post('/ai/voice', payload).then((r) => r.data.data),
};
