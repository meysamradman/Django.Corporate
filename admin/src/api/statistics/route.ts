import { fetchApi } from '@/core/config/fetch';
import { Statistics } from '@/types/statistics/statisticsWidget';

export const statsApi = {
  getStatistics: async (options?: { cache?: RequestCache, revalidate?: number | false }): Promise<Statistics> => {
    const response = await fetchApi.get<Statistics>('/admin/statistics/dashboard/', options);
    if (!response.data) {
      throw new Error("API returned success but no dashboard stats data found.");
    }
    return response.data;
  },
};
