import { api } from '@/core/config/api';
import type { PortfolioCategory } from '@/types/portfolio/category/portfolioCategory';
import type { PortfolioTag } from '@/types/portfolio/tags/portfolioTag';
import type { CategoryListParams, TagListParams } from '@/types/portfolio/portfolioListParams';
import { fetchPaginated } from './shared';

export const portfolioTaxonomyApi = {
  getCategories: async (params?: CategoryListParams) => {
    return fetchPaginated<PortfolioCategory>('/admin/portfolio-category/', params as any);
  },

  createCategory: async (data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.post<PortfolioCategory>('/admin/portfolio-category/', data);
    return response.data;
  },

  getCategoryById: async (id: number): Promise<PortfolioCategory> => {
    const response = await api.get<PortfolioCategory>('/admin/portfolio-category/' + id + '/');
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.put<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  partialUpdateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.patch<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-category/' + id + '/');
  },

  bulkDeleteCategories: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/portfolio-category/bulk-delete/', { ids });
    return response.data;
  },

  getTags: async (params?: TagListParams) => {
    return fetchPaginated<PortfolioTag>('/admin/portfolio-tag/', params as any);
  },

  createTag: async (data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.post<PortfolioTag>('/admin/portfolio-tag/', data);
    return response.data;
  },

  getTagById: async (id: number): Promise<PortfolioTag> => {
    const response = await api.get<PortfolioTag>('/admin/portfolio-tag/' + id + '/');
    return response.data;
  },

  updateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.put<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  partialUpdateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.patch<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-tag/' + id + '/');
  },

  bulkDeleteTags: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/portfolio-tag/bulk-delete/', { ids });
    return response.data;
  },
};
