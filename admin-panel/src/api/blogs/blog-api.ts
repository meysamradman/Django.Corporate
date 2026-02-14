import { api } from '@/core/config/api';
import type { Blog } from '@/types/blog/blog';
import type { BlogListParams } from '@/types/blog/blogListParams';
import { buildListUrl, toPaginatedResponse } from './shared';

const BLOG_BOOLEAN_FILTERS = new Set(['is_featured', 'is_public', 'is_active']);
const BLOG_RAW_STRING_FILTERS = new Set(['categories__in']);

const appendFormData = (formData: FormData, data: Partial<Blog> & { media_ids?: number[] }) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'media_ids') {
      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
};

export const blogCoreApi = {
  getBlogList: async (params?: BlogListParams) => {
    const url = buildListUrl('/admin/blog/', params as any, {
      booleanKeys: BLOG_BOOLEAN_FILTERS,
      rawStringKeys: BLOG_RAW_STRING_FILTERS,
    });
    const response = await api.get<Blog[]>(url);
    return toPaginatedResponse<Blog>(response, params as any);
  },

  getBlogById: async (id: number): Promise<Blog> => {
    const response = await api.get<Blog>('/admin/blog/' + id + '/');
    return response.data;
  },

  getBlogsByIds: async (ids: number[]): Promise<Blog[]> => {
    if (ids.length === 0) return [];
    const response = await api.get<Blog[]>(`/admin/blog/?ids=${ids.join(',')}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createBlog: async (data: Partial<Blog>): Promise<Blog> => {
    const response = await api.post<Blog>('/admin/blog/', data);
    return response.data;
  },

  createBlogWithMedia: async (data: Partial<Blog> & { media_ids?: number[] }, mediaFiles: File[]): Promise<Blog> => {
    const formData = new FormData();
    appendFormData(formData, data);

    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });

    if (data.media_ids && Array.isArray(data.media_ids) && data.media_ids.length > 0) {
      formData.append('media_ids', data.media_ids.join(','));
    }

    const response = await api.post<Blog>('/admin/blog/', formData);
    return response.data;
  },

  updateBlog: async (id: number, data: Partial<Blog>): Promise<Blog> => {
    const response = await api.put<Blog>('/admin/blog/' + id + '/', data);
    return response.data;
  },

  partialUpdateBlog: async (id: number, data: Partial<Blog>): Promise<Blog> => {
    const response = await api.patch<Blog>('/admin/blog/' + id + '/', data);
    return response.data;
  },

  addMediaToBlog: async (blogId: number, mediaFiles: File[], mediaIds?: number[]): Promise<Blog> => {
    const formData = new FormData();
    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });

    if (mediaIds && mediaIds.length > 0) {
      formData.append('media_ids', mediaIds.join(','));
    }

    const response = await api.post<Blog>('/admin/blog/' + blogId + '/add_media/', formData);
    return response.data;
  },

  deleteBlog: async (id: number): Promise<void> => {
    await api.delete('/admin/blog/' + id + '/');
  },

  bulkDeleteBlogs: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/blog/bulk-delete/', { ids });
    return response.data;
  },

  exportBlogPdf: async (blogId: number): Promise<void> => {
    const { exportBlogPdf } = await import('./export');
    return exportBlogPdf(blogId);
  },

  exportBlogs: async (filters?: BlogListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportBlogs } = await import('./export');
    return exportBlogs(filters, format);
  },
};
