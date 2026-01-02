import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/elements/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Mic } from 'lucide-react';
import { usePermission, AccessDenied } from '@/core/permissions';

const AIAudioGeneratorSkeleton = () => (
  <div className="space-y-6">
    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-purple rounded-xl shadow-sm">
            <Mic className="w-5 h-5 stroke-purple-2" />
          </div>
          تولید پادکست با AI
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
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  </div>
);

const AIAudioGenerator = lazy(() => import('@/components/ai/audio').then(mod => ({ default: mod.AIAudioGenerator })));

export default function AIAudioPage() {
  const navigate = useNavigate();
  const { hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <AIAudioGeneratorSkeleton />
      </div>
    );
  }

  if (!hasAnyPermission(['ai.manage', 'ai.audio.manage'])) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">تولید پادکست با AI</h1>
      <Suspense fallback={<AIAudioGeneratorSkeleton />}>
        <AIAudioGenerator onNavigateToSettings={() => navigate('/settings/ai')} />
      </Suspense>
    </div>
  );
}

