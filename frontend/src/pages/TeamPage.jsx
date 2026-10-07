import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { progressService, teamService } from '../services';
import { useAuth } from '../store/authStore';
import { getSocket } from '../sockets/client';

export default function TeamPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const { data: team } = useQuery({ queryKey: ['team', id], queryFn: () => teamService.get(id) });
  const { data: messages = [] } = useQuery({ queryKey: ['messages', id], queryFn: () => teamService.messages(id) });
  const { data: reports = [] } = useQuery({ queryKey: ['reports', id], queryFn: () => progressService.list(id) });
  const [chat, setChat] = useState('');
  const [live, setLive] = useState([]);
  const [week, setWeek] = useState(2);
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;
    const onMsg = (payload) => {
      if (Number(payload.teamId) === Number(id)) setLive((m) => [...m, payload]);
    };
    socket.on('team:message:received', onMsg);
    return () => socket.off('team:message:received', onMsg);
  }, [token, id]);

  const decide = useMutation({
    mutationFn: ({ requestId, status }) => teamService.decide(id, requestId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', id] }),
  });
  const approve = useMutation({
    mutationFn: () => teamService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', id] }),
  });
  const submitReport = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('team_id', id);
      fd.append('week', week);
      fd.append('description', desc);
      if (file) fd.append('file', file);
      return progressService.submit(fd);
    },
    onSuccess: () => {
      setDesc('');
      qc.invalidateQueries({ queryKey: ['reports', id] });
    },
    onError: (e) => alert(e.response?.data?.message || 'Could not submit report'),
  });

  if (!team) return <p>Loading team…</p>;

  const isLeader = team.leader_id === user.id;
  const allMessages = [
    ...messages.map((m) => ({
      id: m.id,
      message: m.content,
      sender: m.sender,
      timestamp: m.created_at,
    })),
    ...live,
  ];

  const sendChat = () => {
    const socket = getSocket(token);
    if (!chat.trim()) return;
    socket.emit('team:message', { teamId: Number(id), content: chat, senderId: user.id });
    setChat('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{team.project.title}</h1>
        <p className="text-stone-600">
          Leader {team.leader.name} · <StatusBadge status={team.status} />
        </p>
        <Link className="text-sm text-dbu-600" to={`/projects/${team.project_id}`}>
          Back to project
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-1">
          <h2 className="font-display text-xl">Members</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {team.members.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>{m.student.name}</span>
                {m.student_id === team.leader_id && <span className="text-xs text-dbu-600">Leader</span>}
              </li>
            ))}
          </ul>
          {isLeader && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Join requests</h3>
              {team.joinRequests.filter((r) => r.status === 'PENDING').map((r) => (
                <div key={r.id} className="mt-2 flex items-center justify-between text-sm">
                  {r.student.name}
                  <span className="flex gap-1">
                    <button className="btn-primary px-2 py-1 text-xs" onClick={() => decide.mutate({ requestId: r.id, status: 'ACCEPTED' })}>
                      Accept
                    </button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => decide.mutate({ requestId: r.id, status: 'REJECTED' })}>
                      Reject
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {['INSTRUCTOR', 'ADMIN'].includes(user.role) && team.status === 'FORMING' && (
            <button className="btn-primary mt-4 w-full" onClick={() => approve.mutate()}>
              Approve team formation
            </button>
          )}
        </div>

        <div className="card flex h-[420px] flex-col p-4 lg:col-span-2">
          <h2 className="font-display text-xl">Team chat</h2>
          <div className="mt-2 flex-1 space-y-2 overflow-y-auto rounded-xl bg-stone-50 p-3">
            {allMessages.map((m, i) => (
              <div key={m.id || i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender?.id === user.id ? 'ml-auto bg-dbu-600 text-white' : 'bg-white border'}`}>
                <p className="text-[11px] opacity-70">{m.sender?.name}</p>
                {m.message}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input" value={chat} onChange={(e) => setChat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Message the team" />
            <button className="btn-primary" onClick={sendChat}>
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-xl">Weekly progress</h2>
        {user.role === 'STUDENT' && (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input className="input" type="number" min="1" value={week} onChange={(e) => setWeek(e.target.value)} />
            <textarea className="input md:col-span-2" rows={2} placeholder="What did the team complete this week?" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              <button className="btn-primary mt-2 w-full" onClick={() => submitReport.mutate()}>
                Submit report
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border p-3">
              <p className="font-semibold">Week {r.week}</p>
              <p className="text-sm text-stone-700">{r.description}</p>
              {r.file_url && (
                <a
                  className="text-sm text-dbu-600"
                  href={r.file_url.startsWith('http') ? r.file_url : `http://localhost:5000${r.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Attachment
                </a>
              )}
              {r.comments?.map((c) => (
                <p key={c.id} className="mt-1 text-xs text-stone-500">
                  {c.author.name}: {c.content}
                </p>
              ))}
              {['INSTRUCTOR', 'ADMIN'].includes(user.role) && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await progressService.comment(r.id, comment);
                    setComment('');
                    qc.invalidateQueries({ queryKey: ['reports', id] });
                  }}
                >
                  <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment" />
                  <button className="btn-ghost">Comment</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
