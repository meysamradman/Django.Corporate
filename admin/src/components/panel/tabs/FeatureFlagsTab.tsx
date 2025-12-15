'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const FeatureFlagsSection = dynamic(
  () => import("@/components/settings").then(mod => ({ default: mod.FeatureFlagsManagement })),
  { 
    ssr: false,
  }
);

export function FeatureFlagsTab() {
    return <FeatureFlagsSection />;
}

