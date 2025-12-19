import { lazy, Suspense } from 'react';
import { X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { HelpGuide } from '@/components/elements/HelpGuide';
import { useAIChat } from './AIChatContext';
import { useCanManageAIChat } from '@/components/admins/permissions/hooks/useUIPermissions';
import { cn } from '@/core/utils/cn';

const AIChat = lazy(() => import('./AIChat').then(module => ({ default: module.AIChat })));

export function FloatingAIChat() {
    const { isOpen, setIsOpen, isMinimized, setIsMinimized } = useAIChat();
    const canManageAIChat = useCanManageAIChat();

    if (!canManageAIChat || !isOpen) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 left-6 z-50",
                "w-96 h-[600px] max-h-[calc(100vh-6rem)]",
                "bg-card border border-br rounded-lg shadow-2xl",
                "flex flex-col",
                "transition-all duration-300 ease-in-out",
                "animate-in slide-in-from-left-5",
                isMinimized ? "h-16" : "h-[600px]",
                "overflow-hidden"
            )}
        >
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
    );
}

