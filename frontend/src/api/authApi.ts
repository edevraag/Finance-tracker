import { apiClient } from './client';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<{ user: User }> => {
    const res = await apiClient.patch<{ user: User }>('/auth/profile', data);
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ message: string }>('/auth/change-password', data);
    return res.data;
  },
};
