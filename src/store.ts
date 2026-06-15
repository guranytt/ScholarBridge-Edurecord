import { create } from 'zustand';

interface StoreState {
  user: any | null;
  token: string | null;
  setUser: (user: any, token: string) => void;
  logout: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
