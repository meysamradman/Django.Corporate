import { api, ApiResponse } from '@/lib/fetch';

export interface Portfolio {
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

export interface PortfolioListParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  is_featured?: boolean;
}

export const portfoliosApi = {
  // Get portfolios list
  getPortfolios: async (params?: PortfolioListParams): Promise<ApiResponse<Portfolio[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());

    const queryString = queryParams.toString();
    const endpoint = `/portfolio/${queryString ? `?${queryString}` : ''}`;

    return api.get<Portfolio[]>(endpoint);
  },

  // Get single portfolio by slug
  getPortfolio: async (slug: string): Promise<ApiResponse<Portfolio>> => {
    return api.get<Portfolio>(`/portfolio/${slug}/`);
  },

  // Get single portfolio by public_id
  getPortfolioByPublicId: async (publicId: string): Promise<ApiResponse<Portfolio>> => {
    return api.get<Portfolio>(`/portfolio/p/${publicId}/`);
  },
};

