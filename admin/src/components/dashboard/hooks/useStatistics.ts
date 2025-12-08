'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/core/config/fetch';
import { DashboardStats, SystemStats } from '@/types/analytics/analytics';

export const useStatistics = () => {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await fetchApi.get<DashboardStats>('/analytics/admin/stats/dashboard/');
      if (!response.data) {
        throw new Error("API returned success but no dashboard stats data found.");
      }
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useSystemStats = () => {
  return useQuery<SystemStats>({
    queryKey: ['analytics', 'system_stats'],
    queryFn: async () => {
      const response = await fetchApi.get<SystemStats>('/analytics/admin/stats/system_stats/');
      if (!response.data) {
        throw new Error("API returned success but no system stats data found.");
      }
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};
