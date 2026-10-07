import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { authService, miscService } from '../services';
import { useAuth } from '../store/authStore';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: miscService.departments });
  const [name, setName] = useState(user.name);
  const [department_id, setDepartmentId] = useState(user.department_id || '');
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [info, setInfo] = useState('');

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-display text-3xl">Profile</h1>
      {info && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{info}</p>}
      <form
        className="card space-y-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = await authService.updateProfile({
            name,
            department_id: department_id ? Number(department_id) : null,
          });
          updateUser(data);
          setInfo('Profile updated');
        }}
      >
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={user.email} disabled />
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" value={department_id} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary">Save profile</button>
      </form>
      <form
        className="card space-y-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await authService.changePassword({ currentPassword, newPassword });
          setInfo('Password changed');
          setCurrent('');
          setNew('');
        }}
      >
        <h2 className="font-display text-xl">Change password</h2>
        <input className="input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
        <button className="btn-ghost">Update password</button>
      </form>
    </div>
  );
}
