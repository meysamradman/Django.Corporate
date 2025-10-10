import { fetchApi } from "@/core/config/fetch";
import { Province, City, ProvinceCompact, CityCompact } from "@/types/shared/location";

export const locationApi = {
  /**
   * دریافت لیست استان‌ها برای dropdown
   */
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetchApi.get<any>("/provinces/all_for_dropdown/");
      // بر اساس response structure که تو Postman نشون دادی
      return response.data || [];
    } catch (error) {
      console.error("Error fetching provinces:", error);
      throw error;
    }
  },

  /**
   * دریافت شهرهای یک استان برای dropdown
   */
  async getCitiesByProvince(provinceId: number): Promise<City[]> {
    try {
      const response = await fetchApi.get<any>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
      // بر اساس response structure که تو Postman نشون دادی
      return response.data || [];
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  },

  /**
   * دریافت تمام شهرها با pagination
   */
  async getAllCities(): Promise<City[]> {
    try {
      const response = await fetchApi.get<{data: City[]}>("/cities/");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching all cities:", error);
      throw error;
    }
  },

  /**
   * دریافت شهرهای یک استان (Compact format) برای dropdown
   */
  async getCitiesCompactByProvince(provinceId: number): Promise<CityCompact[]> {
    try {
      const response = await fetchApi.get<any>(`/cities/for_province_dropdown/?province_id=${provinceId}`);
      // بر اساس response structure که تو Postman نشون دادی
      return response.data || [];
    } catch (error) {
      console.error("Error fetching cities compact:", error);
      throw error;
    }
  },

  /**
   * دریافت استان‌ها (Compact format) برای dropdown  
   */
  async getProvincesCompact(): Promise<ProvinceCompact[]> {
    try {
      const response = await fetchApi.get<any>("/provinces/all_for_dropdown/");
      // بر اساس response structure که تو Postman نشون دادی
      return response.data || [];
    } catch (error) {
      console.error("Error fetching provinces compact:", error);
      throw error;
    }
  }
};