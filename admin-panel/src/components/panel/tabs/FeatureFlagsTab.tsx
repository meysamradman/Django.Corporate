import { lazy, Suspense } from 'react';

const FeatureFlagsSection = lazy(() => import("@/components/settings").then(mod => ({ default: mod.FeatureFlagsManagement })));

export function FeatureFlagsTab() {
    return (
        <Suspense fallback={<div>در حال بارگذاری...</div>}>
            <FeatureFlagsSection />
        </Suspense>
    );
}

