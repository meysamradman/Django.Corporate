import { api } from '@/core/config/api';
import type { Property, PropertyUpdateData } from "@/types/real_estate/property";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/propertyState";
import type { PropertyLabel } from "@/types/real_estate/label/propertyLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/propertyFeature";
import type { PropertyTag } from "@/types/real_estate/tags/propertyTag";
import type { PropertyAgent } from "@/types/real_estate/agent/propertyAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/core/utils/pagination';
import type { PropertyListParams } from "@/types/real_estate/propertyListParams";

export const realEstateApi = {
  getPropertyList: async (params?: PropertyListParams): Promise<PaginatedResponse<Property>> => {
    let url = '/admin/property/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
      if (params.page && params.size) {
        const { limit, offset } = convertToLimitOffset(params.page, params.size);
        apiParams.limit = limit;
        apiParams.offset = offset;

        delete apiParams.page;
        delete apiParams.size;
      }
      
      Object.entries(apiParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'is_published' || key === 'is_featured' || key === 'is_public' || key === 'is_verified' || key === 'is_active') {
            if (typeof value === 'boolean') {
              queryParams.append(key, value.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          } else if (key === 'labels__in' || key === 'tags__in' || key === 'features__in') {
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
    
    const response = await api.get<Property[]>(url);
    
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

  getPropertyById: async (id: number): Promise<Property> => {
    const response = await api.get<Property>('/admin/property/' + id + '/');
    return response.data;
  },

  createProperty: async (data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/', data);
    return response.data;
  },

  createPropertyWithMedia: async (data: Partial<PropertyUpdateData> & { media_ids?: number[] }, mediaFiles: File[]): Promise<Property> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'media_ids' && key !== 'media_files') {
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
    
    if (data.media_ids && Array.isArray(data.media_ids) && data.media_ids.length > 0) {
      formData.append('media_ids', data.media_ids.join(','));
    }
    
    const response = await api.post<Property>('/admin/property/', formData);
    return response.data;
  },

  updateProperty: async (id: number, data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.put<Property>('/admin/property/' + id + '/', data);
    return response.data;
  },

  partialUpdateProperty: async (id: number, data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.patch<Property>('/admin/property/' + id + '/', data);
    return response.data;
  },

  addMediaToProperty: async (propertyId: number, mediaFiles: File[], mediaIds?: number[]): Promise<Property> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });
    
    if (mediaIds && mediaIds.length > 0) {
      formData.append('media_ids', mediaIds.join(','));
    }
    
    const response = await api.post<Property>('/admin/property/' + propertyId + '/add-media/', formData);
    return response.data;
  },

  deleteProperty: async (id: number): Promise<void> => {
    await api.delete('/admin/property/' + id + '/');
  },

  bulkDeleteProperties: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/property/bulk-delete/', { ids });
    return response.data;
  },

  bulkUpdateStatus: async (ids: number[], status: { is_published?: boolean; is_featured?: boolean; is_public?: boolean; is_verified?: boolean; is_active?: boolean }): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/admin/property/bulk-update-status/', { ids, ...status });
    return response.data;
  },

  publishProperty: async (id: number): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/' + id + '/publish/');
    return response.data;
  },

  unpublishProperty: async (id: number): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/' + id + '/unpublish/');
    return response.data;
  },

  toggleFeatured: async (id: number): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/' + id + '/toggle-featured/');
    return response.data;
  },

  toggleVerified: async (id: number): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/' + id + '/toggle-verified/');
    return response.data;
  },

  setMainImage: async (id: number, mediaId: number): Promise<void> => {
    await api.post('/admin/property/' + id + '/set-main-image/', { media_id: mediaId });
  },

  getStatistics: async (): Promise<any> => {
    const response = await api.get<any>('/admin/property/statistics/');
    return response.data;
  },

  getMonthlyStats: async (): Promise<{ monthly_stats: Array<{ month: string; published: number; draft: number; featured: number; verified: number }> }> => {
    const response = await api.get<{ monthly_stats: Array<{ month: string; published: number; draft: number; featured: number; verified: number }> }>('/admin/property/monthly-stats/');
    return response.data;
  },

  getSeoReport: async (): Promise<any> => {
    const response = await api.get<any>('/admin/property/seo-report/');
    return response.data;
  },

  bulkGenerateSeo: async (ids: number[]): Promise<{ generated_count: number; total_count: number }> => {
    const response = await api.post<{ generated_count: number; total_count: number }>('/admin/property/bulk-generate-seo/', { ids });
    return response.data;
  },

  generateSeo: async (id: number): Promise<Property> => {
    const response = await api.post<Property>('/admin/property/' + id + '/generate-seo/');
    return response.data;
  },

  validateSeo: async (id: number): Promise<any> => {
    const response = await api.get<any>('/admin/property/' + id + '/validate-seo/');
    return response.data;
  },

  getTypes: async (params?: { page?: number; size?: number; is_active?: boolean }): Promise<PaginatedResponse<PropertyType>> => {
    let url = '/admin/property-type/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyType[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createType: async (data: Partial<PropertyType>): Promise<PropertyType> => {
    const response = await api.post<PropertyType>('/admin/property-type/', data);
    return response.data;
  },

  getTypeById: async (id: number): Promise<PropertyType> => {
    const response = await api.get<PropertyType>('/admin/property-type/' + id + '/');
    return response.data;
  },

  updateType: async (id: number, data: Partial<PropertyType>): Promise<PropertyType> => {
    const response = await api.put<PropertyType>('/admin/property-type/' + id + '/', data);
    return response.data;
  },

  partialUpdateType: async (id: number, data: Partial<PropertyType>): Promise<PropertyType> => {
    const response = await api.patch<PropertyType>('/admin/property-type/' + id + '/', data);
    return response.data;
  },

  deleteType: async (id: number): Promise<void> => {
    await api.delete('/admin/property-type/' + id + '/');
  },

  getStates: async (params?: { page?: number; size?: number; is_active?: boolean }): Promise<PaginatedResponse<PropertyState>> => {
    let url = '/admin/property-state/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyState[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createState: async (data: Partial<PropertyState>): Promise<PropertyState> => {
    const response = await api.post<PropertyState>('/admin/property-state/', data);
    return response.data;
  },

  getStateById: async (id: number): Promise<PropertyState> => {
    const response = await api.get<PropertyState>('/admin/property-state/' + id + '/');
    return response.data;
  },

  updateState: async (id: number, data: Partial<PropertyState>): Promise<PropertyState> => {
    const response = await api.put<PropertyState>('/admin/property-state/' + id + '/', data);
    return response.data;
  },

  partialUpdateState: async (id: number, data: Partial<PropertyState>): Promise<PropertyState> => {
    const response = await api.patch<PropertyState>('/admin/property-state/' + id + '/', data);
    return response.data;
  },

  deleteState: async (id: number): Promise<void> => {
    await api.delete('/admin/property-state/' + id + '/');
  },

  getLabels: async (params?: { page?: number; size?: number; is_active?: boolean }): Promise<PaginatedResponse<PropertyLabel>> => {
    let url = '/admin/property-label/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyLabel[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createLabel: async (data: Partial<PropertyLabel>): Promise<PropertyLabel> => {
    const response = await api.post<PropertyLabel>('/admin/property-label/', data);
    return response.data;
  },

  getLabelById: async (id: number): Promise<PropertyLabel> => {
    const response = await api.get<PropertyLabel>('/admin/property-label/' + id + '/');
    return response.data;
  },

  updateLabel: async (id: number, data: Partial<PropertyLabel>): Promise<PropertyLabel> => {
    const response = await api.put<PropertyLabel>('/admin/property-label/' + id + '/', data);
    return response.data;
  },

  partialUpdateLabel: async (id: number, data: Partial<PropertyLabel>): Promise<PropertyLabel> => {
    const response = await api.patch<PropertyLabel>('/admin/property-label/' + id + '/', data);
    return response.data;
  },

  deleteLabel: async (id: number): Promise<void> => {
    await api.delete('/admin/property-label/' + id + '/');
  },

  getFeatures: async (params?: { page?: number; size?: number; is_active?: boolean; category?: string }): Promise<PaginatedResponse<PropertyFeature>> => {
    let url = '/admin/property-feature/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyFeature[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createFeature: async (data: Partial<PropertyFeature>): Promise<PropertyFeature> => {
    const response = await api.post<PropertyFeature>('/admin/property-feature/', data);
    return response.data;
  },

  getFeatureById: async (id: number): Promise<PropertyFeature> => {
    const response = await api.get<PropertyFeature>('/admin/property-feature/' + id + '/');
    return response.data;
  },

  updateFeature: async (id: number, data: Partial<PropertyFeature>): Promise<PropertyFeature> => {
    const response = await api.put<PropertyFeature>('/admin/property-feature/' + id + '/', data);
    return response.data;
  },

  partialUpdateFeature: async (id: number, data: Partial<PropertyFeature>): Promise<PropertyFeature> => {
    const response = await api.patch<PropertyFeature>('/admin/property-feature/' + id + '/', data);
    return response.data;
  },

  deleteFeature: async (id: number): Promise<void> => {
    await api.delete('/admin/property-feature/' + id + '/');
  },

  getTags: async (params?: { page?: number; size?: number; is_active?: boolean; is_public?: boolean; search?: string }): Promise<PaginatedResponse<PropertyTag>> => {
    let url = '/admin/property-tag/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyTag[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createTag: async (data: Partial<PropertyTag>): Promise<PropertyTag> => {
    const response = await api.post<PropertyTag>('/admin/property-tag/', data);
    return response.data;
  },

  getTagById: async (id: number): Promise<PropertyTag> => {
    const response = await api.get<PropertyTag>('/admin/property-tag/' + id + '/');
    return response.data;
  },

  updateTag: async (id: number, data: Partial<PropertyTag>): Promise<PropertyTag> => {
    const response = await api.put<PropertyTag>('/admin/property-tag/' + id + '/', data);
    return response.data;
  },

  partialUpdateTag: async (id: number, data: Partial<PropertyTag>): Promise<PropertyTag> => {
    const response = await api.patch<PropertyTag>('/admin/property-tag/' + id + '/', data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/property-tag/' + id + '/');
  },

  getAgents: async (params?: { page?: number; size?: number; is_active?: boolean; is_verified?: boolean; agency?: number; city?: number }): Promise<PaginatedResponse<PropertyAgent>> => {
    let url = '/admin/property-agent/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<PropertyAgent[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createAgent: async (data: Partial<PropertyAgent>): Promise<PropertyAgent> => {
    const response = await api.post<PropertyAgent>('/admin/property-agent/', data);
    return response.data;
  },

  getAgentById: async (id: number): Promise<PropertyAgent> => {
    const response = await api.get<PropertyAgent>('/admin/property-agent/' + id + '/');
    return response.data;
  },

  updateAgent: async (id: number, data: Partial<PropertyAgent>): Promise<PropertyAgent> => {
    const response = await api.put<PropertyAgent>('/admin/property-agent/' + id + '/', data);
    return response.data;
  },

  partialUpdateAgent: async (id: number, data: Partial<PropertyAgent>): Promise<PropertyAgent> => {
    const response = await api.patch<PropertyAgent>('/admin/property-agent/' + id + '/', data);
    return response.data;
  },

  deleteAgent: async (id: number): Promise<void> => {
    await api.delete('/admin/property-agent/' + id + '/');
  },

  getAgencies: async (params?: { page?: number; size?: number; is_active?: boolean; is_verified?: boolean; city?: number }): Promise<PaginatedResponse<RealEstateAgency>> => {
    let url = '/admin/real-estate-agency/';
    if (params) {
      const queryParams = new URLSearchParams();
      
      const apiParams: Record<string, unknown> = { ...params };
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
    
    const response = await api.get<RealEstateAgency[]>(url);
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
    
    return {
      data: responseData,
      pagination: pagination
    };
  },

  createAgency: async (data: Partial<RealEstateAgency>): Promise<RealEstateAgency> => {
    const response = await api.post<RealEstateAgency>('/admin/real-estate-agency/', data);
    return response.data;
  },

  getAgencyById: async (id: number): Promise<RealEstateAgency> => {
    const response = await api.get<RealEstateAgency>('/admin/real-estate-agency/' + id + '/');
    return response.data;
  },

  updateAgency: async (id: number, data: Partial<RealEstateAgency>): Promise<RealEstateAgency> => {
    const response = await api.put<RealEstateAgency>('/admin/real-estate-agency/' + id + '/', data);
    return response.data;
  },

  partialUpdateAgency: async (id: number, data: Partial<RealEstateAgency>): Promise<RealEstateAgency> => {
    const response = await api.patch<RealEstateAgency>('/admin/real-estate-agency/' + id + '/', data);
    return response.data;
  },

  deleteAgency: async (id: number): Promise<void> => {
    await api.delete('/admin/real-estate-agency/' + id + '/');
  },

  exportPropertyPdf: async (propertyId: number): Promise<void> => {
    const { exportPropertyPdf } = await import('./export');
    return exportPropertyPdf(propertyId);
  },

  exportProperties: async (filters?: PropertyListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportProperties } = await import('./export');
    return exportProperties(filters, format);
  },

  // Real Estate Location APIs
  getProvinces: async (): Promise<RealEstateProvince[]> => {
    const response = await api.get<RealEstateProvince[]>('/admin/real-estate-provinces/');
    return response.data || [];
  },

  getProvinceCities: async (provinceId: number): Promise<RealEstateCity[]> => {
    const response = await api.get<RealEstateCity[]>(`/admin/real-estate-provinces/${provinceId}/cities/`);
    return response.data || [];
  },

  // Simplified location APIs
  getCityRegions: async (cityId?: number): Promise<RealEstateCityRegion[]> => {
    let url = '/admin/real-estate-city-regions/';
    if (cityId) {
      url += `?city_id=${cityId}`;
    }
    const response = await api.get<RealEstateCityRegion[]>(url);
    return response.data || [];
  },

  getCityRegionsByCity: async (cityId: number): Promise<RealEstateCityRegion[]> => {
    const response = await api.get<RealEstateCityRegion[]>(`/admin/real-estate-cities/${cityId}/regions/`);
    return response.data || [];
  },
};

