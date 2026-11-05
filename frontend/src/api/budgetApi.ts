import { apiClient } from './client';
import { Budget } from '../types';

export const budgetApi = {
  getAll: async (month?: string): Promise<Budget[]> => {
    const params = month ? { month } : {};
    const res = await apiClient.get<Budget[]>('/budgets', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Budget> => {
    const res = await apiClient.get<Budget>(`/budgets/${id}`);
    return res.data;
  },

  upsert: async (data: { categoryId: string; month: string; limitAmount: number }): Promise<Budget> => {
    const res = await apiClient.post<Budget>('/budgets', data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/budgets/${id}`);
    return res.data;
  },
};
