import { apiClient } from './client';
import { Transaction, TransactionFilters } from '../types';

export const transactionApi = {
  getAll: async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const res = await apiClient.get<Transaction[]>('/transactions', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await apiClient.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: {
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string;
    note?: string | null;
  }): Promise<Transaction> => {
    const res = await apiClient.post<Transaction>('/transactions', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      categoryId?: string;
      type?: 'INCOME' | 'EXPENSE';
      amount?: number;
      date?: string;
      note?: string | null;
    }
  ): Promise<Transaction> => {
    const res = await apiClient.patch<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/transactions/${id}`);
    return res.data;
  },

  exportCsv: async (filters: TransactionFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);

    const res = await apiClient.get('/transactions/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
