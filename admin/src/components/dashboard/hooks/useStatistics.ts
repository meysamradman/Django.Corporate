'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi, SystemStats } from '@/api/statistics/route';

export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => statsApi.getStatistics(),
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system_stats'],
    queryFn: () => statsApi.getSystemStats(),
    staleTime: 0, // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
    gcTime: 0, // No cache retention
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};
