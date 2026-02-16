import { fetchApi } from "@/core/config/fetch";
import type { PublicContactFormField, PublicContactFormSubmissionCreate } from "@/types/form/contactForm";

export const publicContactFormApi = {
  getFields: async (platform: "website" | "mobile_app" = "website"): Promise<PublicContactFormField[]> => {
    const response = await fetchApi.get<PublicContactFormField[]>(`/public/form/fields/?platform=${platform}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return data.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  submit: async (payload: PublicContactFormSubmissionCreate): Promise<void> => {
    await fetchApi.post<unknown>("/public/form/submissions/", payload);
  },
};
