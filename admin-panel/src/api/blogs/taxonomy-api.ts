import { api } from '@/core/config/api';
import type { BlogCategory } from '@/types/blog/category/blogCategory';
import type { BlogTag } from '@/types/blog/tags/blogTag';
import type { CategoryListParams, TagListParams } from '@/types/blog/blogListParams';
import type { BlogCategoryListParams } from '@/types/blog/category/blogCategoryFilter';
import { fetchPaginated } from './shared';

export const blogTaxonomyApi = {
  getCategories: async (params?: CategoryListParams | BlogCategoryListParams | Record<string, unknown>) => {
    return fetchPaginated<BlogCategory>('/admin/blog-category/', params as any);
  },

  createCategory: async (data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await api.post<BlogCategory>('/admin/blog-category/', data);
    return response.data;
  },

  getCategoryById: async (id: number): Promise<BlogCategory> => {
    const response = await api.get<BlogCategory>('/admin/blog-category/' + id + '/');
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await api.put<BlogCategory>('/admin/blog-category/' + id + '/', data);
    return response.data;
  },

  partialUpdateCategory: async (id: number, data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await api.patch<BlogCategory>('/admin/blog-category/' + id + '/', data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete('/admin/blog-category/' + id + '/');
  },

  bulkDeleteCategories: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/blog-category/bulk-delete/', { ids });
    return response.data;
  },

  getTags: async (params?: TagListParams) => {
    return fetchPaginated<BlogTag>('/admin/blog-tag/', params as any);
  },

  createTag: async (data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await api.post<BlogTag>('/admin/blog-tag/', data);
    return response.data;
  },

  getTagById: async (id: number): Promise<BlogTag> => {
    const response = await api.get<BlogTag>('/admin/blog-tag/' + id + '/');
    return response.data;
  },

  updateTag: async (id: number, data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await api.put<BlogTag>('/admin/blog-tag/' + id + '/', data);
    return response.data;
  },

  partialUpdateTag: async (id: number, data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await api.patch<BlogTag>('/admin/blog-tag/' + id + '/', data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/blog-tag/' + id + '/');
  },

  bulkDeleteTags: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/blog-tag/bulk-delete/', { ids });
    return response.data;
  },
};
