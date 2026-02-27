import { fetchApi } from "@/core/config/fetch";
import type { PublicGeneralSettings } from "@/types/settings/general";

const GENERAL_SETTINGS_CACHE = { next: { revalidate: 15, tags: ["settings:general"] } };

export const generalSettingsApi = {
  getPublic: async (): Promise<PublicGeneralSettings> => {
    const response = await fetchApi.get<PublicGeneralSettings>(
      "/settings/general/public/",
      GENERAL_SETTINGS_CACHE,
    );
    return response.data;
  },
};
