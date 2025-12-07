import { fetchApi } from '@/core/config/fetch';
import { Statistics } from '@/types/statistics/statisticsWidget';
import { SystemStats } from '@/types/statistics/systemStats';

export const statsApi = {
  getStatistics: async (): Promise<Statistics> => {
    const response = await fetchApi.get<Statistics>('/admin/statistics/dashboard/');
    if (!response.data) {
      throw new Error("API returned success but no dashboard stats data found.");
    }
    return response.data;
  },
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await fetchApi.get<SystemStats>('/admin/statistics/system_stats/');
    if (!response.data) {
      throw new Error("API returned success but no system stats data found.");
    }
    return response.data;
  },
};
