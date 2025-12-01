import { api, ApiResponse } from '@/lib/fetch';

export interface Blog {
  id: number;
  public_id: string;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  status: 'draft' | 'published';
  is_featured: boolean;
  is_public: boolean;
  categories?: number[];
  tags?: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  is_featured?: boolean;
}

export const blogsApi = {
  // Get blogs list
  getBlogs: async (params?: BlogListParams): Promise<ApiResponse<Blog[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());

    const queryString = queryParams.toString();
    const endpoint = `/blog/${queryString ? `?${queryString}` : ''}`;

    return api.get<Blog[]>(endpoint);
  },

  // Get single blog by slug
  getBlog: async (slug: string): Promise<ApiResponse<Blog>> => {
    return api.get<Blog>(`/blog/${slug}/`);
  },
};

