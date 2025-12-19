import { api } from '@/core/config/api';
import type { Portfolio } from "@/types/portfolio/portfolio";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import type { ApiResponse } from "@/types/api/apiResponse";
import { convertToLimitOffset } from '@/core/utils/pagination';
import type {
    PortfolioListParams,
    PortfolioFilters,
    CategoryListParams,
    TagListParams
} from "@/types/portfolio/portfolioListParams";

export const portfolioApi = {
  getPortfolioList: async (params?: PortfolioListParams): Promise<PaginatedResponse<Portfolio>> => {
    let url = '/admin/portfolio/';
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
    
    const response = await api.get<Portfolio[]>(url);
    
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

  getPortfolioById: async (id: number): Promise<Portfolio> => {
    const response = await api.get<Portfolio>('/admin/portfolio/' + id + '/');
    return response.data;
  },

  createPortfolio: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.post<Portfolio>('/admin/portfolio/', data);
    return response.data;
  },

  createPortfolioWithMedia: async (data: Partial<Portfolio>, mediaFiles: File[]): Promise<Portfolio> => {
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
    
    if ((data as any).media_ids && Array.isArray((data as any).media_ids) && (data as any).media_ids.length > 0) {
      formData.append('media_ids', (data as any).media_ids.join(','));
    }
    
    const response = await api.post<Portfolio>('/admin/portfolio/', formData);
    return response.data;
  },

  updatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.put<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  partialUpdatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.patch<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  addMediaToPortfolio: async (portfolioId: number, mediaFiles: File[], mediaIds?: number[]): Promise<any> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });
    
    if (mediaIds && mediaIds.length > 0) {

      formData.append('media_ids', mediaIds.join(','));
    }
    
    const response = await api.post('/admin/portfolio/' + portfolioId + '/add_media/', formData);
    return response.data;
  },


  exportPortfolioPdf: async (portfolioId: number): Promise<void> => {
    const { exportPortfolioPdf } = await import('./export');
    return exportPortfolioPdf(portfolioId);
  },

  exportPortfolios: async (filters?: PortfolioListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportPortfolios } = await import('./export');
    return exportPortfolios(filters, format);
  },

  deletePortfolio: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio/' + id + '/');
  },

  bulkDeletePortfolios: async (ids: number[]): Promise<any> => {
    const response = await api.post('/admin/portfolio/bulk-delete/', { ids });
    return response.data;
  },

  getCategories: async (params?: CategoryListParams): Promise<PaginatedResponse<PortfolioCategory>> => {
    let url = '/admin/portfolio-category/';
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
    
    const response = await api.get<PortfolioCategory[]>(url);
    
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

  createCategory: async (data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.post<PortfolioCategory>('/admin/portfolio-category/', data);
    return response.data;
  },

  getCategoryById: async (id: number): Promise<PortfolioCategory> => {
    const response = await api.get<PortfolioCategory>('/admin/portfolio-category/' + id + '/');
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.put<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  partialUpdateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await api.patch<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-category/' + id + '/');
  },

  bulkDeleteCategories: async (ids: number[]): Promise<any> => {
    const response = await api.post('/admin/portfolio-category/bulk-delete/', { ids });
    return response.data;
  },

  getTags: async (params?: TagListParams): Promise<PaginatedResponse<PortfolioTag>> => {
    let url = '/admin/portfolio-tag/';
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
    
    const response = await api.get<PortfolioTag[]>(url);
    
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

  createTag: async (data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.post<PortfolioTag>('/admin/portfolio-tag/', data);
    return response.data;
  },

  getTagById: async (id: number): Promise<PortfolioTag> => {
    const response = await api.get<PortfolioTag>('/admin/portfolio-tag/' + id + '/');
    return response.data;
  },

  updateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.put<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  partialUpdateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await api.patch<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-tag/' + id + '/');
  },

  bulkDeleteTags: async (ids: number[]): Promise<any> => {
    const response = await api.post('/admin/portfolio-tag/bulk-delete/', { ids });
    return response.data;
  },

  getOptions: async (params?: TagListParams): Promise<PaginatedResponse<PortfolioOption>> => {
    let url = '/admin/portfolio-option/';
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
    
    const response = await api.get<PortfolioOption[]>(url);
    
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

  createOption: async (data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.post<PortfolioOption>('/admin/portfolio-option/', data);
    return response.data;
  },

  getOptionById: async (id: number): Promise<PortfolioOption> => {
    const response = await api.get<PortfolioOption>('/admin/portfolio-option/' + id + '/');
    return response.data;
  },

  updateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.put<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  partialUpdateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await api.patch<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  deleteOption: async (id: number): Promise<void> => {
    await api.delete('/admin/portfolio-option/' + id + '/');
  },

  bulkDeleteOptions: async (ids: number[]): Promise<any> => {
    const response = await api.post('/admin/portfolio-option/bulk-delete/', { ids });
    return response.data;
  },
};