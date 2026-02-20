import { api } from '@/core/config/api';
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from '@/types/real_estate/location';
import type { PaginatedResponse } from '@/types/shared/pagination';
import { buildListUrl, extractData, toPaginatedResponse } from './shared';

type LocationListParams = {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  date_from?: string;
  date_to?: string;
  province_id?: number;
  city_id?: number;
  has_properties?: boolean;
};

const fetchPaginatedLocation = async <T>(url: string, params?: LocationListParams): Promise<PaginatedResponse<T>> => {
  const fullUrl = buildListUrl(url, params as any, {
    booleanKeys: new Set(['order_desc', 'has_properties']),
  });
  const response = await api.get<T[]>(fullUrl);
  return toPaginatedResponse<T>(response, params as any);
};

const fetchAllLocationPages = async <T>(url: string, params?: Omit<LocationListParams, 'page' | 'size'>): Promise<T[]> => {
  const size = 50;
  let page = 1;
  let totalPages = 1;
  const allData: T[] = [];

  while (page <= totalPages) {
    const paginated = await fetchPaginatedLocation<T>(url, { ...(params || {}), page, size });
    allData.push(...(paginated.data || []));
    totalPages = paginated.pagination?.total_pages || 1;
    page += 1;
  }

  return allData;
};

export const locationApi = {
  getProvincesList: async (params?: LocationListParams): Promise<PaginatedResponse<RealEstateProvince>> => {
    return fetchPaginatedLocation<RealEstateProvince>('/admin/real-estate-provinces/', params);
  },

  getCitiesList: async (params?: LocationListParams): Promise<PaginatedResponse<RealEstateCity>> => {
    return fetchPaginatedLocation<RealEstateCity>('/admin/real-estate-cities/', params);
  },

  getCityRegionsList: async (params?: LocationListParams): Promise<PaginatedResponse<RealEstateCityRegion>> => {
    return fetchPaginatedLocation<RealEstateCityRegion>('/admin/real-estate-city-regions/', params);
  },

  getProvinces: async (): Promise<RealEstateProvince[]> => {
    return fetchAllLocationPages<RealEstateProvince>('/admin/real-estate-provinces/');
  },

  getCities: async (provinceId?: number): Promise<RealEstateCity[]> => {
    return fetchAllLocationPages<RealEstateCity>('/admin/real-estate-cities/', {
      province_id: provinceId,
    });
  },

  getProvinceCities: async (provinceId: number): Promise<RealEstateCity[]> => {
    const response = await api.get<RealEstateCity[]>(`/admin/real-estate-provinces/${provinceId}/cities/`);
    const data = extractData<RealEstateCity[]>(response);
    return data || [];
  },

  getCitiesWithProperties: async (provinceId?: number): Promise<RealEstateCity[]> => {
    return fetchAllLocationPages<RealEstateCity>('/admin/real-estate-cities/', {
      has_properties: true,
      province_id: provinceId,
    });
  },

  getCityRegions: async (cityId?: number): Promise<RealEstateCityRegion[]> => {
    return fetchAllLocationPages<RealEstateCityRegion>('/admin/real-estate-city-regions/', {
      city_id: cityId,
    });
  },

  getCityRegionsByCity: async (cityId: number): Promise<RealEstateCityRegion[]> => {
    const response = await api.get<RealEstateCityRegion[]>(`/admin/real-estate-cities/${cityId}/regions/`);
    const data = extractData<RealEstateCityRegion[]>(response);
    return data || [];
  },

  createProvince: async (payload: { name: string; code: string }): Promise<RealEstateProvince> => {
    const response = await api.post<RealEstateProvince>('/admin/real-estate-provinces/', payload);
    return extractData<RealEstateProvince>(response);
  },

  getProvinceById: async (id: number): Promise<RealEstateProvince> => {
    const response = await api.get<RealEstateProvince>(`/admin/real-estate-provinces/${id}/`);
    return extractData<RealEstateProvince>(response);
  },

  updateProvince: async (id: number, payload: { name: string; code: string }): Promise<RealEstateProvince> => {
    const response = await api.put<RealEstateProvince>(`/admin/real-estate-provinces/${id}/`, payload);
    return extractData<RealEstateProvince>(response);
  },

  deleteProvince: async (id: number): Promise<void> => {
    await api.delete(`/admin/real-estate-provinces/${id}/`);
  },

  createCity: async (payload: { name: string; code: string; province_id: number }): Promise<RealEstateCity> => {
    const response = await api.post<RealEstateCity>('/admin/real-estate-cities/', payload);
    return extractData<RealEstateCity>(response);
  },

  getCityById: async (id: number): Promise<RealEstateCity> => {
    const response = await api.get<RealEstateCity>(`/admin/real-estate-cities/${id}/`);
    return extractData<RealEstateCity>(response);
  },

  updateCity: async (id: number, payload: { name: string; code: string; province_id: number }): Promise<RealEstateCity> => {
    const response = await api.put<RealEstateCity>(`/admin/real-estate-cities/${id}/`, payload);
    return extractData<RealEstateCity>(response);
  },

  deleteCity: async (id: number): Promise<void> => {
    await api.delete(`/admin/real-estate-cities/${id}/`);
  },

  createRegion: async (payload: { name: string; code: number; city_id: number }): Promise<RealEstateCityRegion> => {
    const response = await api.post<RealEstateCityRegion>('/admin/real-estate-city-regions/', payload);
    return extractData<RealEstateCityRegion>(response);
  },

  getRegionById: async (id: number): Promise<RealEstateCityRegion> => {
    const response = await api.get<RealEstateCityRegion>(`/admin/real-estate-city-regions/${id}/`);
    return extractData<RealEstateCityRegion>(response);
  },

  updateRegion: async (id: number, payload: { name: string; code: number; city_id: number }): Promise<RealEstateCityRegion> => {
    const response = await api.put<RealEstateCityRegion>(`/admin/real-estate-city-regions/${id}/`, payload);
    return extractData<RealEstateCityRegion>(response);
  },

  deleteRegion: async (id: number): Promise<void> => {
    await api.delete(`/admin/real-estate-city-regions/${id}/`);
  },
};
