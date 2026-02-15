import { api } from "@/core/config/api";
import type { Province, City, ProvinceCompact, CityCompact } from "@/types/shared/location";

const extractArrayData = <T>(response: { data?: unknown }): T[] => {
  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (response.data && typeof response.data === 'object' && Array.isArray((response.data as { data?: unknown }).data)) {
    return (response.data as { data: T[] }).data;
  }

  return [];
};

export const locationApi = {
  async getProvinces(): Promise<Province[]> {
    const response = await api.get<Province[]>("/provinces/all_for_dropdown/");
    return extractArrayData<Province>(response);
  },

  async getCitiesByProvince(provinceId: number): Promise<City[]> {
    const response = await api.get<City[]>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
    return extractArrayData<City>(response);
  },

  async getAllCities(): Promise<City[]> {
    const response = await api.get<City[] | { data: City[] }>("/cities/");
    return extractArrayData<City>(response);
  },

  async getCitiesCompactByProvince(provinceId: number): Promise<CityCompact[]> {
    const response = await api.get<CityCompact[]>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
    return extractArrayData<CityCompact>(response);
  },

  async getProvincesCompact(): Promise<ProvinceCompact[]> {
    const response = await api.get<ProvinceCompact[]>("/provinces/all_for_dropdown/");
    return extractArrayData<ProvinceCompact>(response);
  }
};