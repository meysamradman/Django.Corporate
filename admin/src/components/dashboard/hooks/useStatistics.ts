'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/statistics/route';

export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => statsApi.getStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};
