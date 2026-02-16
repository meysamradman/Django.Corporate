import { fetchApi } from "@/core/config/fetch";
import type {
  PublicChatbotSettings,
  PublicChatbotSendMessageResponse,
  PublicChatbotFaqItem,
} from "@/types/chatbot/chatbot";

export const chatbotApi = {
  getSettings: async (): Promise<PublicChatbotSettings> => {
    const response = await fetchApi.get<PublicChatbotSettings>(
      "/chatbot/settings/"
    );
    return response.data;
  },

  getFaqs: async (): Promise<PublicChatbotFaqItem[]> => {
    const response = await fetchApi.get<PublicChatbotFaqItem[]>(
      "/chatbot/faq/"
    );
    return response.data;
  },

  sendMessage: async (message: string): Promise<PublicChatbotSendMessageResponse> => {
    const response = await fetchApi.post<PublicChatbotSendMessageResponse>(
      "/chatbot/send-message/",
      { message }
    );
    return response.data;
  },
};
