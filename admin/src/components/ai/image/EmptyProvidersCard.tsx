"use client";

import { Card, CardContent } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Settings, Sparkles } from 'lucide-react';

interface EmptyProvidersCardProps {
    onNavigateToSettings?: () => void;
}

export function EmptyProvidersCard({ onNavigateToSettings }: EmptyProvidersCardProps) {
    return (
        <Card>
            <CardContent className="py-8">
                <div className="text-center space-y-4">
                    <Sparkles className="h-12 w-12 mx-auto text-font-s mb-4" />
                    <h3 className="text-lg font-semibold mb-2">هیچ مدل AI فعالی برای تولید تصویر وجود ندارد</h3>
                    <div className="space-y-2 text-sm text-font-s">
                        <p>
                            برای تولید تصویر با AI، باید:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-right" dir="rtl">
                            <li>به تب <strong>"تنظیمات AI"</strong> بروید</li>
                            <li>برای یک مدل AI (مثل <strong>OpenAI DALL-E</strong> یا <strong>OpenRouter</strong>) API key وارد کنید</li>
                            <li>API key را <strong>ذخیره</strong> کنید</li>
                            <li>Switch را <strong>فعال</strong> کنید</li>
                        </ol>
                        {onNavigateToSettings && (
                            <div className="mt-6">
                                <Button 
                                    onClick={onNavigateToSettings}
                                    variant="default"
                                    className="gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    رفتن به تنظیمات AI
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

