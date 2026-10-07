import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useAuth } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('student@dbu.edu.et');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.login({ email, password });
      setSession(data.user, data.token);
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-dbu-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="font-display text-2xl">ProjectMarket DBU</p>
        <div>
          <h1 className="font-display text-4xl">Sign in to your campus workspace</h1>
          <p className="mt-4 text-white/80">Students, instructors, industry partners, and admins each get a role-specific dashboard.</p>
        </div>
        <p className="text-sm text-white/70">Debre Berhan University · Academic projects</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <h2 className="font-display text-3xl">Welcome back</h2>
          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-stone-600">
            No account? <Link className="text-dbu-600" to="/register">Register</Link>
            {' · '}
            <Link className="text-dbu-600" to="/forgot-password">Forgot password</Link>
          </p>
          <div className="rounded-2xl bg-stone-100 p-3 text-xs text-stone-600">
            Demo password for all seeded users: <strong>Password@123</strong>
            <br />
            student@dbu.edu.et · instructor@dbu.edu.et · admin@dbu.edu.et · industry@partner.et
          </div>
        </form>
      </div>
    </div>
  );
}
