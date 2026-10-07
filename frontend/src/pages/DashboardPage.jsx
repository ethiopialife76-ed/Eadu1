import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService, projectService, supervisorService } from '../services';
import { useAuth } from '../store/authStore';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects } = useQuery({ queryKey: ['projects', 'dash'], queryFn: () => projectService.list({ limit: 8 }) });
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.stats,
    enabled: user.role === 'ADMIN',
  });
  const { data: requests } = useQuery({
    queryKey: ['sup-req'],
    queryFn: supervisorService.incoming,
    enabled: user.role === 'INSTRUCTOR' || user.role === 'ADMIN',
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Hello, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-stone-600">
        {user.role === 'STUDENT' && 'Browse ideas, form a team, request a supervisor, and submit weekly reports.'}
        {user.role === 'INSTRUCTOR' && 'Review supervision requests, approve teams, and comment on progress.'}
        {user.role === 'INDUSTRY' && 'Propose real-world ideas and follow student progress after admin approval.'}
        {user.role === 'ADMIN' && 'Approve projects, manage users and departments, and watch platform health.'}
      </p>

      {user.role === 'INDUSTRY' && !user.industry_approved && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Your industry account is waiting for admin approval before you can post projects.
        </div>
      )}

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Users', stats.users],
            ['Projects', stats.projects],
            ['Pending review', stats.pending],
            ['Teams', stats.teams],
            ['Reports', stats.reports],
          ].map(([k, v]) => (
            <div key={k} className="card p-4">
              <p className="text-xs uppercase text-stone-500">{k}</p>
              <p className="font-display text-3xl">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl">Recent projects</h2>
        <Link to="/projects" className="text-sm text-dbu-600">
          View all
        </Link>
      </div>
      <div className="mt-3 divide-y rounded-2xl border bg-white">
        {(projects?.items || []).map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-stone-500">{p.department?.name}</p>
            </div>
            <StatusBadge status={p.status} />
          </Link>
        ))}
      </div>

      {requests && (
        <div className="mt-8">
          <h2 className="font-display text-2xl">Supervision requests</h2>
          <div className="mt-3 card divide-y">
            {requests.length === 0 && <p className="p-4 text-sm text-stone-500">No requests yet.</p>}
            {requests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <span>{r.project.title}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
