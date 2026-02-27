import { fetchApi } from "@/core/config/fetch";
import type { HomeSliderItem, SiteLogo } from "@/types/settings/branding";

const BRANDING_CACHE = { next: { revalidate: 15, tags: ["settings:branding"] } };

export const brandingApi = {
  getLogo: async (): Promise<SiteLogo> => {
    const response = await fetchApi.get<SiteLogo>("/settings/logo/", BRANDING_CACHE);
    return response.data;
  },

  getSliders: async (): Promise<HomeSliderItem[]> => {
    const response = await fetchApi.get<HomeSliderItem[]>("/settings/public/sliders/", BRANDING_CACHE);
    return response.data;
  },
};
