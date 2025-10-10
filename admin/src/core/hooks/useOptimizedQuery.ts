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
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
    retry: 1,
    refetchOnWindowFocus: false,
    // Background refetch برای UX بهتر
    refetchInterval: options?.refetchInterval || 10 * 60 * 1000, // 10 minutes
  })
} 