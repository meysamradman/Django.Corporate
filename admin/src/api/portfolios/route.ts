import { fetchApi } from "@/core/config/fetch";
import { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/core/utils/pagination';

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
  // is_active?: boolean; // Removed because backend doesn't support filtering by is_active
}

export interface PortfolioFilters {
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  // is_active?: boolean; // Removed because backend doesn't support filtering by is_active
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
    console.log('🔍 Portfolio API params:', params); // Debug log
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
          if (key === 'is_featured' || key === 'is_public') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
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
    
    console.log('🔍 Fetching portfolio list from URL:', url); // Debug log
    const response = await fetchApi.get<BackendResponse<Portfolio>>(url);
    console.log('🔍 Raw API response:', response); // Debug log
    
    // Check if response is valid
    if (!response) {
      console.error('Invalid API response:', response);
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
    
    console.log('🔍 Response data structure:', {
      hasData: !!response.data,
      hasPagination: !!response.pagination,
      dataLength: Array.isArray(response.data) ? response.data.length : 0,
      paginationKeys: response.pagination ? Object.keys(response.pagination) : []
    });
    
    // Parse pagination from the response
    const backendPagination = response.pagination || {} as BackendPagination;
    
    console.log('🔍 Backend pagination object:', backendPagination);
    console.log('🔍 Request params:', params); // Debug log
    
    // Calculate total pages based on count and page_size
    const count = ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0);
    const pageSize = ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10);
    const totalPages = Math.ceil(count / pageSize);
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: count,
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: pageSize,
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : (params?.page || 1),
      total_pages: totalPages  // Calculate total pages properly
    };
    
    console.log('🔍 Processed pagination:', pagination); // Debug log
    console.log('🔍 Response data length:', Array.isArray(response.data) ? response.data.length : 0); // Debug log
    
    // Additional debugging for pagination calculation
    console.log('🔍 Pagination calculation details:', {
      backendCount: backendPagination.count,
      dataSize: Array.isArray(response.data) ? response.data.length : 0,
      backendPageSize: backendPagination.page_size,
      paramsSize: params?.size,
      defaultSize: 10,
      calculatedPageSize: pagination.page_size,
      calculatedTotalPages: pagination.total_pages,
      requestPage: params?.page,
      calculatedCurrentPage: pagination.current_page
    });
    
    return {
      data: Array.isArray(response.data) ? response.data : [],
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
  addMediaToPortfolio: async (portfolioId: number, mediaFiles: File[]): Promise<any> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });
    
    const response = await fetchApi.post('/admin/portfolio/' + portfolioId + '/add-media/', formData);
    return response.data;
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
    
    // Calculate total pages based on count and page_size
    const count = ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0);
    const pageSize = ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10);
    const totalPages = Math.ceil(count / pageSize);
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: count,
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: pageSize,
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : (params?.page || 1),
      total_pages: totalPages  // Calculate total pages properly
    };
    
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
    
    // Calculate total pages based on count and page_size
    const count = ('count' in backendPagination && typeof backendPagination.count === 'number') ? backendPagination.count : (Array.isArray(response.data) ? response.data.length : 0);
    const pageSize = ('page_size' in backendPagination && typeof backendPagination.page_size === 'number') ? backendPagination.page_size : (params?.size || 10);
    const totalPages = Math.ceil(count / pageSize);
    
    // Use backend pagination directly - it now includes all the fields we need
    const pagination: ApiPagination = {
      count: count,
      next: ('next' in backendPagination && typeof backendPagination.next === 'string') ? backendPagination.next : null,
      previous: ('previous' in backendPagination && typeof backendPagination.previous === 'string') ? backendPagination.previous : null,
      page_size: pageSize,
      current_page: ('current_page' in backendPagination && typeof backendPagination.current_page === 'number') ? backendPagination.current_page : (params?.page || 1),
      total_pages: totalPages  // Calculate total pages properly
    };
    
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
};