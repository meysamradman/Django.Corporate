import { api } from '@/core/config/api';
import type { Property, PropertyUpdateData } from "@/types/real_estate/realEstate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";
import type { PaginatedResponse, ApiPagination } from "@/types/shared/pagination";
import { convertToLimitOffset } from '@/components/shared/paginations/pagination';
import type { PropertyListParams } from "@/types/real_estate/realEstateListParams";

type ListParams = Record<string, unknown> & { page?: number; size?: number };

const PROPERTY_BOOLEAN_FILTERS = new Set(['is_published', 'is_featured', 'is_public', 'is_active']);
const PROPERTY_RAW_STRING_FILTERS = new Set(['labels__in', 'tags__in', 'features__in']);

const normalizeListParams = (params?: ListParams): Record<string, unknown> => {
  if (!params) return {};

  const normalized: Record<string, unknown> = { ...params };
  if (params.page && params.size) {
    const { limit, offset } = convertToLimitOffset(params.page, params.size);
    normalized.limit = limit;
    normalized.offset = offset;
    delete normalized.page;
    delete normalized.size;
  }

  return normalized;
};

const buildQueryString = (
  params?: Record<string, unknown>,
  options?: {
    booleanKeys?: Set<string>;
    rawStringKeys?: Set<string>;
  }
): string => {
  if (!params) return '';

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (options?.booleanKeys?.has(key)) {
      if (typeof value === 'boolean') {
        queryParams.append(key, value.toString());
      } else if (typeof value === 'string') {
        queryParams.append(key, value);
      }
      return;
    }

    if (options?.rawStringKeys?.has(key)) {
      queryParams.append(key, String(value));
      return;
    }

    queryParams.append(key, String(value));
  });

  return queryParams.toString();
};

const buildListUrl = (
  baseUrl: string,
  params?: ListParams,
  options?: {
    booleanKeys?: Set<string>;
    rawStringKeys?: Set<string>;
  }
): string => {
  const normalized = normalizeListParams(params);
  const queryString = buildQueryString(normalized, options);
  if (!queryString) return baseUrl;
  return `${baseUrl}?${queryString}`;
};

const toPaginatedResponse = <T>(response: any, params?: ListParams): PaginatedResponse<T> => {
  const responseData = Array.isArray(response?.data) ? response.data : [];
  const responsePagination = response?.pagination;

  const pageSize = responsePagination?.page_size || (params?.size || 10);
  const totalCount = responsePagination?.count || responseData.length;
  const totalPages = responsePagination?.total_pages || Math.ceil(totalCount / pageSize);
  let currentPage = responsePagination?.current_page || (params?.page || 1);

  if (currentPage < 1) currentPage = 1;
  if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;

  const pagination: ApiPagination = {
    count: totalCount,
    next: responsePagination?.next || null,
    previous: responsePagination?.previous || null,
    page_size: pageSize,
    current_page: currentPage,
    total_pages: totalPages,
  };

  return {
    data: responseData,
    pagination,
  };
};

const extractData = <T>(response: any): T => {
  return response?.data?.data || response?.data;
};

export interface FinalizeDealPayload {
  deal_type?: string;
  final_amount?: number | null;
  sale_price?: number | null;
  pre_sale_price?: number | null;
  monthly_rent?: number | null;
  rent_amount?: number | null;
  security_deposit?: number | null;
  mortgage_amount?: number | null;
  contract_date?: string | null;
  responsible_agent?: number | null;
  commission?: number | null;
}

const fetchPaginated = async <T>(baseUrl: string, params?: ListParams): Promise<PaginatedResponse<T>> => {
  const url = buildListUrl(baseUrl, params);
  const response = await api.get<T[]>(url);
  return toPaginatedResponse<T>(response, params);
};

export const realEstateApi = {
  getPropertyList: async (params?: PropertyListParams): Promise<PaginatedResponse<Property>> => {
    const url = buildListUrl('/admin/property/', params as unknown as ListParams, {
      booleanKeys: PROPERTY_BOOLEAN_FILTERS,
      rawStringKeys: PROPERTY_RAW_STRING_FILTERS,
    });
    const response = await api.get<Property[]>(url);
    return toPaginatedResponse<Property>(response, params as unknown as ListParams);
  },

  getPropertyById: async (id: number): Promise<Property> => {
    const response = await api.get<any>('/admin/property/' + id + '/');
    return extractData<Property>(response);
  },

  getPropertiesByIds: async (ids: number[]): Promise<Property[]> => {
    if (ids.length === 0) {
      return [];
    }
    const url = `/admin/property/?ids=${ids.join(',')}`;
    const response = await api.get<Property[]>(url);
    return Array.isArray(response.data) ? response.data : [];
  },

  createProperty: async (data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.post<any>('/admin/property/', data);
    return extractData<Property>(response);
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

    const response = await api.post<any>('/admin/property/', formData);
    return extractData<Property>(response);
  },

  updateProperty: async (id: number, data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.put<any>('/admin/property/' + id + '/', data);
    return extractData<Property>(response);
  },

  updatePropertyWithMedia: async (id: number, data: Partial<PropertyUpdateData> & { media_ids?: number[] }, mediaFiles: File[]): Promise<Property> => {
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

    const response = await api.put<any>('/admin/property/' + id + '/', formData);
    return extractData<Property>(response);
  },

  partialUpdateProperty: async (id: number, data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.patch<any>('/admin/property/' + id + '/', data);
    return extractData<Property>(response);
  },

  addMediaToProperty: async (propertyId: number, mediaFiles: File[], mediaIds?: number[]): Promise<Property> => {
    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('media_files', file);
    });

    if (mediaIds && mediaIds.length > 0) {
      formData.append('media_ids', mediaIds.join(','));
    }

    const response = await api.post<any>('/admin/property/' + propertyId + '/add_media/', formData);
    return extractData<Property>(response);
  },

  deleteProperty: async (id: number): Promise<void> => {
    await api.delete('/admin/property/' + id + '/');
  },

  bulkDeleteProperties: async (ids: number[]): Promise<{ success: boolean }> => {
    const response = await api.post<any>('/admin/property/bulk-delete/', { ids });
    return extractData<{ success: boolean }>(response);
  },

  bulkUpdateStatus: async (ids: number[], status: { is_published?: boolean; is_featured?: boolean; is_public?: boolean; is_active?: boolean }): Promise<{ success: boolean }> => {
    const response = await api.post<any>('/admin/property/bulk-update-status/', { ids, ...status });
    return extractData<{ success: boolean }>(response);
  },

  publishProperty: async (id: number): Promise<Property> => {
    const response = await api.post<any>('/admin/property/' + id + '/publish/');
    return extractData<Property>(response);
  },

  unpublishProperty: async (id: number): Promise<Property> => {
    const response = await api.post<any>('/admin/property/' + id + '/unpublish/');
    return extractData<Property>(response);
  },

  toggleFeatured: async (id: number): Promise<Property> => {
    const response = await api.post<any>('/admin/property/' + id + '/toggle-featured/');
    return extractData<Property>(response);
  },

  finalizeDeal: async (id: number, payload: FinalizeDealPayload): Promise<Property> => {
    const response = await api.post<any>(`/admin/property/${id}/finalize-deal/`, payload);
    return extractData<Property>(response);
  },

  setMainImage: async (id: number, mediaId: number): Promise<void> => {
    await api.post('/admin/property/' + id + '/set-main-image/', { media_id: mediaId });
  },

  getStatistics: async (): Promise<any> => {
    const response = await api.get<any>('/admin/property/statistics/');
    return extractData<any>(response);
  },

  getMonthlyStats: async (): Promise<{ monthly_stats: Array<{ month: string; published: number; draft: number; featured: number; verified: number }> }> => {
    const response = await api.get<any>('/admin/property/monthly-stats/');
    return extractData<{ monthly_stats: Array<{ month: string; published: number; draft: number; featured: number; verified: number }> }>(response);
  },

  getSeoReport: async (): Promise<any> => {
    const response = await api.get<any>('/admin/property/seo-report/');
    return extractData<any>(response);
  },

  bulkGenerateSeo: async (ids: number[]): Promise<{ generated_count: number; total_count: number }> => {
    const response = await api.post<{ generated_count: number; total_count: number }>('/admin/property/bulk-generate-seo/', { ids });
    return response.data;
  },

  generateSeo: async (id: number): Promise<Property> => {
    const response = await api.post<any>('/admin/property/' + id + '/generate-seo/');
    return extractData<Property>(response);
  },

  validateSeo: async (id: number): Promise<any> => {
    const response = await api.post<any>('/admin/property/' + id + '/validate-seo/');
    return extractData<any>(response);
  },

  getFieldOptions: async (): Promise<{
    bedrooms: [number, string][];
    bathrooms: [number, string][];
    parking_spaces: [number, string][];
    storage_rooms: [number, string][];
    floor_number: [number, string][];
    kitchens: [number, string][];
    living_rooms: [number, string][];
    document_type: [string, string][];
    year_built: {
      min: number;
      max: number;
      help_text: string;
      placeholder?: string;
    };
    extra_attributes_options?: {
      space_type?: [string, string][];
      construction_status?: [string, string][];
      property_condition?: [string, string][];
      property_direction?: [string, string][];
      city_position?: [string, string][];
      unit_type?: [string, string][];
    };
    status?: [string, string][];
    listing_type?: [string, string][];
  }> => {
    const response = await api.get<{
      bedrooms: [number, string][];
      bathrooms: [number, string][];
      parking_spaces: [number, string][];
      storage_rooms: [number, string][];
      floor_number: [number, string][];
      kitchens: [number, string][];
      living_rooms: [number, string][];
      document_type: [string, string][];
      year_built: {
        min: number;
        max: number;
        help_text: string;
        placeholder?: string;
      };
      extra_attributes_options?: {
        space_type?: [string, string][];
        construction_status?: [string, string][];
        property_condition?: [string, string][];
        property_direction?: [string, string][];
        city_position?: [string, string][];
        unit_type?: [string, string][];
      };
      status?: [string, string][];
      listing_type?: [string, string][];
    }>('/admin/property/field-options/');
    return response.data;
  },

  getTypes: async (params?: { page?: number; size?: number; is_active?: boolean }): Promise<PaginatedResponse<PropertyType>> => {
    return fetchPaginated<PropertyType>('/admin/property-type/', params);
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
    return fetchPaginated<PropertyState>('/admin/property-state/', params);
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

  getStateFieldOptions: async (): Promise<{
    usage_type: [string, string][];
  }> => {
    const response = await api.get<{
      usage_type: [string, string][];
    }>('/admin/property-state/field-options/');
    return response.data;
  },

  getLabels: async (params?: { page?: number; size?: number; is_active?: boolean }): Promise<PaginatedResponse<PropertyLabel>> => {
    return fetchPaginated<PropertyLabel>('/admin/property-label/', params);
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

  getFeatures: async (params?: { page?: number; size?: number; is_active?: boolean; group?: string }): Promise<PaginatedResponse<PropertyFeature>> => {
    return fetchPaginated<PropertyFeature>('/admin/property-feature/', params);
  },

  createFeature: async (data: Partial<PropertyFeature>): Promise<PropertyFeature> => {
    const response = await api.post<PropertyFeature>('/admin/property-feature/', data);
    return response.data;
  },

  getFeatureById: async (id: number): Promise<PropertyFeature> => {
    const response = await api.get<PropertyFeature>('/admin/property-feature/' + id + '/');
    return response.data;
  },

  getFloorPlans: async (propertyId?: number): Promise<any[]> => {
    let url = '/admin/floor-plan/';
    if (propertyId) {
      url += '?property_id=' + propertyId;
    }
    const response = await api.get<any>(url);
    const data = extractData<any>(response);
    return Array.isArray(data) ? data : [];
  },

  getFloorPlanById: async (id: number): Promise<any> => {
    const response = await api.get<any>('/admin/floor-plan/' + id + '/');
    return extractData<any>(response);
  },

  createFloorPlan: async (data: any): Promise<any> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image_files' && key !== 'image_ids') {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (data.image_files && Array.isArray(data.image_files)) {
      data.image_files.forEach((file: File) => {
        formData.append('image_files', file);
      });
    }

    if (data.image_ids && Array.isArray(data.image_ids) && data.image_ids.length > 0) {
      formData.append('image_ids', data.image_ids.join(','));
    }

    const response = await api.post<any>('/admin/floor-plan/', formData);
    return extractData<any>(response);
  },

  updateFloorPlan: async (id: number, data: any): Promise<any> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'image_files' && key !== 'image_ids') {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (data.image_files && Array.isArray(data.image_files)) {
      data.image_files.forEach((file: File) => {
        formData.append('image_files', file);
      });
    }

    if (data.image_ids && Array.isArray(data.image_ids)) {
      formData.append('image_ids', data.image_ids.join(','));
    }

    const response = await api.patch<any>('/admin/floor-plan/' + id + '/', formData);
    return extractData<any>(response);
  },

  deleteFloorPlan: async (id: number): Promise<void> => {
    await api.delete('/admin/floor-plan/' + id + '/');
  },

  addFloorPlanImages: async (floorPlanId: number, imageFiles: File[], imageIds?: number[]): Promise<any> => {
    const formData = new FormData();

    imageFiles.forEach(file => {
      formData.append('image_files', file);
    });

    if (imageIds && imageIds.length > 0) {
      formData.append('image_ids', imageIds.join(','));
    }

    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/add-images/', formData);
    return extractData<any>(response);
  },

  removeFloorPlanImage: async (floorPlanId: number, imageId: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/remove-image/', { image_id: imageId });
    return extractData<any>(response);
  },

  setFloorPlanMainImage: async (floorPlanId: number, imageId: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/set-main-image/', { image_id: imageId });
    return extractData<any>(response);
  },

  syncFloorPlanImages: async (floorPlanId: number, imageIds: number[], mainImageId?: number): Promise<any> => {
    const response = await api.post<any>('/admin/floor-plan/' + floorPlanId + '/sync-images/', {
      image_ids: imageIds,
      main_image_id: mainImageId
    });
    return extractData<any>(response);
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
    return fetchPaginated<PropertyTag>('/admin/property-tag/', params);
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
    const response = await api.put<any>('/admin/property-tag/' + id + '/', data);
    return extractData<PropertyTag>(response);
  },

  partialUpdateTag: async (id: number, data: Partial<PropertyTag>): Promise<PropertyTag> => {
    const response = await api.patch<any>('/admin/property-tag/' + id + '/', data);
    return extractData<PropertyTag>(response);
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/property-tag/' + id + '/');
  },

  getAgents: async (params?: { page?: number; size?: number; is_active?: boolean; is_verified?: boolean; agency?: number; city?: number }): Promise<PaginatedResponse<PropertyAgent>> => {
    return fetchPaginated<PropertyAgent>('/admin/property-agent/', params);
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
    return fetchPaginated<RealEstateAgency>('/admin/real-estate-agency/', params);
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

  getProvinces: async (): Promise<RealEstateProvince[]> => {
    const response = await api.get<RealEstateProvince[]>('/admin/real-estate-provinces/');
    return response.data || [];
  },

  getProvinceCities: async (provinceId: number): Promise<RealEstateCity[]> => {
    const response = await api.get<RealEstateCity[]>(`/admin/real-estate-provinces/${provinceId}/cities/`);
    return response.data || [];
  },

  getCitiesWithProperties: async (provinceId?: number): Promise<RealEstateCity[]> => {
    let url = '/admin/real-estate-cities/?has_properties=true';
    if (provinceId) {
      url += `&province_id=${provinceId}`;
    }
    const response = await api.get<RealEstateCity[]>(url);
    return response.data || [];
  },

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

