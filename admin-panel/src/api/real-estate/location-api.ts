import { api } from '@/core/config/api';
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from '@/types/real_estate/location';

export const locationApi = {
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
    if (provinceId) url += `&province_id=${provinceId}`;
    const response = await api.get<RealEstateCity[]>(url);
    return response.data || [];
  },

  getCityRegions: async (cityId?: number): Promise<RealEstateCityRegion[]> => {
    let url = '/admin/real-estate-city-regions/';
    if (cityId) url += `?city_id=${cityId}`;
    const response = await api.get<RealEstateCityRegion[]>(url);
    return response.data || [];
  },

  getCityRegionsByCity: async (cityId: number): Promise<RealEstateCityRegion[]> => {
    const response = await api.get<RealEstateCityRegion[]>(`/admin/real-estate-cities/${cityId}/regions/`);
    return response.data || [];
  },
};
