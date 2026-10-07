import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { projectService, teamService } from '../services';
import { useAuth } from '../store/authStore';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id),
  });

  const createTeam = useMutation({
    mutationFn: () => teamService.create(Number(id)),
    onSuccess: (team) => navigate(`/teams/${team.id}`),
    onError: (e) => alert(e.response?.data?.message || 'Could not create team'),
  });
  const join = useMutation({
    mutationFn: () => teamService.join(project.team.id),
    onSuccess: () => alert('Join request sent to the team leader'),
    onError: (e) => alert(e.response?.data?.message || 'Could not join'),
  });
  const statusMut = useMutation({
    mutationFn: (status) => projectService.status(id, { status, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', id] }),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="text-rose-700">Project not found.</p>;

  const canPostTeam = user.role === 'STUDENT' && ['APPROVED', 'OPEN'].includes(project.status) && !project.team;
  const canJoin = user.role === 'STUDENT' && project.team && project.team.leader_id !== user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{project.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
            <StatusBadge status={project.status} />
            <span>{project.department?.name}</span>
            <span>{project.type}</span>
            <span>Posted by {project.poster?.name}</span>
          </div>
        </div>
        {project.posted_by === user.id && (
          <Link className="btn-ghost" to={`/projects/${id}/edit`}>
            Edit
          </Link>
        )}
      </div>
      <div className="card p-5 whitespace-pre-wrap text-stone-700">{project.description}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-xl">Team</h2>
          {project.team ? (
            <div className="mt-3 space-y-2 text-sm">
              <p>
                Status: <StatusBadge status={project.team.status} />
              </p>
              <p>Leader: {project.team.leader?.name}</p>
              <p>Members: {project.team.members?.length || 0}</p>
              <Link className="btn-primary mt-2" to={`/teams/${project.team.id}`}>
                Open team workspace
              </Link>
              {canJoin && (
                <button className="btn-ghost mt-2" onClick={() => join.mutate()}>
                  Request to join
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-stone-600">No team yet.</p>
              {canPostTeam && (
                <button className="btn-primary mt-3" onClick={() => createTeam.mutate()}>
                  Create team (become leader)
                </button>
              )}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl">Supervisor</h2>
          {project.supervisor ? (
            <p className="mt-3 text-sm">{project.supervisor.name}</p>
          ) : (
            <p className="mt-3 text-sm text-stone-600">Not assigned. Team leaders can request an instructor after the team is active.</p>
          )}
          {user.role === 'STUDENT' && project.team?.leader_id === user.id && project.team.status === 'ACTIVE' && !project.supervisor_id && (
            <Link className="btn-primary mt-3" to="/supervisors">
              Request supervisor
            </Link>
          )}
        </div>
      </div>
      {user.role === 'ADMIN' && (
        <div className="card p-5">
          <h2 className="font-display text-xl">Admin review</h2>
          <textarea className="input mt-3" rows={2} placeholder="Optional reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={() => statusMut.mutate('APPROVED')}>
              Approve
            </button>
            <button className="btn-ghost" onClick={() => statusMut.mutate('REJECTED')}>
              Reject
            </button>
            <button className="btn-ghost" onClick={() => statusMut.mutate('COMPLETED')}>
              Mark completed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
