import { QueryClient } from '@tanstack/react-query';

let clientInstance: QueryClient | null = null;

const defaultQueryOptions = {
  queries: {
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
    retry: false,
    refetchOnWindowFocus: true, // Always refetch for fresh data
    refetchOnReconnect: true,
    refetchInterval: false as const,
  },
  mutations: {
    retry: false,
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

 