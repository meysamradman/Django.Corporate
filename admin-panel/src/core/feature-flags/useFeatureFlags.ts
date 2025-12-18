'use client';

import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi } from '@/api/feature-flags/route';

const FEATURE_FLAGS_QUERY_KEY = ['feature-flags'];

/**
 * React hook to get all feature flags
 * Automatically refetches every 60 seconds
 */
export function useFeatureFlags() {
  return useQuery({
    queryKey: FEATURE_FLAGS_QUERY_KEY,
    queryFn: () => featureFlagsApi.getAll(),
    staleTime: 0, // Always consider stale to get fresh data immediately
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * React hook to check if a specific feature is active
 */
export function useFeatureFlag(key: string) {
  const { data: flags = {}, isLoading } = useFeatureFlags();
  return {
    isActive: flags[key] === true,
    isLoading,
  };
}

