"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/elements/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Mic } from 'lucide-react';

// AIAudioGenerator Skeleton
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

const AIAudioGenerator = dynamic(
  () => import('@/components/ai/audio').then(mod => ({ default: mod.AIAudioGenerator })),
  { 
    ssr: false, 
    loading: () => <AIAudioGeneratorSkeleton />
  }
);

export default function AIAudioPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <h1 className="page-title">تولید پادکست با AI</h1>
            <AIAudioGenerator
                onNavigateToSettings={() => router.push('/settings/ai')}
            />
        </div>
    );
}

