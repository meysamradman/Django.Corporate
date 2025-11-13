import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { ApiResponse } from "@/types/api/apiResponse";
import { convertToLimitOffset } from '@/core/utils/pagination';
import {
    PortfolioListParams,
    PortfolioFilters,
    CategoryListParams,
    TagListParams
} from "@/types/portfolio/portfolioListParams";

// Portfolio API functions
export const portfolioApi = {
  // Get portfolio list
  getPortfolioList: async (params?: PortfolioListParams): Promise<PaginatedResponse<Portfolio>> => {
    // Build query string from params
    let url = '/admin/portfolio/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      // Convert page/size to limit/offset for Django API
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        // Remove page/size from params to avoid conflicts
        delete apiParams.page;
        delete apiParams.size;
      }
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert boolean values to string for API
          if (key === 'is_featured' || key === 'is_public' || key === 'is_active') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          } else if (key === 'categories__in') {
            // برای فیلتر دسته‌بندی
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
    
    const response = await fetchApi.get<Portfolio[]>(url);
    
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

  // Get portfolio by ID
  getPortfolioById: async (id: number): Promise<Portfolio> => {
    const response = await fetchApi.get<Portfolio>('/admin/portfolio/' + id + '/');
    return response.data;
  },

  // Create portfolio
  createPortfolio: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.post<Portfolio>('/admin/portfolio/', data);
    return response.data;
  },

  // Create portfolio with media
  createPortfolioWithMedia: async (data: Partial<Portfolio>, mediaFiles: File[]): Promise<Portfolio> => {
    const formData = new FormData();
    
    // Append all portfolio fields individually
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'media_ids') {
        if (Array.isArray(value)) {
          // For arrays like categories_ids, tags_ids, etc.
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Append media files
    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });
    
    // Append media_ids as comma-separated string (backend expects this format for form-data)
    if (data.media_ids && Array.isArray(data.media_ids) && data.media_ids.length > 0) {
      formData.append('media_ids', data.media_ids.join(','));
    }
    
    const response = await fetchApi.post<Portfolio>('/admin/portfolio/', formData);
    return response.data;
  },

  // Update portfolio
  updatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.put<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  // Partial update portfolio
  partialUpdatePortfolio: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await fetchApi.patch<Portfolio>('/admin/portfolio/' + id + '/', data);
    return response.data;
  },

  // Add media to portfolio
  addMediaToPortfolio: async (portfolioId: number, mediaFiles: File[], mediaIds?: number[]): Promise<any> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });
    
    // Send media_ids as a comma-separated string instead of JSON array
    // This is required by the Django backend to properly parse the form-data
    if (mediaIds && mediaIds.length > 0) {
      // Convert array to comma-separated string
      formData.append('media_ids', mediaIds.join(','));
    }
    
    const response = await fetchApi.post('/admin/portfolio/' + portfolioId + '/add_media/', formData);
    return response.data;
  },

  // Export functions moved to separate file for better organization
  // Import from '@/api/portfolios/export' if needed
  exportPortfolioPdf: async (portfolioId: number): Promise<void> => {
    const { exportPortfolioPdf } = await import('./export');
    return exportPortfolioPdf(portfolioId);
  },

  exportPortfolios: async (filters?: PortfolioListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportPortfolios } = await import('./export');
    return exportPortfolios(filters, format);
  },

  // Delete portfolio
  deletePortfolio: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/portfolio/' + id + '/');
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
      
      // Convert page/size to limit/offset for Django API
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        // Remove page/size from params to avoid conflicts
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
    
    const response = await fetchApi.get<PortfolioCategory[]>(url);
    
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

  // Create category
  createCategory: async (data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.post<PortfolioCategory>('/admin/portfolio-category/', data);
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: number): Promise<PortfolioCategory> => {
    const response = await fetchApi.get<PortfolioCategory>('/admin/portfolio-category/' + id + '/');
    return response.data;
  },

  // Update category
  updateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.put<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  // Partial update category
  partialUpdateCategory: async (id: number, data: Partial<PortfolioCategory>): Promise<PortfolioCategory> => {
    const response = await fetchApi.patch<PortfolioCategory>('/admin/portfolio-category/' + id + '/', data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/portfolio-category/' + id + '/');
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
      
      // Convert page/size to limit/offset for Django API
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        // Remove page/size from params to avoid conflicts
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
    
    const response = await fetchApi.get<PortfolioTag[]>(url);
    
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

  // Create tag
  createTag: async (data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.post<PortfolioTag>('/admin/portfolio-tag/', data);
    return response.data;
  },

  // Get tag by ID
  getTagById: async (id: number): Promise<PortfolioTag> => {
    const response = await fetchApi.get<PortfolioTag>('/admin/portfolio-tag/' + id + '/');
    return response.data;
  },

  // Update tag
  updateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.put<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  // Partial update tag
  partialUpdateTag: async (id: number, data: Partial<PortfolioTag>): Promise<PortfolioTag> => {
    const response = await fetchApi.patch<PortfolioTag>('/admin/portfolio-tag/' + id + '/', data);
    return response.data;
  },

  // Delete tag
  deleteTag: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/portfolio-tag/' + id + '/');
  },

  // Bulk delete tags
  bulkDeleteTags: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/portfolio-tag/bulk-delete/', { ids });
    return response.data;
  },

  // Option functions
  getOptions: async (params?: TagListParams): Promise<PaginatedResponse<PortfolioOption>> => {
    let url = '/admin/portfolio-option/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      // Convert page/size to limit/offset for Django API
      let apiParams: any = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;
        // Remove page/size from params to avoid conflicts
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
    
    const response = await fetchApi.get<PortfolioOption[]>(url);
    
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

  // Create option
  createOption: async (data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await fetchApi.post<PortfolioOption>('/admin/portfolio-option/', data);
    return response.data;
  },

  // Get option by ID
  getOptionById: async (id: number): Promise<PortfolioOption> => {
    const response = await fetchApi.get<PortfolioOption>('/admin/portfolio-option/' + id + '/');
    return response.data;
  },

  // Update option
  updateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await fetchApi.put<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  // Partial update option
  partialUpdateOption: async (id: number, data: Partial<PortfolioOption>): Promise<PortfolioOption> => {
    const response = await fetchApi.patch<PortfolioOption>('/admin/portfolio-option/' + id + '/', data);
    return response.data;
  },

  // Delete option
  deleteOption: async (id: number): Promise<void> => {
    await fetchApi.delete('/admin/portfolio-option/' + id + '/');
  },

  // Bulk delete options
  bulkDeleteOptions: async (ids: number[]): Promise<any> => {
    const response = await fetchApi.post('/admin/portfolio-option/bulk-delete/', { ids });
    return response.data;
  },
};