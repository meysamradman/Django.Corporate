import { featureFlagsApi } from '@/api/feature-flags/route';

/**
 * Server-side function to get feature flags
 * Uses Next.js revalidation for caching (60 seconds)
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    return await featureFlagsApi.getAll();
  } catch (error) {
    console.warn('Failed to fetch feature flags:', error);
    return {};
  }
}

/**
 * Check if a specific feature is active
 */
export async function isFeatureActive(key: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] === true;
}

