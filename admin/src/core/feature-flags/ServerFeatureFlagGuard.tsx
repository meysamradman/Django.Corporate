import { notFound } from 'next/navigation';
import { getFeatureFlags } from './getFeatureFlags';

interface ServerFeatureFlagGuardProps {
  featureKey: string;
  children: React.ReactNode;
}

/**
 * Server component that guards access to features based on feature flags
 * Shows 404 if feature is disabled
 * Use this in page.tsx files for server-side route protection
 */
export async function ServerFeatureFlagGuard({ 
  featureKey, 
  children 
}: ServerFeatureFlagGuardProps) {
  const flags = await getFeatureFlags();
  
  if (!flags[featureKey]) {
    notFound();
  }

  return <>{children}</>;
}

