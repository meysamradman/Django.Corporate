import { fetchApi } from '@/core/config/fetch';
import { ApiResponse } from '@/types/api/apiResponse';
import type { 
  AnalyticsDashboard, 
  DashboardStats,
  SystemStats
} from '@/types/analytics/analytics';

const ANALYTICS_ENDPOINTS = {
  dashboard: '/analytics/admin/page-views/',
  stats: '/analytics/admin/stats/',
} as const;

export const analyticsApi = {

  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const response = await fetchApi.get<AnalyticsDashboard>(ANALYTICS_ENDPOINTS.dashboard);
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetchApi.get<DashboardStats>(`${ANALYTICS_ENDPOINTS.stats}dashboard/`);
    return response.data;
  },

  getUsersStats: async (): Promise<any> => {
    const response = await fetchApi.get(`${ANALYTICS_ENDPOINTS.stats}users_stats/`);
    return response.data;
  },

  getAdminsStats: async (): Promise<any> => {
    const response = await fetchApi.get(`${ANALYTICS_ENDPOINTS.stats}admins_stats/`);
    return response.data;
  },

  getContentStats: async (): Promise<any> => {
    const response = await fetchApi.get(`${ANALYTICS_ENDPOINTS.stats}content_stats/`);
    return response.data;
  },

  getTicketsStats: async (): Promise<any> => {
    const response = await fetchApi.get(`${ANALYTICS_ENDPOINTS.stats}tickets_stats/`);
    return response.data;
  },

  getEmailsStats: async (): Promise<any> => {
    const response = await fetchApi.get(`${ANALYTICS_ENDPOINTS.stats}emails_stats/`);
    return response.data;
  },

  getSystemStats: async (): Promise<SystemStats> => {
    const response = await fetchApi.get<SystemStats>(`${ANALYTICS_ENDPOINTS.stats}system_stats/`);
    return response.data;
  },

  getMonthlyStats: async (): Promise<{ monthly_stats: Array<{ month: string; desktop: number; mobile: number }> }> => {
    const response = await fetchApi.get<{ monthly_stats: Array<{ month: string; desktop: number; mobile: number }> }>('/analytics/admin/monthly-stats/');
    return response.data;
  },

  clearAnalytics: async (period: 'all' | '6months' | 'custom', days?: number): Promise<{
    deleted_page_views: number;
    deleted_daily_stats: number;
    period: string;
  }> => {
    const response = await fetchApi.post<{
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
