import { QueryClient } from '@tanstack/react-query';

let clientInstance: QueryClient | null = null;

const defaultQueryOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 دقیقه - داده‌ها تا 5 دقیقه fresh می‌مونن
    gcTime: 10 * 60 * 1000, // 10 دقیقه - cache تا 10 دقیقه نگه داشته میشه
    retry: 1, // یکبار retry در صورت خطا
    refetchOnWindowFocus: false, // وقتی کاربر به صفحه برمی‌گرده refetch نمیشه
    refetchOnMount: true, // وقتی کامپوننت mount میشه refetch میشه
    refetchOnReconnect: true, // وقتی اینترنت وصل میشه refetch میشه
    refetchInterval: false as const, // polling غیرفعال
  },
  mutations: {
    retry: 1, // یکبار retry در صورت خطا
    gcTime: 5 * 60 * 1000, // 5 دقیقه cache برای mutations
  },
};

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: defaultQueryOptions,
    });
  }

  if (!clientInstance) {
    clientInstance = new QueryClient({
      defaultOptions: defaultQueryOptions,
    });
  }

  return clientInstance;
}

