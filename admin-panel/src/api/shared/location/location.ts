import { api } from "@/core/config/api";
import type { Province, City, ProvinceCompact, CityCompact } from "@/types/shared/location";

export const locationApi = {
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await api.get<any>("/provinces/all_for_dropdown/");
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  async getCitiesByProvince(provinceId: number): Promise<City[]> {
    try {
      const response = await api.get<any>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  async getAllCities(): Promise<City[]> {
    try {
      const response = await api.get<{data: City[]}>("/cities/");
      return response.data?.data || [];
    } catch (error) {
      throw error;
    }
  },

  async getCitiesCompactByProvince(provinceId: number): Promise<CityCompact[]> {
    try {
      const response = await api.get<any>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  async getProvincesCompact(): Promise<ProvinceCompact[]> {
    try {
      const response = await api.get<any>("/provinces/all_for_dropdown/");
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }
};