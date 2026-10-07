import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-2xl">403 — Access denied</h2>
        <p className="mt-2 text-stone-600">Your role cannot open this page.</p>
      </div>
    );
  }
  return children;
}
