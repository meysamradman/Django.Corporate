import { api } from '@/core/config/api';
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from '@/types/real_estate/location';
import { extractData } from './shared';

export const locationApi = {
  getProvinces: async (): Promise<RealEstateProvince[]> => {
    const response = await api.get<RealEstateProvince[]>('/admin/real-estate-provinces/');
    const data = extractData<RealEstateProvince[]>(response);
    return data || [];
  },

  getProvinceCities: async (provinceId: number): Promise<RealEstateCity[]> => {
    const response = await api.get<RealEstateCity[]>(`/admin/real-estate-provinces/${provinceId}/cities/`);
    const data = extractData<RealEstateCity[]>(response);
    return data || [];
  },

  getCitiesWithProperties: async (provinceId?: number): Promise<RealEstateCity[]> => {
    let url = '/admin/real-estate-cities/?has_properties=true';
    if (provinceId) url += `&province_id=${provinceId}`;
    const response = await api.get<RealEstateCity[]>(url);
    const data = extractData<RealEstateCity[]>(response);
    return data || [];
  },

  getCityRegions: async (cityId?: number): Promise<RealEstateCityRegion[]> => {
    let url = '/admin/real-estate-city-regions/';
    if (cityId) url += `?city_id=${cityId}`;
    const response = await api.get<RealEstateCityRegion[]>(url);
    const data = extractData<RealEstateCityRegion[]>(response);
    return data || [];
  },

  getCityRegionsByCity: async (cityId: number): Promise<RealEstateCityRegion[]> => {
    const response = await api.get<RealEstateCityRegion[]>(`/admin/real-estate-cities/${cityId}/regions/`);
    const data = extractData<RealEstateCityRegion[]>(response);
    return data || [];
  },
};
