import { create } from 'zustand';

export const useUi = create((set) => ({
  sidebarOpen: true,
  unread: 0,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setUnread: (n) => set({ unread: n }),
}));
