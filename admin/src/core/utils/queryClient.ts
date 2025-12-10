import { QueryClient } from '@tanstack/react-query';

let clientInstance: QueryClient | null = null;

const defaultQueryOptions = {
  queries: {
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false, // Don't refetch on window focus - prevent 429 errors
    refetchOnMount: false, // Don't refetch on mount - only fetch once
    refetchOnReconnect: false, // Don't refetch on reconnect
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

 