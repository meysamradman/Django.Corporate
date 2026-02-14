import { api } from '@/core/config/api';
import type { PortfolioOption } from '@/types/portfolio/options/portfolioOption';
import type { TagListParams } from '@/types/portfolio/portfolioListParams';
import { fetchPaginated } from './shared';

export const portfolioOptionsApi = {
  getOptions: async (params?: TagListParams) => {
    return fetchPaginated<PortfolioOption>('/admin/portfolio-option/', params as any);
  },

  createOption: async (data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.post<PortfolioOption>('/admin/portfolio-option/', data);
    return response.data;
  },

  getOptionById: async (id: number): Promise<PortfolioOption> => {
    const response = await api.get<PortfolioOption>('/admin/portfolio-option/' + id + '/');
    return response.data;
  },

  updateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.put<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  partialUpdateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.patch<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  deleteOption: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-option/' + id + '/');
  },

  bulkDeleteOptions: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/portfolio-option/bulk-delete/', { ids });
    return response.data;
  },
};
