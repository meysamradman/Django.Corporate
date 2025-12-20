import { api } from '@/core/config/api';
import type { FeatureFlags } from '@/types/shared/featureFlags';

export const featureFlagsApi = {
  getAll: async (): Promise<FeatureFlags> => {
    try {
      const response = await api.get<FeatureFlags>('/core/feature-flags/', {
        silent: true,
      });
      return response.data || {};
    } catch {
      return {};
    }
  },

  get: async (key: string): Promise<boolean> => {
    try {
      const response = await api.get<{ key: string; is_active: boolean }>(
        `/core/feature-flags/${key}/`
      );
      return response.data?.is_active ?? false;
    } catch {
      return false;
    }
  },
};

