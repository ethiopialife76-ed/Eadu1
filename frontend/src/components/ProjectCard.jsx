import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Users } from 'lucide-react';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="card block p-5 hover:border-dbu-500 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-dbu-900">{project.title}</h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-stone-600">{project.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-500">
        <span>{project.department?.name}</span>
        <span className="rounded bg-stone-100 px-2 py-0.5">{project.type}</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.team?.members?.length || 0} members
        </span>
      </div>
    </Link>
  );
}
