import { api } from '@/core/config/api';
import { ApiResponse } from "@/types/api/apiResponse";
import {
  FAQ,
  ChatbotSettings,
  CreateFAQData,
  UpdateFAQData,
  UpdateChatbotSettingsData,
} from "@/types/chatbot/chatbot";

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

