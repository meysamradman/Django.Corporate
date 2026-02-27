import { fetchApi } from "@/core/config/fetch";
import type { PublicContactSettings } from "@/types/settings/contact";

const CONTACT_CACHE = { next: { revalidate: 30, tags: ["settings:contact"] } };

export const contactSettingsApi = {
  getPublic: async (): Promise<PublicContactSettings> => {
    const response = await fetchApi.get<PublicContactSettings>("/settings/contact/", CONTACT_CACHE);
    return response.data;
  },
};
