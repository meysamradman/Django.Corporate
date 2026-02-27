import { fetchApi } from "@/core/config/fetch";
import { Blog } from "@/types/blog/blog";
import { BlogCategory } from "@/types/blog/category/blogCategory";
import { BlogCategoryListParams } from "@/types/blog/category/blogCategoryFilter";
import { BlogTag } from "@/types/blog/tags/blogTag";
import { BlogTagListParams } from "@/types/blog/tags/blogTagFilter";
import { BlogListParams } from "@/types/blog/blogListParams";
import { PaginatedResponse } from "@/types/shared/pagination";
import { toLimitOffsetQuery, toPaginatedResponse, withQuery } from "@/api/shared";

const BLOG_CACHE = {
  list: { next: { revalidate: 60, tags: ["blogs:list"] } },
  detail: { next: { revalidate: 60, tags: ["blogs:detail"] } },
  taxonomy: { next: { revalidate: 120, tags: ["blogs:taxonomy"] } },
};

export const blogApi = {
  getBlogList: async (params?: BlogListParams): Promise<PaginatedResponse<Blog>> => {
    const ordering = params?.ordering || (params?.order_by
      ? `${params.order_desc ? "-" : ""}${params.order_by}`
      : undefined);

    const queryParams = toLimitOffsetQuery(
      params as (BlogListParams & Record<string, unknown>) | undefined,
      {
        ordering,
        order_by: undefined,
        order_desc: undefined,
      }
    );

    const response = await fetchApi.get<Blog[]>(withQuery("/blog/", queryParams), BLOG_CACHE.list);
    return toPaginatedResponse<Blog>(response, params?.size || 10);
  },

  getBlogById: async (idOrSlug: string | number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/${idOrSlug}/`, BLOG_CACHE.detail);
    return response.data;
  },

  getBlogByPublicId: async (publicId: string): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/p/${publicId}/`, BLOG_CACHE.detail);
    return response.data;
  },

  getBlogByNumericId: async (id: string | number): Promise<Blog> => {
    const response = await fetchApi.get<Blog>(`/blog/id/${id}/`, BLOG_CACHE.detail);
    return response.data;
  },

  getCategories: async (params?: BlogCategoryListParams): Promise<PaginatedResponse<BlogCategory>> => {
    const response = await fetchApi.get<BlogCategory[]>(withQuery("/blog-category/", params as Record<string, unknown>), BLOG_CACHE.taxonomy);
    return toPaginatedResponse<BlogCategory>(response, params?.size || 20);
  },

  getCategoryByNumericId: async (id: string | number): Promise<BlogCategory> => {
    const response = await fetchApi.get<BlogCategory>(`/blog-category/id/${id}/`, BLOG_CACHE.taxonomy);
    return response.data;
  },

  getTags: async (params?: BlogTagListParams): Promise<PaginatedResponse<BlogTag>> => {
    const response = await fetchApi.get<BlogTag[]>(withQuery("/blog-tag/", params as Record<string, unknown>), BLOG_CACHE.taxonomy);
    return toPaginatedResponse<BlogTag>(response, params?.size || 20);
  },

  getTagByNumericId: async (id: string | number): Promise<BlogTag> => {
    const response = await fetchApi.get<BlogTag>(`/blog-tag/id/${id}/`, BLOG_CACHE.taxonomy);
    return response.data;
  },
};
