'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/core/config/fetch';
import { DashboardStats, SystemStats } from '@/types/analytics/analytics';
import { usePermission } from '@/core/permissions/context/PermissionContext';

export const useStatistics = () => {
  const { ui } = usePermission();
  
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'stats', 'dashboard'],
    queryFn: async () => {
      const response = await fetchApi.get<DashboardStats>('/analytics/admin/stats/dashboard/');
      if (!response || !response.data) {
        throw new Error("API returned success but no dashboard stats data found.");
      }
      return response.data as DashboardStats;
    },
    enabled: ui.canViewDashboardStats,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};

export const useSystemStats = () => {
  const { ui } = usePermission();
  
  return useQuery<SystemStats>({
    queryKey: ['analytics', 'system_stats'],
    queryFn: async () => {
      const response = await fetchApi.get<SystemStats>('/analytics/admin/stats/system_stats/');
      if (!response.data) {
        throw new Error("API returned success but no system stats data found.");
      }
      return response.data;
    },
    enabled: ui.canViewSystemStats,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10 * 60 * 1000,
  });
};
