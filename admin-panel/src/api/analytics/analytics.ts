import { api } from '@/core/config/api';
import type {
  AnalyticsDashboard,
  DashboardStats,
  SystemStats
} from '@/types/analytics';

export const analyticsApi = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const response = await api.get<AnalyticsDashboard>('/analytics/admin/page-views/');
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/analytics/admin/stats/dashboard/');
    return response.data;
  },

  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get<SystemStats>('/analytics/admin/stats/system_stats/');
    return response.data;
  },

  getContentTrend: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/analytics/admin/stats/content_trend/');
    return response.data;
  },

  getMonthlyStats: async (): Promise<{ monthly_stats: Array<{ month: string; desktop: number; mobile: number }> }> => {
    const response = await api.get<{ monthly_stats: Array<{ month: string; desktop: number; mobile: number }> }>('/analytics/admin/monthly-stats/');
    return response.data;
  },

  clearAnalytics: async (period: 'all' | '6months' | 'custom', days?: number): Promise<{
    deleted_page_views: number;
    deleted_daily_stats: number;
    period: string;
  }> => {
    const response = await api.post<{
      deleted_page_views: number;
      deleted_daily_stats: number;
      period: string;
    }>('/analytics/admin/clear/', {
      period,
      ...(days && { days }),
    });
    return response.data;
  },
};
