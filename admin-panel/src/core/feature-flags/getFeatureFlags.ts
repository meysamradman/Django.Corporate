import { featureFlagsApi } from '@/api/feature-flags/feature-flags';

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    return await featureFlagsApi.getAll();
  } catch (error) {
    return {};
  }
}

export async function isFeatureActive(key: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] === true;
}

