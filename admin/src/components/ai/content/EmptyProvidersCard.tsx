"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Settings, AlertCircle } from 'lucide-react';

interface EmptyProvidersCardProps {
    onNavigateToSettings?: () => void;
}

export function EmptyProvidersCard({ onNavigateToSettings }: EmptyProvidersCardProps) {
    return (
        <CardWithIcon
            icon={AlertCircle}
            title="هیچ Provider فعالی یافت نشد"
            iconBgColor="bg-yellow"
            iconColor="stroke-yellow-2"
            borderColor="border-b-yellow-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3"
            titleExtra={
                <CardDescription>
                    برای استفاده از تولید محتوا با AI، باید یکی از Provider های زیر را فعال کنید:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Google Gemini</strong> - برای تولید محتوا (رایگان)</li>
                        <li><strong>OpenAI GPT</strong> - برای تولید محتوا (پولی)</li>
                        <li><strong>DeepSeek AI</strong> - برای تولید محتوا (رایگان)</li>
                    </ul>
                    <p className="mt-2 text-sm text-font-s">
                        توجه: HuggingFace فقط برای تولید تصویر است و برای محتوا پشتیبانی نمی‌شود.
                    </p>
                </CardDescription>
            }
        >
                <Button onClick={onNavigateToSettings} variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    رفتن به تنظیمات AI
                </Button>
        </CardWithIcon>
    );
}

