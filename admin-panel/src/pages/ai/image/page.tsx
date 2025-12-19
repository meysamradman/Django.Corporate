import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/elements/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Wand2 } from 'lucide-react';
import { usePermission, AccessDenied } from '@/components/admins/permissions';

// AIImageGenerator Skeleton
const AIImageGeneratorSkeleton = () => (
  <div className="space-y-6">
    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-pink-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-pink rounded-xl shadow-sm">
            <Wand2 className="w-5 h-5 stroke-pink-2" />
          </div>
          تولید تصویر با AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  </div>
);

const AIImageGenerator = lazy(() => import('@/components/ai/image').then(mod => ({ default: mod.AIImageGenerator })));

export default function AIImagePage() {
  const navigate = useNavigate();
  const { hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <AIImageGeneratorSkeleton />
      </div>
    );
  }

  if (!hasAnyPermission(['ai.manage', 'ai.image.manage'])) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">تولید تصویر با AI</h1>
      <Suspense fallback={<AIImageGeneratorSkeleton />}>
        <AIImageGenerator onNavigateToSettings={() => navigate('/settings/ai')} />
      </Suspense>
    </div>
  );
}

