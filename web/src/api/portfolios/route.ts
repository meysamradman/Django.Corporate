import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PaginatedResponse } from "@/types/shared/pagination";

export const portfolioApi = {
  getPortfolioList: async (params?: Record<string, any>): Promise<PaginatedResponse<Portfolio>> => {
    let url = '/public/portfolio/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) queryParams.append(key, String(value));
      });
      const queryString = queryParams.toString();
      if (queryString) url += '?' + queryString;
    }
    const response = await fetchApi.get<Portfolio[]>(url);
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  },

  getPortfolioById: async (idOrSlug: string | number): Promise<Portfolio> => {
    const response = await fetchApi.get<Portfolio>(`/public/portfolio/${idOrSlug}/`);
    return response.data;
  },

  getCategories: async (): Promise<PaginatedResponse<PortfolioCategory>> => {
    const response = await fetchApi.get<PortfolioCategory[]>('/public/portfolio-category/');
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  },

  getTags: async (): Promise<PaginatedResponse<PortfolioTag>> => {
    const response = await fetchApi.get<PortfolioTag[]>('/public/portfolio-tag/');
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
    };
  }
};