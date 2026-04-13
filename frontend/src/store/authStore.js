import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  hydrate: async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const { getMe } = await import('../api/auth');
            const res = await getMe();
            set({ user: res.data, token });
        } catch (err) {
            localStorage.removeItem('token');
            set({ user: null, token: null });
        }
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
