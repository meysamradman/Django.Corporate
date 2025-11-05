import React from 'react';
import { AIProviderSettings } from '@/components/settings/AIProviderSettings';

export default function AISettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="page-title">تنظیمات مدل‌های AI</h1>
            <AIProviderSettings />
        </div>
    );
}

