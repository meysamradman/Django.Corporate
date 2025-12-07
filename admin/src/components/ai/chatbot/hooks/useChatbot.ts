import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbotApi } from "@/api/chatbot/route";
import { FAQ, ChatbotSettings, CreateFAQData, UpdateFAQData, UpdateChatbotSettingsData } from "@/types/chatbot/chatbot";
import { showSuccess, showError } from '@/core/toast';

export function useFAQList() {
  return useQuery({
    queryKey: ["chatbot", "faq", "list"],
    queryFn: async () => {
      const response = await chatbotApi.getFAQList();
      if (response.metaData.status === "success") {
        return response.data;
      }
      throw new Error(response.metaData.message);
    },
  });
}

export function useFAQ(id: number | string | null) {
  return useQuery({
    queryKey: ["chatbot", "faq", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await chatbotApi.getFAQ(id);
      if (response.metaData.status === "success") {
        return response.data;
      }
      throw new Error(response.metaData.message);
    },
    enabled: !!id,
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFAQData) => chatbotApi.createFAQ(data),
    onSuccess: (response) => {
      if (response.metaData.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["chatbot", "faq"] });
        showSuccess(response.metaData.message || "سوال متداول با موفقیت ایجاد شد.");
      } else {
        showError(response.metaData.message);
      }
    },
    onError: (error: Error) => {
      showError(error.message || "خطا در ایجاد سوال متداول");
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateFAQData }) =>
      chatbotApi.updateFAQ(id, data),
    onSuccess: (response) => {
      if (response.metaData.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["chatbot", "faq"] });
        showSuccess(response.metaData.message || "سوال متداول با موفقیت به‌روزرسانی شد.");
      } else {
        showError(response.metaData.message);
      }
    },
    onError: (error: Error) => {
      showError(error.message || "خطا در به‌روزرسانی سوال متداول");
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => chatbotApi.deleteFAQ(id),
    onSuccess: (response) => {
      if (response.metaData.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["chatbot", "faq"] });
        showSuccess(response.metaData.message || "سوال متداول با موفقیت حذف شد.");
      } else {
        showError(response.metaData.message);
      }
    },
    onError: (error: Error) => {
      showError(error.message || "خطا در حذف سوال متداول");
    },
  });
}

export function useChatbotSettings() {
  return useQuery({
    queryKey: ["chatbot", "settings"],
    queryFn: async () => {
      const response = await chatbotApi.getSettings();
      if (response.metaData.status === "success") {
        return response.data;
      }
      throw new Error(response.metaData.message);
    },
  });
}

export function useUpdateChatbotSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatbotSettingsData) => chatbotApi.updateSettings(data),
    onSuccess: (response) => {
      if (response.metaData.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["chatbot", "settings"] });
        showSuccess(response.metaData.message || "تنظیمات با موفقیت به‌روزرسانی شد.");
      } else {
        showError(response.metaData.message);
      }
    },
    onError: (error: Error) => {
      showError(error.message || "خطا در به‌روزرسانی تنظیمات");
    },
  });
}
