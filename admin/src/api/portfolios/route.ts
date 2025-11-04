import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/core/utils/pagination';
import { useQuery } from '@tanstack/react-query';

// Define types
export interface PortfolioListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  is_featured?: string | boolean;  // Accept both string and boolean
  is_public?: string | boolean;    // Accept both string and boolean
  is_active?: string | boolean;    // اضافه کردن فیلتر فعال بودن
  categories__in?: string; // اضافه کردن فیلتر دسته‌بندی
}

export interface PortfolioFilters {
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  is_active?: boolean; // اضافه کردن فیلتر فعال بودن
  categories?: number | string; // اضافه کردن فیلتر دسته‌بندی
}

// Backend response types
interface BackendPagination {
  count?: number;
  next?: string | null;
  previous?: string | null;
  page_size?: number;
  current_page?: number;
  total_pages?: number;
}

// This is the actual response structure from our backend
interface BackendResponse<T> {
  metaData: {
    status: string;
    message: string;
    AppStatusCode: number;
    timestamp: string;
  };
  pagination: BackendPagination;
  data: T[];
}

interface BackendPaginatedResponse<T> {
  data: T[];
  pagination: BackendPagination;
}

// Category and Tag types
export interface CategoryListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
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
    
    const response = await fetchApi.get<BackendResponse<Portfolio>>(url);
    
    // Check if response is valid
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
    
    // Handle the response structure from the backend
    // The backend uses a custom renderer that wraps the data in a specific format
    const responseData = response.data || [];
    const responsePagination = response.pagination || {};
    
    // Parse pagination from the response
    const backendPagination = responsePagination || {} as BackendPagination;
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(responseData) ? responseData.length : 0),
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10),
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : 1,
      total_pages: ('total_pages' in backendPagination && typeof backendPagination.total_pages === 'number') ? backendPagination.total_pages : 1
    };
    
    // Ensure current_page is valid
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: Array.isArray(responseData) ? responseData : [],
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
    
    // Append portfolio data as JSON string
    formData.append('data', JSON.stringify(data));
    
    // Append media files
    mediaFiles.forEach((file, index) => {
      formData.append('media_files', file);
    });
    
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

  // Export single portfolio to PDF
  exportPortfolioPdf: async (portfolioId: number): Promise<void> => {
    const url = `/admin/portfolio/${portfolioId}/export-pdf/`;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `portfolio_${portfolioId}_${timestamp}.pdf`;
    
    await fetchApi.downloadFile(url, filename);
  },

  // Export portfolios to Excel or PDF
  exportPortfolios: async (filters?: PortfolioListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    // Corrected URL - removed extra /api prefix
    let url = '/admin/portfolio/export/';
    if (filters || format) {
      const queryParams = new URLSearchParams();
      
      // Add format parameter
      queryParams.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'is_featured' || key === 'is_public' || key === 'is_active') {
              if (typeof value === 'boolean') {
                queryParams.append(key, value.toString());
              } else if (typeof value === 'string') {
                queryParams.append(key, value);
              }
            } else if (key === 'categories__in') {
              queryParams.append(key, value as string);
            } else if (key !== 'page' && key !== 'size') {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = format === 'pdf' 
      ? `portfolios_${timestamp}.pdf`
      : `portfolios_${timestamp}.xlsx`;
    
    await fetchApi.downloadFile(url, filename);
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
    
    const response = await fetchApi.get<BackendResponse<PortfolioCategory>>(url);
    
    // Parse pagination from the response
    const backendPagination = response.pagination || {} as BackendPagination;
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0),
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10),
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : 1,
      total_pages: ('total_pages' in backendPagination && typeof backendPagination.total_pages === 'number') ? backendPagination.total_pages : 1
    };
    
    // Ensure current_page is valid
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: Array.isArray(response.data) ? response.data : [],
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
    
    const response = await fetchApi.get<BackendResponse<PortfolioTag>>(url);
    
    // Parse pagination from the response
    const backendPagination = response.pagination || {} as BackendPagination;
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0),
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10),
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : 1,
      total_pages: ('total_pages' in backendPagination && typeof backendPagination.total_pages === 'number') ? backendPagination.total_pages : 1
    };
    
    // Ensure current_page is valid
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: Array.isArray(response.data) ? response.data : [],
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
    
    const response = await fetchApi.get<BackendResponse<PortfolioOption>>(url);
    
    // Parse pagination from the response
    const backendPagination = response.pagination || {} as BackendPagination;
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0),
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10),
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : 1,
      total_pages: ('total_pages' in backendPagination && typeof backendPagination.total_pages === 'number') ? backendPagination.total_pages : 1
    };
    
    // Ensure current_page is valid
    if (pagination.current_page < 1) {
      pagination.current_page = 1;
    }
    if (pagination.current_page > pagination.total_pages) {
      pagination.current_page = pagination.total_pages;
    }
    
    return {
      data: Array.isArray(response.data) ? response.data : [],
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