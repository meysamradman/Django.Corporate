"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader } from '@/components/elements/Loader';

const AIContentGenerator = dynamic(
  () => import('@/components/ai/content').then(mod => ({ default: mod.AIContentGenerator })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
);

export default function AIContentPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <h1 className="page-title">تولید محتوا با AI</h1>
            <AIContentGenerator
                onNavigateToSettings={() => router.push('/settings/ai')}
            />
        </div>
    );
}

