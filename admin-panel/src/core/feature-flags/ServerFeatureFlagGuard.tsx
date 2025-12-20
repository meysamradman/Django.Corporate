import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getFeatureFlags } from './getFeatureFlags';

interface ServerFeatureFlagGuardProps {
  featureKey: string;
  children: ReactNode;
}

export async function ServerFeatureFlagGuard({ 
  featureKey, 
  children 
}: ServerFeatureFlagGuardProps) {
  const flags = await getFeatureFlags();
  
  if (!flags[featureKey]) {
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}

