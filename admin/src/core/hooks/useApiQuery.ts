'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/core/config/fetch'

export function useApiQuery<T>(
  key: string[], 
  endpoint: string,
  options?: {
    staleTime?: number
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await fetchApi.get<T>(endpoint);
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    enabled: options?.enabled ?? true,
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on window focus - prevent 429 errors
    refetchOnMount: false, // Don't refetch on mount - only use interval
    refetchInterval: options?.refetchInterval || 0,
  })
}
