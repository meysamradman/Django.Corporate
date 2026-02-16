import { fetchApi } from "@/core/config/fetch";
import type { HomeSliderItem, SiteLogo } from "@/types/settings/branding";

export const brandingApi = {
  getLogo: async (): Promise<SiteLogo> => {
    const response = await fetchApi.get<SiteLogo>("/public/settings/logo");
    return response.data;
  },

  getSliders: async (): Promise<HomeSliderItem[]> => {
    const response = await fetchApi.get<HomeSliderItem[]>("/public/settings/sliders");
    return response.data;
  },
};
