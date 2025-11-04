import React from 'react';
import { AIProviderSettings } from '@/components/settings/AIProviderSettings';

export default function AISettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">تنظیمات مدل‌های AI</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    مدیریت و تنظیم API key های مدل‌های هوش مصنوعی برای تولید تصویر
                </p>
            </div>
            <AIProviderSettings />
        </div>
    );
}

