import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import VoiceAgent from './components/VoiceAgent';
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPage from './pages/ForgotPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectFormPage from './pages/ProjectFormPage';
import TeamPage from './pages/TeamPage';
import SupervisorsPage from './pages/SupervisorsPage';
import SupervisorRequestsPage from './pages/SupervisorRequestsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './store/authStore';

const client = new QueryClient();

function GuestOnly({ children }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectFormPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
            <Route path="/teams/:id" element={<TeamPage />} />
            <Route path="/supervisors" element={<SupervisorsPage />} />
            <Route
              path="/supervisor-requests"
              element={
                <RoleRoute roles={['INSTRUCTOR', 'ADMIN']}>
                  <SupervisorRequestsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute roles={['ADMIN']}>
                  <AdminPage />
                </RoleRoute>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        <VoiceAgent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
