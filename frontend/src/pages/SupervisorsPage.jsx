import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supervisorService, projectService } from '../services';
import { useAuth } from '../store/authStore';

export default function SupervisorsPage() {
  const { user } = useAuth();
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: supervisorService.list });
  const { data: projects } = useQuery({ queryKey: ['projects-mine'], queryFn: () => projectService.list({ limit: 50 }) });
  const mine = (projects?.items || []).filter((p) => p.team?.leader_id === user.id && !p.supervisor_id && p.team.status === 'ACTIVE');
  const [projectId, setProjectId] = useState('');

  const request = useMutation({
    mutationFn: (instructor_id) =>
      supervisorService.request({ project_id: Number(projectId), instructor_id }),
    onSuccess: () => alert('Request sent. The instructor will be notified.'),
    onError: (e) => alert(e.response?.data?.message || 'Could not send request'),
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Available instructors</h1>
      <p className="text-stone-600">Team leaders request a supervisor after the team is approved.</p>
      {mine.length > 0 && (
        <div className="mt-4 max-w-sm">
          <label className="label">Project</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Select your project</option>
            {mine.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {instructors.map((i) => (
          <div key={i.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-stone-500">{i.department?.name}</p>
            </div>
            {user.role === 'STUDENT' && (
              <button className="btn-primary" disabled={!projectId} onClick={() => request.mutate(i.id)}>
                Request
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
