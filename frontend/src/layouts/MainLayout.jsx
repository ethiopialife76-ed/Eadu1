import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Shield,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '../store/authStore';
import { useUi } from '../store/uiStore';
import NotificationBell from './NotificationBell';
import { disconnectSocket } from '../sockets/client';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'INSTRUCTOR', 'INDUSTRY', 'ADMIN'] },
  { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['STUDENT', 'INSTRUCTOR', 'INDUSTRY', 'ADMIN'] },
  { to: '/projects/new', label: 'Post project', icon: BookOpen, roles: ['STUDENT', 'INDUSTRY', 'ADMIN'] },
  { to: '/supervisors', label: 'Supervisors', icon: Users, roles: ['STUDENT', 'ADMIN'] },
  { to: '/supervisor-requests', label: 'Requests', icon: ClipboardList, roles: ['INSTRUCTOR', 'ADMIN'] },
  { to: '/admin', label: 'Administration', icon: Shield, roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', icon: UserCircle2, roles: ['STUDENT', 'INSTRUCTOR', 'INDUSTRY', 'ADMIN'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUi();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 hover:bg-stone-100 lg:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-dbu-600 font-display text-white">PM</span>
            <div className="text-left">
              <p className="font-display text-base leading-none">ProjectMarket</p>
              <p className="text-[11px] uppercase tracking-wide text-stone-500">Debre Berhan University</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-stone-500">{user?.role}</p>
          </div>
          <button
            className="rounded-xl p-2 hover:bg-rose-50"
            onClick={() => {
              disconnectSocket();
              logout();
              navigate('/');
            }}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} w-64 shrink-0 border-r bg-white p-4 lg:block`}
        >
          <nav className="space-y-1">
            {links
              .filter((l) => l.roles.includes(user?.role))
              .map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-dbu-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`
                  }
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </NavLink>
              ))}
          </nav>
          <div className="mt-8 rounded-2xl bg-dbu-50 p-3 text-xs text-dbu-900">
            <p className="font-semibold">Need help?</p>
            <p className="mt-1">Tap Selam in the corner. Speak or type — the agent can guide visitors and signed-in users.</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
