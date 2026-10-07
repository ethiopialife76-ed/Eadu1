export default function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    OPEN: 'bg-sky-100 text-sky-800',
    COMPLETED: 'bg-stone-200 text-stone-700',
    REJECTED: 'bg-rose-100 text-rose-800',
    FORMING: 'bg-indigo-100 text-indigo-800',
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    DISBANDED: 'bg-stone-200 text-stone-600',
    ACCEPTED: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-stone-100'}`}>
      {status}
    </span>
  );
}
