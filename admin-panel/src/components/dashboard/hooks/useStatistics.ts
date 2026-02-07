import { useQuery} from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics/analytics';
import type { DashboardStats, SystemStats } from '@/types/analytics';

export const useStatistics = () => {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'stats', 'dashboard'],
    queryFn: async () => {
      const data = await analyticsApi.getDashboardStats();
      if (!data) {
        throw new Error("API returned success but no dashboard stats data found.");
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSystemStats = () => {
  return useQuery<SystemStats>({
    queryKey: ['analytics', 'system_stats'],
    queryFn: async () => {
      const data = await analyticsApi.getSystemStats();
      if (!data) {
        throw new Error("API returned success but no system stats data found.");
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
