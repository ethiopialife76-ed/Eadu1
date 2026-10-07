import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');
  const [devToken, setDevToken] = useState('');

  const request = async (e) => {
    e.preventDefault();
    const data = await authService.forgot(email);
    setInfo(data.message);
    if (data.devToken) {
      setDevToken(data.devToken);
      setToken(data.devToken);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    const data = await authService.reset({ token, newPassword });
    setInfo(data.message);
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to="/login" className="text-sm text-dbu-600">
        ← Back to sign in
      </Link>
      <h1 className="mt-4 font-display text-3xl">Reset password</h1>
      {info && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{info}</p>}
      <form onSubmit={request} className="mt-6 space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn-primary w-full">Send reset token</button>
      </form>
      {devToken && <p className="mt-3 break-all text-xs text-stone-500">Development token: {devToken}</p>}
      <form onSubmit={reset} className="mt-8 space-y-3">
        <input className="input" placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button className="btn-ghost w-full">Set new password</button>
      </form>
    </div>
  );
}
