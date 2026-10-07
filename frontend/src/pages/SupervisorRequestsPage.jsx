import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../components/StatusBadge';
import { supervisorService } from '../services';

export default function SupervisorRequestsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['sup-req'], queryFn: supervisorService.incoming });
  const decide = useMutation({
    mutationFn: ({ id, status }) => supervisorService.decide(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sup-req'] }),
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Supervision requests</h1>
      <div className="mt-4 card divide-y">
        {data.length === 0 && <p className="p-4 text-sm text-stone-500">No requests.</p>}
        {data.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{r.project.title}</p>
              <p className="text-xs text-stone-500">{r.project.department?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.status} />
              {r.status === 'PENDING' && (
                <>
                  <button className="btn-primary" onClick={() => decide.mutate({ id: r.id, status: 'ACCEPTED' })}>
                    Accept
                  </button>
                  <button className="btn-ghost" onClick={() => decide.mutate({ id: r.id, status: 'REJECTED' })}>
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
