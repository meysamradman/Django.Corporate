"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader } from '@/components/elements/Loader';

const AIAudioGenerator = dynamic(
  () => import('@/components/ai/audio').then(mod => ({ default: mod.AIAudioGenerator })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
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

