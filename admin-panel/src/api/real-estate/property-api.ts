import { api } from '@/core/config/api';
import type { Property, PropertyUpdateData } from '@/types/real_estate/realEstate';
import type { PropertyListParams } from '@/types/real_estate/realEstateListParams';
import { buildListUrl, extractData, toPaginatedResponse } from './shared';

const PROPERTY_BOOLEAN_FILTERS = new Set(['is_published', 'is_featured', 'is_public', 'is_active']);
const PROPERTY_RAW_STRING_FILTERS = new Set(['labels__in', 'tags__in', 'features__in']);

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

export const propertyApi = {
  getPropertyList: async (params?: PropertyListParams) => {
    const url = buildListUrl('/admin/property/', params as any, {
      booleanKeys: PROPERTY_BOOLEAN_FILTERS,
      rawStringKeys: PROPERTY_RAW_STRING_FILTERS,
    });
    const response = await api.get<Property[]>(url);
    return toPaginatedResponse<Property>(response, params as any);
  },

  getPropertyById: async (id: number): Promise<Property> => {
    const response = await api.get<any>('/admin/property/' + id + '/');
    return extractData<Property>(response);
  },

  getPropertiesByIds: async (ids: number[]): Promise<Property[]> => {
    if (ids.length === 0) return [];
    const response = await api.get<Property[]>(`/admin/property/?ids=${ids.join(',')}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createProperty: async (data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.post<any>('/admin/property/', data);
    return extractData<Property>(response);
  },

  createPropertyWithMedia: async (
    data: Partial<PropertyUpdateData> & { media_ids?: number[] },
    mediaFiles: File[]
  ): Promise<Property> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'media_ids' && key !== 'media_files') {
        if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    mediaFiles.forEach((file) => formData.append('media_files', file));
    if (data.media_ids?.length) {
      formData.append('media_ids', data.media_ids.join(','));
    }

    const response = await api.post<any>('/admin/property/', formData);
    return extractData<Property>(response);
  },

  updateProperty: async (id: number, data: Partial<PropertyUpdateData>): Promise<Property> => {
    const response = await api.put<any>('/admin/property/' + id + '/', data);
    return extractData<Property>(response);
  },

  updatePropertyWithMedia: async (
    id: number,
    data: Partial<PropertyUpdateData> & { media_ids?: number[] },
    mediaFiles: File[]
  ): Promise<Property> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'media_ids' && key !== 'media_files') {
        if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    mediaFiles.forEach((file) => formData.append('media_files', file));
    if (data.media_ids?.length) {
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
    mediaFiles.forEach((file) => formData.append('media_files', file));
    if (mediaIds?.length) {
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

  bulkUpdateStatus: async (
    ids: number[],
    status: { is_published?: boolean; is_featured?: boolean; is_public?: boolean; is_active?: boolean }
  ): Promise<{ success: boolean }> => {
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
    year_built: { min: number; max: number; help_text: string; placeholder?: string };
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
    const response = await api.get<any>('/admin/property/field-options/');
    return response.data;
  },

  exportPropertyPdf: async (propertyId: number): Promise<void> => {
    const { exportPropertyPdf } = await import('./export');
    return exportPropertyPdf(propertyId);
  },

  exportProperties: async (filters?: PropertyListParams, format: 'excel' | 'pdf' = 'excel'): Promise<void> => {
    const { exportProperties } = await import('./export');
    return exportProperties(filters, format);
  },
};
