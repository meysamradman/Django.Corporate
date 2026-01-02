import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/elements/Skeleton';
import { usePermission, AccessDenied } from '@/core/permissions';

const AIChatSkeleton = () => (
  <div className="relative flex flex-col h-full bg-bg">
    <div className="flex-1 flex flex-col justify-center items-center px-4">
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <Skeleton className="w-16 h-16 mb-6" />
        
        <Skeleton className="h-8 w-64 mb-2" />
        
        <Skeleton className="h-5 w-80" />
      </div>
    </div>

    <div className="sticky bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-card shadow-lg border border-br p-4">
          <Skeleton className="h-24 w-full mb-3" />
          
          <div className="flex items-center justify-between pt-3 border-t border-br">
            <Skeleton className="h-9 w-48" />
            
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AIChat = lazy(() => import('@/components/ai/chat').then(mod => ({ default: mod.AIChat })));

export default function AIChatPage() {
  const { hasAnyPermission, isLoading } = usePermission();

  if (isLoading) {
    return <AIChatSkeleton />;
  }

  if (!hasAnyPermission(['ai.manage', 'ai.chat.manage'])) {
    return <AccessDenied />;
  }

  return (
    <div className="fixed inset-0 top-[64px] bottom-0 left-0 right-0 lg:right-80">
      <Suspense fallback={<AIChatSkeleton />}>
        <AIChat />
      </Suspense>
    </div>
  );
}

