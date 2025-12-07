'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/statistics/route';
import { SystemStats } from '@/types/statistics/systemStats';

export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => statsApi.getStatistics(),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system_stats'],
    queryFn: () => statsApi.getSystemStats(),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};
