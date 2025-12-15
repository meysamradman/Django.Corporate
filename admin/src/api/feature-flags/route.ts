import { fetchApi } from '@/core/config/fetch';

export type FeatureFlags = Record<string, boolean>;

export interface FeatureFlag {
  id?: number;
  public_id?: string;
  key: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

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

