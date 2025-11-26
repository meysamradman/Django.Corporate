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
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
    enabled: options?.enabled ?? true,
    retry: 1,
    refetchOnWindowFocus: true, // Always refetch for fresh data
    refetchInterval: options?.refetchInterval || 10 * 60 * 1000, // 10 minutes
  })
} 