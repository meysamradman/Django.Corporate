"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AIContentGenerator } from '@/components/ai/content';

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

