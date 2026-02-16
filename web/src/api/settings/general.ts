import { fetchApi } from "@/core/config/fetch";
import type { PublicGeneralSettings } from "@/types/settings/general";

export const generalSettingsApi = {
  getPublic: async (): Promise<PublicGeneralSettings> => {
    const response = await fetchApi.get<PublicGeneralSettings>(
      "/settings/general/public/",
    );
    return response.data;
  },
};
