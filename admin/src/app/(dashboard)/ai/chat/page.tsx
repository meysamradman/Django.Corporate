"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/elements/Skeleton';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { MessageSquare } from 'lucide-react';

// AIChat Skeleton
const AIChatSkeleton = () => (
  <CardWithIcon
    icon={MessageSquare}
    title="چت با AI"
    iconBgColor="bg-blue"
    iconColor="stroke-blue-2"
    borderColor="border-b-blue-1"
    headerClassName="flex-shrink-0 border-b pb-3"
    contentClassName="!p-0 flex-1 flex flex-col overflow-hidden"
    titleExtra={
      <Skeleton className="h-10 w-32" />
    }
  >
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
    <div className="flex-shrink-0 border-t p-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </CardWithIcon>
);

const AIChat = dynamic(
  () => import('@/components/ai/chat').then(mod => ({ default: mod.AIChat })),
  { 
    ssr: false, 
    loading: () => (
      <div className="container mx-auto py-6">
        <AIChatSkeleton />
      </div>
    )
  }
);

export default function AIChatPage() {
    return (
        <div className="container mx-auto py-6">
            <AIChat />
        </div>
    );
}

