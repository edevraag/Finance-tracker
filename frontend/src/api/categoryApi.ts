import { apiClient } from './client';
import { Category } from '../types';

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },

  getById: async (id: string): Promise<Category> => {
    const res = await apiClient.get<Category>(`/categories/${id}`);
    return res.data;
  },

  create: async (data: { name: string; color?: string }): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', data);
    return res.data;
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Category> => {
    const res = await apiClient.patch<Category>(`/categories/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/categories/${id}`);
    return res.data;
  },
};
