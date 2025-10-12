import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PaginatedResponse } from "@/types/shared/pagination";

// Define types
export interface PortfolioListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  // is_active?: boolean; // Removed because backend doesn't support filtering by is_active
}

export interface PortfolioFilters {
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  // is_active?: boolean; // Removed because backend doesn't support filtering by is_active
}

// Category and Tag types
export interface CategoryListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean;
  is_public?: boolean;
}

export interface TagListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean;
  is_public?: boolean;
}

// Portfolio API functions
export const portfolioApi = {
  // Get portfolio list
  getPortfolioList: async (params?: PortfolioListParams): Promise<PaginatedResponse<Portfolio>> => {
    // Build query string from params
    let url = '/admin/portfolio/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await fetchApi.get<PaginatedResponse<Portfolio>>(url);
    return response.data;
  },

  // Get portfolio by ID
  getPortfolioById: async (id: number): Promise<Portfolio> => {
    const response = await fetchApi.get<Portfolio>(`/admin/portfolio/${id}/`);
    return response.data;
  },

  // Create portfolio
  createPortfolio: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.post<Portfolio>('/admin/portfolio/', data);
    return response.data;
  },

  // Update portfolio
  updatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.put<Portfolio>(`/admin/portfolio/${id}/`, data);
    return response.data;
  },

  // Partial update portfolio
  partialUpdatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.patch<Portfolio>(`/admin/portfolio/${id}/`, data);
    return response.data;
  },

  // Delete portfolio
  deletePortfolio: async (id: number): Promise<void> => {
    await fetchApi.delete(`/admin/portfolio/${id}/`);
  },

  // Bulk delete portfolios
  bulkDeletePortfolios: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/portfolio/bulk-delete/', { ids });
    return response.data;
  },

  // Category functions
  getCategories: async (params?: CategoryListParams): Promise<PaginatedResponse<PortfolioCategory>> => {
    let url = '/admin/portfolio-category/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await fetchApi.get<PaginatedResponse<PortfolioCategory>>(url);
    return response.data;
  },

  // Create category
  createCategory: async (data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.post<PortfolioCategory>('/admin/portfolio-category/', data);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: number): Promise<PortfolioCategory> => {
    const response = await fetchApi.get<PortfolioCategory>(`/admin/portfolio-category/${id}/`);
    return response.data;
  },

  // Update category
  updateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.put<PortfolioCategory>(`/admin/portfolio-category/${id}/`, data);
    return response.data;
  },

  // Partial update category
  partialUpdateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.patch<PortfolioCategory>(`/admin/portfolio-category/${id}/`, data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: number): Promise<void> => {
    await fetchApi.delete(`/admin/portfolio-category/${id}/`);
  },

  // Bulk delete categories
  bulkDeleteCategories: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/portfolio-category/bulk-delete/', { ids });
    return response.data;
  },

  // Tag functions
  getTags: async (params?: TagListParams): Promise<PaginatedResponse<PortfolioTag>> => {
    let url = '/admin/portfolio-tag/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await fetchApi.get<PaginatedResponse<PortfolioTag>>(url);
    return response.data;
  },

  // Create tag
  createTag: async (data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.post<PortfolioTag>('/admin/portfolio-tag/', data);
    return response.data;
  },

  // Get tag by ID
  getTagById: async (id: number): Promise<PortfolioTag> => {
    const response = await fetchApi.get<PortfolioTag>(`/admin/portfolio-tag/${id}/`);
    return response.data;
  },

  // Update tag
  updateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.put<PortfolioTag>(`/admin/portfolio-tag/${id}/`, data);
    return response.data;
  },

  // Partial update tag
  partialUpdateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.patch<PortfolioTag>(`/admin/portfolio-tag/${id}/`, data);
    return response.data;
  },

  // Delete tag
  deleteTag: async (id: number): Promise<void> => {
    await fetchApi.delete(`/admin/portfolio-tag/${id}/`);
  },

  // Bulk delete tags
  bulkDeleteTags: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/portfolio-tag/bulk-delete/', { ids });
    return response.data;
  },
};