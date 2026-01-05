import { fetchApi } from "@/core/config/fetch";
import { Blog } from "@/types/blog/blog";
import { BlogCategory } from "@/types/blog/category/blogCategory";
import { BlogTag } from "@/types/blog/tags/blogTag";
import { PaginatedResponse } from "@/types/shared/pagination";

export const blogApi = {
  getBlogList: async (params?: Record<string, any>): Promise<PaginatedResponse<Blog>> => {
    let url = '/public/blog/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) queryParams.append(key, String(value));
      });
      const queryString = queryParams.toString();
      if (queryString) url += '?' + queryString;
    }
    const response = await fetchApi.get<Blog[]>(url);
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  },

  getBlogById: async (idOrSlug: string | number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/public/blog/${idOrSlug}/`);
    return response.data;
  },

  getCategories: async (): Promise<PaginatedResponse<BlogCategory>> => {
    const response = await fetchApi.get<BlogCategory[]>('/public/blog-category/');
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  },

  getTags: async (): Promise<PaginatedResponse<BlogTag>> => {
    const response = await fetchApi.get<BlogTag[]>('/public/blog-tag/');
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  }
};