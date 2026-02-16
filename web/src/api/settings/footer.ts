import { fetchApi } from "@/core/config/fetch";
import type { FooterAboutItem, FooterSectionItem } from "@/types/settings/footer";

export const footerApi = {
  getPublic: async (): Promise<FooterSectionItem[]> => {
    const response = await fetchApi.get<FooterSectionItem[]>("/settings/footer/");
    return response.data;
  },

  getAbout: async (): Promise<FooterAboutItem> => {
    const response = await fetchApi.get<FooterAboutItem>("/settings/footer/about/");
    return response.data;
  },
};
