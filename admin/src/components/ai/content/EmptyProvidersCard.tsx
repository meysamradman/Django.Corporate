"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Settings, AlertCircle } from 'lucide-react';

interface EmptyProvidersCardProps {
    onNavigateToSettings?: () => void;
}

export function EmptyProvidersCard({ onNavigateToSettings }: EmptyProvidersCardProps) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-yellow-500">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-100 rounded-xl shadow-sm">
                        <AlertCircle className="w-5 h-5 stroke-yellow-600" />
                    </div>
                    هیچ Provider فعالی یافت نشد
                </CardTitle>
                <CardDescription>
                    برای استفاده از تولید محتوا با AI، باید یکی از Provider های زیر را فعال کنید:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>Google Gemini</strong> - برای تولید محتوا (رایگان)</li>
                        <li><strong>OpenAI GPT</strong> - برای تولید محتوا (پولی)</li>
                        <li><strong>DeepSeek AI</strong> - برای تولید محتوا (رایگان)</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                        توجه: HuggingFace فقط برای تولید تصویر است و برای محتوا پشتیبانی نمی‌شود.
                    </p>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onNavigateToSettings} variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    رفتن به تنظیمات AI
                </Button>
            </CardContent>
        </Card>
    );
}

