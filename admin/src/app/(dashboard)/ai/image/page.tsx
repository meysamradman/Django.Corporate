"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AIImageGenerator = dynamic(
  () => import('@/components/ai/image').then(mod => ({ default: mod.AIImageGenerator })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div> }
);

export default function AIImagePage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <h1 className="page-title">تولید تصویر با AI</h1>
            <AIImageGenerator
                onNavigateToSettings={() => router.push('/settings/ai')}
            />
        </div>
    );
}

