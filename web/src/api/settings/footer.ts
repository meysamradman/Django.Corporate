import { fetchApi } from "@/core/config/fetch";
import type { FooterAboutItem, FooterSectionItem } from "@/types/settings/footer";

const FOOTER_CACHE = { next: { revalidate: 30, tags: ["settings:footer"] } };

export const footerApi = {
  getPublic: async (): Promise<FooterSectionItem[]> => {
    const response = await fetchApi.get<FooterSectionItem[]>("/settings/footer/", FOOTER_CACHE);
    return response.data;
  },

  getAbout: async (): Promise<FooterAboutItem> => {
    const response = await fetchApi.get<FooterAboutItem>("/settings/footer/about/", FOOTER_CACHE);
    return response.data;
  },
};
