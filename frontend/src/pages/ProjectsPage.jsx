import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { miscService, projectService } from '../services';
import { useAuth } from '../store/authStore';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [department_id, setDepartmentId] = useState('');
  const [type, setType] = useState('');
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: miscService.departments });
  const { data, isLoading } = useQuery({
    queryKey: ['projects', q, status, department_id, type],
    queryFn: () => projectService.list({ q, status, department_id, type, limit: 24 }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Project marketplace</h1>
          <p className="text-stone-600">Search by title or keyword. Filter by department, type, and status.</p>
        </div>
        {['STUDENT', 'INDUSTRY', 'ADMIN'].includes(user.role) && (
          <Link className="btn-primary" to="/projects/new">
            Post project
          </Link>
        )}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING', 'APPROVED', 'OPEN', 'COMPLETED', 'REJECTED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" value={department_id} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>ACADEMIC</option>
          <option>INDUSTRY</option>
        </select>
      </div>
      {isLoading && <p className="mt-8 text-stone-500">Loading projects…</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data?.items || []).map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      {data && data.items.length === 0 && <p className="mt-8 text-stone-500">No projects match these filters.</p>}
    </div>
  );
}
