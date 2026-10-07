import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, miscService } from '../services';
import { useAuth } from '../store/authStore';

export default function RegisterPage() {
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: miscService.departments });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        department_id: form.role === 'INDUSTRY' ? null : Number(form.department_id),
      };
      const data = await authService.register(payload);
      setSession(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link to="/" className="text-sm text-dbu-600">
        ← Home
      </Link>
      <h1 className="mt-4 font-display text-3xl">Create your DBU account</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="label">Password (min 8 characters)</label>
          <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="INDUSTRY">Industry partner</option>
          </select>
        </div>
        {form.role !== 'INDUSTRY' && (
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department_id} onChange={(e) => set('department_id', e.target.value)} required>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Register'}
        </button>
        <p className="text-sm text-stone-600">
          Already registered? <Link className="text-dbu-600" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
