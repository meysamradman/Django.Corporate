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
  /**
   * Get all feature flags from the backend (public - only status)
   * Uses Next.js revalidation for caching
   */
  getAll: async (): Promise<FeatureFlags> => {
    try {
      const response = await fetchApi.get<FeatureFlags>('/core/feature-flags/', {
        silent: true,
      });
      return response.data || {};
    } catch (error) {
      // If feature flags endpoint fails, return empty object (all features disabled)
      console.warn('Failed to fetch feature flags:', error);
      return {};
    }
  },

  /**
   * Get a specific feature flag status
   */
  get: async (key: string): Promise<boolean> => {
    try {
      const response = await fetchApi.get<{ key: string; is_active: boolean }>(
        `/core/feature-flags/${key}/`,
        { silent: true }
      );
      return response.data?.is_active ?? false;
    } catch (error) {
      console.warn(`Failed to fetch feature flag "${key}":`, error);
      return false;
    }
  },
};

