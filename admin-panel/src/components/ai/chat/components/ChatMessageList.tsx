import { type RefObject } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/elements/Avatar';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getAIUI } from '@/core/messages';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

interface ChatMessageListProps {
    messages: ChatMessage[];
    sending: boolean;
    compact?: boolean;
    getAdminDisplayName: () => string;
    getAdminInitials: () => string;
    getAdminProfileImageUrl: () => string | null;
    messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
    messages,
    sending,
    compact = false,
    getAdminDisplayName,
    getAdminInitials,
    getAdminProfileImageUrl,
    messagesEndRef,
}: ChatMessageListProps) {
    if (compact) {
        return (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {messages.length > 0 && messages.length <= 5 && (
                    <div className="mb-3 p-2.5 bg-blue/10 border border-blue-1 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-blue-1 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-font-s leading-relaxed">
                                    <strong className="text-blue-2">توجه:</strong> چت‌های شما به صورت موقت در مرورگر ذخیره می‌شوند (حداکثر 50 پیام). برای حفظ طولانی‌مدت، از دکمه پاک کردن استفاده نکنید.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-font-s">
                        <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                        <p className="text-sm font-medium mb-1">{getAIUI('startConversation')}</p>
                        <p className="text-xs">
                            {getAIUI('chatDescription')}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {msg.role === 'user' && (
                                <Avatar className="flex-shrink-0 w-6 h-6 rounded-full">
                                    {getAdminProfileImageUrl() ? (
                                        <AvatarImage
                                            src={getAdminProfileImageUrl()!}
                                            alt={getAdminDisplayName()}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <AvatarFallback className="bg-gray-2 text-static-w text-[10px] font-medium rounded-full">
                                            {getAdminInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            )}
                            <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${msg.role === 'user'
                                    ? 'bg-card text-font-p border border-br'
                                    : 'bg-bg text-font-s border border-br'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words">
                                    {msg.content}
                                </p>
                            </div>
                            {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bg flex items-center justify-center border border-br">
                                    <Sparkles className="h-3 w-3 stroke-font-s" />
                                </div>
                            )}
                        </div>
                    ))
                )}
                {sending && (
                    <div className="flex items-center gap-2 justify-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-bg flex items-center justify-center border border-br">
                            <Sparkles className="h-3 w-3 stroke-font-s" />
                        </div>
                        <div className="bg-bg text-font-s rounded-lg px-3 py-2 border border-br">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-xs">{getAIUI('responding')}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        );
    }

    return (
        <div className={`flex-1 ${messages.length === 0 ? '' : 'overflow-y-auto'}`}>
            <div className={`${messages.length === 0 
                ? 'h-full flex flex-col justify-center items-center px-4' 
                : 'pt-8 pb-[200px]'
            }`}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-blue rounded-2xl flex items-center justify-center mb-6">
                            <Sparkles className="h-8 w-8 text-blue-1" />
                        </div>
                        <h1 className="text-2xl font-semibold text-font-p mb-2">
                            چطور می‌تونم کمکت کنم؟
                        </h1>
                        <p className="text-base text-font-s">
                            من اینجام تا به هر سوال یا کاری کمکت کنم
                        </p>
                    </div>
                )}

                {messages.length > 0 && (
                    <div className="max-w-4xl mx-auto w-full px-4">
                        {messages.length <= 5 && (
                            <div className="mb-8 p-4 bg-blue/10 border border-blue-1 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-4 w-4 text-blue-1 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-font-s leading-relaxed">
                                            <strong className="text-blue-2">توجه:</strong> چت‌های شما به صورت موقت در مرورگر ذخیره می‌شوند (حداکثر 50 پیام). برای حفظ طولانی‌مدت، از دکمه پاک کردن استفاده نکنید.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                                        <div
                                            className={`rounded-2xl px-6 py-4 ${
                                                msg.role === 'user'
                                                    ? 'bg-gray text-font-p'
                                                    : 'bg-card border border-br shadow-sm text-font-p'
                                            }`}
                                        >
                                            <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {sending && (
                            <div className="flex justify-start mt-6">
                                <div className="max-w-[80%]">
                                    <div className="bg-card border border-br rounded-2xl px-6 py-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-4 w-4 animate-spin text-font-s" />
                                            <span className="text-base text-font-p">{getAIUI('responding')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
