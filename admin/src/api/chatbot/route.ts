import { ApiResponse } from "@/types/api/apiResponse";
import { fetchApi } from "@/core/config/fetch";

export interface FAQ {
  id: number;
  public_id: string;
  question: string;
  answer: string;
  keywords: string;
  patterns: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatbotSettings {
  id: number;
  public_id: string;
  is_enabled: boolean;
  welcome_message: string;
  default_message: string;
  rate_limit_per_minute: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFAQData {
  question: string;
  answer: string;
  keywords?: string;
  patterns?: string;
  order?: number;
  is_active?: boolean;
}

export interface UpdateFAQData extends Partial<CreateFAQData> {}

export interface UpdateChatbotSettingsData {
  is_enabled?: boolean;
  welcome_message?: string;
  default_message?: string;
  rate_limit_per_minute?: number;
}

export const chatbotApi = {
  getFAQList: async (): Promise<ApiResponse<FAQ[]>> => {
    return fetchApi.get<FAQ[]>("/admin/chatbot/faq/");
  },

  getFAQ: async (id: number | string): Promise<ApiResponse<FAQ>> => {
    return fetchApi.get<FAQ>(`/admin/chatbot/faq/${id}/`);
  },

  createFAQ: async (data: CreateFAQData): Promise<ApiResponse<FAQ>> => {
    return fetchApi.post<FAQ>("/admin/chatbot/faq/", data as unknown as Record<string, unknown>);
  },

  updateFAQ: async (id: number | string, data: UpdateFAQData): Promise<ApiResponse<FAQ>> => {
    return fetchApi.put<FAQ>(`/admin/chatbot/faq/${id}/`, data as unknown as Record<string, unknown>);
  },

  deleteFAQ: async (id: number | string): Promise<ApiResponse<void>> => {
    return fetchApi.delete<void>(`/admin/chatbot/faq/${id}/`);
  },

  getSettings: async (): Promise<ApiResponse<ChatbotSettings>> => {
    return fetchApi.get<ChatbotSettings>("/admin/chatbot/settings/");
  },

  updateSettings: async (data: UpdateChatbotSettingsData): Promise<ApiResponse<ChatbotSettings>> => {
    return fetchApi.put<ChatbotSettings>("/admin/chatbot/settings/update/", data as unknown as Record<string, unknown>);
  },
};

