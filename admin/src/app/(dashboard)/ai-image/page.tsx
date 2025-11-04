"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AIImageGenerator } from '@/components/media/ai/AIImageGenerator';

export default function AIImagePage() {
    const router = useRouter();

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="page-title">تولید تصویر با AI</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    تولید تصاویر با استفاده از هوش مصنوعی
                </p>
            </div>
            <AIImageGenerator
                onNavigateToSettings={() => router.push('/settings/ai')}
            />
        </div>
    );
}

