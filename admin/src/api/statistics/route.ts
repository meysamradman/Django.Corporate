import { fetchApi } from '@/core/config/fetch';
import { Statistics } from '@/types/statistics/statisticsWidget';

export interface SystemStats {
  storage: {
    total_bytes: number;
    total_mb: number;
    total_gb: number;
    total_formatted: string;
    by_type: {
      [key: string]: {
        size_bytes: number;
        size_mb: number;
        size_gb: number;
        count: number;
        formatted: string;
      };
    };
  };
  cache: {
    status: string;
    used_memory_bytes: number;
    used_memory_formatted: string;
    total_keys: number;
    hit_rate: number;
    keyspace_hits: number;
    keyspace_misses: number;
  };
  database: {
    size_formatted: string;
    size_bytes: number;
    size_mb: number;
    size_gb: number;
    vendor: string;
  };
  generated_at: string;
}

export const statsApi = {
  getStatistics: async (): Promise<Statistics> => {
    // ✅ NO CACHE: Admin panel is CSR only - all caching handled by backend Redis
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
