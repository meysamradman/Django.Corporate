import { api } from '@/core/config/api';
import type { PropertyType } from '@/types/real_estate/type/propertyType';
import type { PropertyState } from '@/types/real_estate/state/realEstateState';
import type { PropertyLabel } from '@/types/real_estate/label/realEstateLabel';
import type { PropertyFeature } from '@/types/real_estate/feature/realEstateFeature';
import type { PropertyTag } from '@/types/real_estate/tags/realEstateTag';
import { extractData, fetchPaginated } from './shared';

export const taxonomyApi = {
  getTypes: async (params?: { page?: number; size?: number; is_active?: boolean }) => {
    return fetchPaginated<PropertyType>('/admin/property-type/', params);
  },
  createType: async (data: Partial<PropertyType>) => extractData<PropertyType>(await api.post<PropertyType>('/admin/property-type/', data)),
  getTypeById: async (id: number) => extractData<PropertyType>(await api.get<PropertyType>('/admin/property-type/' + id + '/')),
  updateType: async (id: number, data: Partial<PropertyType>) => extractData<PropertyType>(await api.put<PropertyType>('/admin/property-type/' + id + '/', data)),
  partialUpdateType: async (id: number, data: Partial<PropertyType>) => extractData<PropertyType>(await api.patch<PropertyType>('/admin/property-type/' + id + '/', data)),
  deleteType: async (id: number): Promise<void> => {
    await api.delete('/admin/property-type/' + id + '/');
  },

  getStates: async (params?: { page?: number; size?: number; is_active?: boolean }) => {
    return fetchPaginated<PropertyState>('/admin/property-state/', params);
  },
  createState: async (data: Partial<PropertyState>) => extractData<PropertyState>(await api.post<PropertyState>('/admin/property-state/', data)),
  getStateById: async (id: number) => extractData<PropertyState>(await api.get<PropertyState>('/admin/property-state/' + id + '/')),
  updateState: async (id: number, data: Partial<PropertyState>) => extractData<PropertyState>(await api.put<PropertyState>('/admin/property-state/' + id + '/', data)),
  partialUpdateState: async (id: number, data: Partial<PropertyState>) => extractData<PropertyState>(await api.patch<PropertyState>('/admin/property-state/' + id + '/', data)),
  deleteState: async (id: number): Promise<void> => {
    await api.delete('/admin/property-state/' + id + '/');
  },
  getStateFieldOptions: async (): Promise<{ usage_type: [string, string][] }> => {
    const response = await api.get<{ usage_type: [string, string][] }>('/admin/property-state/field-options/');
    return extractData<{ usage_type: [string, string][] }>(response);
  },

  getLabels: async (params?: { page?: number; size?: number; is_active?: boolean }) => {
    return fetchPaginated<PropertyLabel>('/admin/property-label/', params);
  },
  createLabel: async (data: Partial<PropertyLabel>) => extractData<PropertyLabel>(await api.post<PropertyLabel>('/admin/property-label/', data)),
  getLabelById: async (id: number) => extractData<PropertyLabel>(await api.get<PropertyLabel>('/admin/property-label/' + id + '/')),
  updateLabel: async (id: number, data: Partial<PropertyLabel>) => extractData<PropertyLabel>(await api.put<PropertyLabel>('/admin/property-label/' + id + '/', data)),
  partialUpdateLabel: async (id: number, data: Partial<PropertyLabel>) => extractData<PropertyLabel>(await api.patch<PropertyLabel>('/admin/property-label/' + id + '/', data)),
  deleteLabel: async (id: number): Promise<void> => {
    await api.delete('/admin/property-label/' + id + '/');
  },

  getFeatures: async (params?: { page?: number; size?: number; is_active?: boolean; group?: string }) => {
    return fetchPaginated<PropertyFeature>('/admin/property-feature/', params);
  },
  createFeature: async (data: Partial<PropertyFeature>) => extractData<PropertyFeature>(await api.post<PropertyFeature>('/admin/property-feature/', data)),
  getFeatureById: async (id: number) => extractData<PropertyFeature>(await api.get<PropertyFeature>('/admin/property-feature/' + id + '/')),
  updateFeature: async (id: number, data: Partial<PropertyFeature>) => extractData<PropertyFeature>(await api.put<PropertyFeature>('/admin/property-feature/' + id + '/', data)),
  partialUpdateFeature: async (id: number, data: Partial<PropertyFeature>) => extractData<PropertyFeature>(await api.patch<PropertyFeature>('/admin/property-feature/' + id + '/', data)),
  deleteFeature: async (id: number): Promise<void> => {
    await api.delete('/admin/property-feature/' + id + '/');
  },

  getTags: async (params?: { page?: number; size?: number; is_active?: boolean; is_public?: boolean; search?: string }) => {
    return fetchPaginated<PropertyTag>('/admin/property-tag/', params);
  },
  createTag: async (data: Partial<PropertyTag>) => extractData<PropertyTag>(await api.post<PropertyTag>('/admin/property-tag/', data)),
  getTagById: async (id: number) => extractData<PropertyTag>(await api.get<PropertyTag>('/admin/property-tag/' + id + '/')),
  updateTag: async (id: number, data: Partial<PropertyTag>) => extractData<PropertyTag>(await api.put<any>('/admin/property-tag/' + id + '/', data)),
  partialUpdateTag: async (id: number, data: Partial<PropertyTag>) => extractData<PropertyTag>(await api.patch<any>('/admin/property-tag/' + id + '/', data)),
  deleteTag: async (id: number): Promise<void> => {
    await api.delete('/admin/property-tag/' + id + '/');
  },
};
