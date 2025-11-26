"use client";

import { useState, useEffect, lazy, Suspense } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { HelpGuide } from '@/components/elements/HelpGuide';
import { useAuth } from '@/core/auth/AuthContext';
import { cn } from '@/core/utils/cn';

// Lazy load chat component for better performance
const AIChat = lazy(() => import('./AIChat').then(module => ({ default: module.AIChat })));

export function FloatingAIChat() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        // Check if user has AI chat permission
        if (user) {
            const hasChatPermission = user?.permissions?.some((p: string) => 
                p === 'all' || p === 'ai.manage' || p === 'ai.chat.manage' || p.startsWith('ai.')
            );
            setHasPermission(hasChatPermission || false);
        } else {
            setHasPermission(false);
        }
    }, [user]);

    // Don't render if no permission
    if (!hasPermission) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "fixed bottom-6 left-6 z-50",
                        "h-14 w-14 rounded-full shadow-lg",
                        "bg-primary hover:bg-primary/90",
                        "text-static-w border-0",
                        "transition-all duration-300 ease-in-out",
                        "hover:scale-110 active:scale-95",
                        "flex items-center justify-center",
                        "group"
                    )}
                    aria-label="باز کردن چت با AI"
                >
                    <MessageCircle className="h-6 w-6 text-static-w group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-1 rounded-full border-2 border-static-w animate-pulse" />
                </Button>
            )}

            {/* Chat Widget */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed bottom-6 left-6 z-50",
                        "w-96 h-[600px] max-h-[85vh]",
                        "bg-card border border-br rounded-lg shadow-2xl",
                        "flex flex-col",
                        "transition-all duration-300 ease-in-out",
                        isMinimized ? "h-16" : "h-[600px]",
                        "overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-br bg-bg/50">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-1 rounded-full animate-pulse" />
                            <h3 className="text-sm font-semibold text-font-p">چت با AI</h3>
                            {!isMinimized && (
                                <HelpGuide
                                    title="راهنمای چت با AI"
                                    content={`**چطور از چت با AI استفاده کنم؟**

1. ابتدا یک مدل AI را از منوی بالا انتخاب کنید
2. پیام خود را در کادر پایین تایپ کنید
3. Enter بزنید یا روی دکمه ارسال کلیک کنید
4. AI به شما پاسخ خواهد داد

**نکات مهم:**
• چت‌های این ویجت در مرورگر ذخیره می‌شوند (حداکثر 50 پیام)
• می‌توانید تا 20 پیام آخر را در یک مکالمه استفاده کنید
• برای پاک کردن چت‌ها، از دکمه سطل زباله استفاده کنید`}
                                    variant="badge"
                                    position="bottom"
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setIsMinimized(!isMinimized);
                                }}
                                className="h-8 w-8 border-0 hover:bg-bg"
                                aria-label={isMinimized ? "باز کردن" : "کوچک کردن"}
                            >
                                <Minimize2 className="h-4 w-4 text-font-s" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsMinimized(false);
                                }}
                                className="h-8 w-8 border-0 hover:bg-bg"
                                aria-label="بستن"
                            >
                                <X className="h-4 w-4 text-font-s" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    {!isMinimized && (
                        <div className="flex-1 overflow-hidden">
                            <Suspense
                                fallback={
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-sm text-font-s">در حال بارگذاری...</div>
                                    </div>
                                }
                            >
                                <div className="h-full">
                                    <AIChat compact />
                                </div>
                            </Suspense>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

