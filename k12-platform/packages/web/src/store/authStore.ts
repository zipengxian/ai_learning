import { create } from 'zustand';
import type { User } from '@k12/shared';
import * as authApi from '@/api/auth';
import type { RegisterData } from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      set({ token: result.token, user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register(data);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      set({ token: result.token, user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const user = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },
}));