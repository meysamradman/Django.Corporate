'use client';

import { notFound } from 'next/navigation';
import { useFeatureFlag } from './useFeatureFlags';
import { Loader } from '@/components/elements/Loader';

interface FeatureFlagGuardProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client component that guards access to features based on feature flags
 * Shows 404 if feature is disabled
 */
export function FeatureFlagGuard({ 
  featureKey, 
  children, 
  fallback 
}: FeatureFlagGuardProps) {
  const { isActive, isLoading } = useFeatureFlag(featureKey);

  if (isLoading) {
    return fallback || <Loader />;
  }

  if (!isActive) {
    notFound();
  }

  return <>{children}</>;
}

