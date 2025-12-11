"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/elements/Skeleton';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Sparkles } from 'lucide-react';
import { usePermission } from '@/core/permissions/context/PermissionContext';
import { AccessDenied } from '@/core/permissions/components/AccessDenied';

// AIContentGenerator Skeleton
const AIContentGeneratorSkeleton = () => (
  <CardWithIcon
    icon={Sparkles}
    title="تولید محتوای SEO با AI"
    iconBgColor="bg-pink"
    iconColor="stroke-pink-2"
    borderColor="border-b-pink-1"
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

const AIContentGenerator = dynamic(
  () => import('@/components/ai/content').then(mod => ({ default: mod.AIContentGenerator })),
  { 
    ssr: false, 
    loading: () => <AIContentGeneratorSkeleton />
  }
);

export default function AIContentPage() {
  const router = useRouter();
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
      <AIContentGenerator onNavigateToSettings={() => router.push('/settings/ai')} />
    </div>
  );
}

