import { fetchApi } from "@/core/config/fetch";
import type { PublicContactSettings } from "@/types/settings/contact";

export const contactSettingsApi = {
  getPublic: async (): Promise<PublicContactSettings> => {
    const response = await fetchApi.get<PublicContactSettings>("/settings/contact/");
    return response.data;
  },
};
