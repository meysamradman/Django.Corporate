"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AIAudioGenerator } from '@/components/ai/audio';

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

