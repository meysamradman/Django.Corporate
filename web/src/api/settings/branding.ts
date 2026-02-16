import { fetchApi } from "@/core/config/fetch";
import type { HomeSliderItem, SiteLogo } from "@/types/settings/branding";

export const brandingApi = {
  getLogo: async (): Promise<SiteLogo> => {
    const response = await fetchApi.get<SiteLogo>("/settings/logo");
    return response.data;
  },

  getSliders: async (): Promise<HomeSliderItem[]> => {
    const response = await fetchApi.get<HomeSliderItem[]>("/settings/sliders");
    return response.data;
  },
};
