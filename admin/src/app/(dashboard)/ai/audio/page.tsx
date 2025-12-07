"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AIAudioGenerator = dynamic(
  () => import('@/components/ai/audio').then(mod => ({ default: mod.AIAudioGenerator })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div> }
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

