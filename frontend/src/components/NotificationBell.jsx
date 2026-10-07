import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { miscService } from '../services';
import { useUi } from '../store/uiStore';
import { getSocket } from '../sockets/client';
import { useAuth } from '../store/authStore';

export default function NotificationBell() {
  const { token } = useAuth();
  const { unread, setUnread } = useUi();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: miscService.notifications,
    enabled: Boolean(token),
  });

  useEffect(() => {
    setUnread(data.filter((n) => !n.read).length);
  }, [data, setUnread]);

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;
    const onNew = () => qc.invalidateQueries({ queryKey: ['notifications'] });
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [token, qc]);

  const markAll = useMutation({
    mutationFn: miscService.markAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative">
      <button className="relative rounded-full p-2 hover:bg-stone-100" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold">
            Notifications
            <button className="text-xs text-dbu-600" onClick={() => markAll.mutate()}>
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.length === 0 && <p className="p-4 text-sm text-stone-500">No notifications yet.</p>}
            {data.map((n) => (
              <Link
                key={n.id}
                to={n.link || '/dashboard'}
                onClick={() => {
                  if (!n.read) miscService.markRead(n.id);
                  setOpen(false);
                }}
                className={`block border-b px-3 py-2 text-sm hover:bg-stone-50 ${!n.read ? 'bg-dbu-50' : ''}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-stone-600">{n.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
