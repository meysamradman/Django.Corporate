import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/elements/Skeleton';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Sparkles } from 'lucide-react';
import { usePermission, AccessDenied } from '@/core/permissions';

const AIContentGeneratorSkeleton = () => (
  <CardWithIcon
    icon={Sparkles}
    title="تولید محتوای SEO با AI"
    iconBgColor="bg-pink"
    iconColor="stroke-pink-2"
    cardBorderColor="border-b-pink-1"
  >
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  </CardWithIcon>
);

const AIContentGenerator = lazy(() => import('@/components/ai/content').then(mod => ({ default: mod.AIContentGenerator })));

export default function AIContentPage() {
  const navigate = useNavigate();
  const { hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <AIContentGeneratorSkeleton />
      </div>
    );
  }

  if (!hasAnyPermission(['ai.manage', 'ai.content.manage'])) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">تولید محتوا با AI</h1>
      <Suspense fallback={<AIContentGeneratorSkeleton />}>
        <AIContentGenerator onNavigateToSettings={() => navigate('/settings/ai')} />
      </Suspense>
    </div>
  );
}

