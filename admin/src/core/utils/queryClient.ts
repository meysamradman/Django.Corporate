import { QueryClient } from '@tanstack/react-query';

let clientInstance: QueryClient | null = null;

const defaultQueryOptions = {
  queries: {
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
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

 