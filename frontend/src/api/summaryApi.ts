import { apiClient } from './client';
import { SummaryData } from '../types';

export const summaryApi = {
  get: async (month?: string): Promise<SummaryData> => {
    const params = month ? { month } : {};
    const res = await apiClient.get<SummaryData>('/summary', { params });
    return res.data;
  },
};
