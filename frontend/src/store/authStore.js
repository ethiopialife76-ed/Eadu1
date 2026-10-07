import { create } from 'zustand';

const saved = (() => {
  try {
    return JSON.parse(sessionStorage.getItem('pm-auth') || 'null');
  } catch {
    return null;
  }
})();

export const useAuth = create((set, get) => ({
  user: saved?.user || null,
  token: saved?.token || null,
  setSession: (user, token) => {
    sessionStorage.setItem('pm-auth', JSON.stringify({ user, token }));
    set({ user, token });
  },
  updateUser: (user) => {
    const token = get().token;
    sessionStorage.setItem('pm-auth', JSON.stringify({ user, token }));
    set({ user });
  },
  logout: () => {
    sessionStorage.removeItem('pm-auth');
    set({ user: null, token: null });
  },
}));
