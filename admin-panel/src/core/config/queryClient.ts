import { QueryClient } from '@tanstack/react-query';

let clientInstance: QueryClient | null = null;

const defaultQueryOptions = {
  queries: {
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false, // وقتی کاربر به صفحه برمی‌گرده refetch نمیشه
    refetchOnMount: true, // وقتی کامپوننت mount میشه refetch میشه
    refetchOnReconnect: true, // وقتی اینترنت وصل میشه refetch میشه
    refetchInterval: false as const, // polling غیرفعال
  },
  mutations: {
    retry: 1,
    gcTime: 0,
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

