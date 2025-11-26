import { fetchApi } from '@/core/config/fetch';
import { Statistics } from '@/types/statistics/statisticsWidget';

export const statsApi = {
  getStatistics: async (): Promise<Statistics> => {
    // ✅ NO CACHE: Admin panel is CSR only - all caching handled by backend Redis
    const response = await fetchApi.get<Statistics>('/admin/statistics/dashboard/');
    if (!response.data) {
      throw new Error("API returned success but no dashboard stats data found.");
    }
    return response.data;
  },
};
