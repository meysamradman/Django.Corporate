import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlag } from './useFeatureFlags';
import { Loader } from '@/components/elements/Loader';

interface FeatureFlagGuardProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

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
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}

