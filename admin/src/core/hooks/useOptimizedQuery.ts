'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/core/config/fetch'

export function useOptimizedQuery<T>(
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
    queryFn: () => fetchApi.get<T>(endpoint),
    staleTime: 0,
    gcTime: 0,
    enabled: options?.enabled ?? true,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: options?.refetchInterval || 10 * 60 * 1000,
  })
} 