"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AIImageGenerator } from '@/components/ai/image';

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

