"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AIContentGenerator } from '@/components/ai/AIContentGenerator';

export default function AIContentPage() {
    const router = useRouter();

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="page-title">تولید محتوا با AI</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    تولید محتوای SEO بهینه شده با هوش مصنوعی
                </p>
            </div>
            <AIContentGenerator
                onNavigateToSettings={() => router.push('/settings/ai')}
            />
        </div>
    );
}

