import { api } from '@/core/config/api';
import type { FeatureFlags, FeatureFlag } from '@/types/shared/featureFlags';

export const featureFlagsApi = {
  getAll: async (): Promise<FeatureFlags> => {
    try {
      const response = await fetchApi.get<FeatureFlags>('/core/feature-flags/', {
        silent: true,
      });
      return response.data || {};
    } catch (error) {
      return {};
    }
  },

  get: async (key: string): Promise<boolean> => {
    try {
      const response = await fetchApi.get<{ key: string; is_active: boolean }>(
        `/core/feature-flags/${key}/`,
        { silent: true }
      );
      return response.data?.is_active ?? false;
    } catch (error) {
      return false;
    }
  },
};

