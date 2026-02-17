import { fetchApi } from "@/core/config/fetch";
import { Blog } from "@/types/blog/blog";
import { BlogCategory } from "@/types/blog/category/blogCategory";
import { BlogCategoryListParams } from "@/types/blog/category/blogCategoryFilter";
import { BlogTag } from "@/types/blog/tags/blogTag";
import { BlogTagListParams } from "@/types/blog/tags/blogTagFilter";
import { BlogListParams } from "@/types/blog/blogListParams";
import { PaginatedResponse } from "@/types/shared/pagination";
import { toPaginatedResponse, withQuery } from "@/api/shared";

export const blogApi = {
  getBlogList: async (params?: BlogListParams): Promise<PaginatedResponse<Blog>> => {
    const limit = params?.size;
    const offset = params?.page && params?.size ? (params.page - 1) * params.size : undefined;
    const ordering = params?.ordering || (params?.order_by
      ? `${params.order_desc ? "-" : ""}${params.order_by}`
      : undefined);

    const queryParams = {
      ...params,
      limit,
      offset,
      ordering,
      page: undefined,
      size: undefined,
      order_by: undefined,
      order_desc: undefined,
    } as Record<string, unknown>;

    const response = await fetchApi.get<Blog[]>(withQuery("/blog/", queryParams));
    return toPaginatedResponse<Blog>(response, params?.size || 10);
  },

  getBlogById: async (idOrSlug: string | number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/${idOrSlug}/`);
    return response.data;
  },

  getBlogByPublicId: async (publicId: string): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/p/${publicId}/`);
    return response.data;
  },

  getBlogByNumericId: async (id: string | number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/id/${id}/`);
    return response.data;
  },

  getCategories: async (params?: BlogCategoryListParams): Promise<PaginatedResponse<BlogCategory>> => {
    const response = await fetchApi.get<BlogCategory[]>(withQuery("/blog-category/", params as Record<string, unknown>));
    return toPaginatedResponse<BlogCategory>(response, params?.size || 20);
  },

  getTags: async (params?: BlogTagListParams): Promise<PaginatedResponse<BlogTag>> => {
    const response = await fetchApi.get<BlogTag[]>(withQuery("/blog-tag/", params as Record<string, unknown>));
    return toPaginatedResponse<BlogTag>(response, params?.size || 20);
  },
};
