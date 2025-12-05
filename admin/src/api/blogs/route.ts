import { fetchApi } from "@/core/config/fetch";
import { Blog } from "@/types/blog/blog";
import { BlogCategory } from "@/types/blog/category/blogCategory";
import { BlogTag } from "@/types/blog/tags/blogTag";
import { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { ApiResponse } from "@/types/api/apiResponse";
import { convertToLimitOffset } from '@/core/utils/pagination';
import {
    BlogListParams,
    BlogFilters,
    CategoryListParams,
    TagListParams
} from "@/types/blog/blogListParams";

export const blogApi = {
  getBlogList: async (params?: BlogListParams): Promise<PaginatedResponse<Blog>> => {
    let url = '/admin/blog/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        delete apiParams.page;
        delete apiParams.size;
      }
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'is_featured' || key === 'is_public' || key === 'is_active') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          } else if (key === 'categories__in') {
            queryParams.append(key, value as string);
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    const response = await fetchApi.get<Blog[]>(url);
    
    if (!response) {
      return {
        data: [],
        pagination: {
          count: 0,
          next: null,
          previous: null,
          page_size: params?.size || 10,
          current_page: 1,
          total_pages: 0
        }
      };
    }
    
    const responseData = Array.isArray(response.data) ? response.data : [];
    const responsePagination = response.pagination;
    
    const pagination: ApiPagination = {
      count: responsePagination?.count || responseData.length,
      next: responsePagination?.next || null,
      previous: responsePagination?.previous || null,
      page_size: responsePagination?.page_size || (params?.size || 10),
      current_page: responsePagination?.current_page || (params?.page || 1),
      total_pages: responsePagination?.total_pages || Math.ceil((responsePagination?.count || responseData.length) / (params?.size || 10))
    };
    
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  getBlogById: async (id: number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>('/admin/blog/' + id + '/');
    return response.data;
  },

  createBlog: async (data: Partial<Blog>): Promise<Blog> => {
    const response = await fetchApi.post<Blog>('/admin/blog/', data);
    return response.data;
  },

  createBlogWithMedia: async (data: Partial<Blog>, mediaFiles: File[]): Promise<Blog> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'media_ids') {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });
    
    if (data.media_ids && Array.isArray(data.media_ids) && data.media_ids.length > 0) {
      formData.append('media_ids', data.media_ids.join(','));
    }
    
    const response = await fetchApi.post<Blog>('/admin/blog/', formData);
    return response.data;
  },

  updateBlog: async (id: number, data: Partial<Blog>): Promise<Blog> => {
    const response = await fetchApi.put<Blog>('/admin/blog/' + id + '/', data);
    return response.data;
  },

  partialUpdateBlog: async (id: number, data: Partial<Blog>): Promise<Blog> => {
    const response = await fetchApi.patch<Blog>('/admin/blog/' + id + '/', data);
    return response.data;
  },

  addMediaToBlog: async (blogId: number, mediaFiles: File[], mediaIds?: number[]): Promise<any> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });
    
    if (mediaIds && mediaIds.length > 0) {
      formData.append('media_ids', mediaIds.join(','));
    }
    
    const response = await fetchApi.post('/admin/blog/' + blogId + '/add_media/', formData);
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

  deleteBlog: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/blog/' + id + '/');
  },

  bulkDeleteBlogs: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/blog/bulk-delete/', { ids });
    return response.data;
  },

  getCategories: async (params?: CategoryListParams): Promise<PaginatedResponse<BlogCategory>> => {
    let url = '/admin/blog-category/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        delete apiParams.page;
        delete apiParams.size;
      }
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    const response = await fetchApi.get<BlogCategory[]>(url);
    
    const responseData = Array.isArray(response.data) ? response.data : [];
    const responsePagination = response.pagination;
    
    const pagination: ApiPagination = {
      count: responsePagination?.count || responseData.length,
      next: responsePagination?.next || null,
      previous: responsePagination?.previous || null,
      page_size: responsePagination?.page_size || (params?.size || 10),
      current_page: responsePagination?.current_page || (params?.page || 1),
      total_pages: responsePagination?.total_pages || Math.ceil((responsePagination?.count || responseData.length) / (params?.size || 10))
    };
    
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createCategory: async (data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await fetchApi.post<BlogCategory>('/admin/blog-category/', data);
    return response.data;
  },

  getCategoryById: async (id: number): Promise<BlogCategory> => {
    const response = await fetchApi.get<BlogCategory>('/admin/blog-category/' + id + '/');
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await fetchApi.put<BlogCategory>('/admin/blog-category/' + id + '/', data);
    return response.data;
  },

  partialUpdateCategory: async (id: number, data: Partial<BlogCategory>): Promise<BlogCategory> => {
    const response = await fetchApi.patch<BlogCategory>('/admin/blog-category/' + id + '/', data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/blog-category/' + id + '/');
  },

  bulkDeleteCategories: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/blog-category/bulk-delete/', { ids });
    return response.data;
  },

  getTags: async (params?: TagListParams): Promise<PaginatedResponse<BlogTag>> => {
    let url = '/admin/blog-tag/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        delete apiParams.page;
        delete apiParams.size;
      }
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    const response = await fetchApi.get<BlogTag[]>(url);
    
    const responseData = Array.isArray(response.data) ? response.data : [];
    const responsePagination = response.pagination;
    
    const pagination: ApiPagination = {
      count: responsePagination?.count || responseData.length,
      next: responsePagination?.next || null,
      previous: responsePagination?.previous || null,
      page_size: responsePagination?.page_size || (params?.size || 10),
      current_page: responsePagination?.current_page || (params?.page || 1),
      total_pages: responsePagination?.total_pages || Math.ceil((responsePagination?.count || responseData.length) / (params?.size || 10))
    };
    
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createTag: async (data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await fetchApi.post<BlogTag>('/admin/blog-tag/', data);
    return response.data;
  },

  getTagById: async (id: number): Promise<BlogTag> => {
    const response = await fetchApi.get<BlogTag>('/admin/blog-tag/' + id + '/');
    return response.data;
  },

  updateTag: async (id: number, data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await fetchApi.put<BlogTag>('/admin/blog-tag/' + id + '/', data);
    return response.data;
  },

  partialUpdateTag: async (id: number, data: Partial<BlogTag>): Promise<BlogTag> => {
    const response = await fetchApi.patch<BlogTag>('/admin/blog-tag/' + id + '/', data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/blog-tag/' + id + '/');
  },

  bulkDeleteTags: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/blog-tag/bulk-delete/', { ids });
    return response.data;
  },
};