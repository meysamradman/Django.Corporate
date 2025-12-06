"use client";

import { useState, useEffect, useRef } from 'react';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Textarea } from '@/components/elements/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/elements/Avatar';
import { aiApi } from '@/api/ai/route';
import { AvailableProvider } from '@/types/ai/ai';
import { Loader2, MessageSquare, Send, Sparkles, AlertCircle, User, Mic, Paperclip, Trash2 } from 'lucide-react';
import { HelpGuide } from '@/components/elements/HelpGuide';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { msg, getAI, getAIUI } from '@/core/messages';
import { getProviderDisplayName, getProviderIcon } from '../shared/utils';
import { useAuth } from '@/core/auth/AuthContext';
import { mediaService } from '@/components/media/services';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

interface AIChatProps {
    compact?: boolean;
}

export function AIChat({ compact = false }: AIChatProps = {}) {
    const { user } = useAuth();
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>(() => {
        if (compact && typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_chat_selected_provider');
            return saved || '';
        }
        return '';
    });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (compact && typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_chat_messages');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return Array.isArray(parsed) ? parsed.slice(-50) : [];
                } catch {
                    localStorage.removeItem('ai_chat_messages');
                    return [];
                }
            }
        }
        return [];
    });
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const providersFetched = useRef(false);

    const getAdminDisplayName = () => {
        if (user?.profile?.full_name) return user.profile.full_name;
        if (user?.full_name) return user.full_name;
        if (user?.profile?.first_name && user?.profile?.last_name) {
            return `${user.profile.first_name} ${user.profile.last_name}`;
        }
        return user?.email || 'ادمین';
    };

    const getAdminInitials = () => {
        const name = getAdminDisplayName();
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const getAdminProfileImageUrl = () => {
        if (user?.profile?.profile_picture?.file_url) {
            return mediaService.getMediaUrlFromObject(user.profile.profile_picture);
        }
        return null;
    };

    useEffect(() => {
        if (user && !providersFetched.current) {
            const hasAIPermission = user?.permissions?.some((p: string) => 
                p === 'all' || p === 'ai.manage' || p.startsWith('ai.')
            );
            
            if (hasAIPermission) {
                providersFetched.current = true;
                fetchAvailableProviders();
            } else {
                setLoadingProviders(false);
            }
        } else if (!user) {
            setLoadingProviders(true);
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (compact && typeof window !== 'undefined' && user) {
            if (messages.length > 0) {
                const messagesToSave = messages.slice(-50);
                const dataToSave = JSON.stringify(messagesToSave);
                
                if (dataToSave.length > 100000) {
                    const limited = messages.slice(-30);
                    localStorage.setItem('ai_chat_messages', JSON.stringify(limited));
                } else {
                    localStorage.setItem('ai_chat_messages', dataToSave);
                }
            } else {
                localStorage.removeItem('ai_chat_messages');
            }
        } else if (typeof window !== 'undefined' && !user) {
            localStorage.removeItem('ai_chat_messages');
            localStorage.removeItem('ai_chat_selected_provider');
        }
    }, [messages, user, compact]);

    useEffect(() => {
        if (compact && typeof window !== 'undefined' && selectedProvider && user) {
            localStorage.setItem('ai_chat_selected_provider', selectedProvider);
        }
    }, [selectedProvider, user, compact]);

    const handleClearChat = () => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ai_chat_messages');
            localStorage.removeItem('ai_chat_selected_provider');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            const response = await aiApi.chat.getAvailableProviders();
            
            if (response.metaData.status === 'success') {
                const providersData = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data as any)?.data || [];
                
                setAvailableProviders(providersData);
            }
        } catch (error: any) {
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleSend = async () => {
        if (!selectedProvider) {
            toast.error(msg.ai('selectModelWithInstructions'));
            return;
        }

        if (!message.trim()) {
            toast.error(msg.ai('enterMessage'));
            return;
        }

        const userMessage: ChatMessage = {
            role: 'user',
            content: message.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentMessage = message.trim();
        setMessage('');
        
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);

        try {
            setSending(true);

            const conversationHistory = messages
                .slice(-20)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));

            const response = await aiApi.chat.sendMessage({
                message: currentMessage,
                provider_name: selectedProvider,
                conversation_history: conversationHistory,
            });

            if (response.metaData.status === 'success') {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.data.reply,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(response.metaData.message || 'خطا در دریافت پاسخ');
            }
        } catch (error: any) {
            setMessages(prev => prev.filter((msg, idx) => 
                !(msg.role === 'user' && msg.content === currentMessage && idx === prev.length - 1)
            ));
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sending) {
                handleSend();
            }
        }
    };

    if (compact) {
        return (
            <div className="flex flex-col h-full relative">
                <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-br bg-bg/50">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-font-p">چت با AI</h3>
                        {loadingProviders ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <Select
                                value={selectedProvider || undefined}
                                onValueChange={setSelectedProvider}
                            >
                                <SelectTrigger className="w-auto min-w-[140px] border-0 bg-card hover:bg-bg shadow-sm px-3 py-1.5 h-8 text-xs">
                                    <SelectValue placeholder={msg.aiUI('selectModelPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProviders.length === 0 ? (
                                        <div className="p-2 text-sm text-font-s text-center">
                                            {getAIUI('noActiveProviders')}
                                        </div>
                                    ) : (
                                        availableProviders.map((provider) => (
                                            <SelectItem
                                                key={provider.id}
                                                value={provider.slug || provider.provider_name || String(provider.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getProviderIcon(provider)}</span>
                                                    <span>{provider.display_name || getProviderDisplayName(provider)}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    {messages.length > 0 && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClearChat}
                            className="h-7 w-7 border-0 hover:bg-bg text-font-s"
                            aria-label="پاک کردن چت"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

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
                                className={`flex items-start gap-2 ${
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
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
                                    className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${
                                        msg.role === 'user'
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

                <div className="flex-shrink-0 border-t border-br bg-card p-3">
                    <div className="relative w-full">
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="پیام خود را بنویسید..."
                            className="min-h-[44px] max-h-[120px] resize-none w-full border border-br bg-card pr-10 pl-12 rounded-lg text-xs py-2"
                            disabled={sending || !selectedProvider}
                        />
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <Button
                                onClick={handleSend}
                                disabled={sending || !message.trim() || !selectedProvider}
                                size="icon"
                                className="h-7 w-7 bg-primary hover:bg-primary/90 text-static-w rounded-lg"
                            >
                                {sending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Send className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2 px-1">
                        <p className="text-[10px] text-font-s text-center leading-relaxed">
                            💡 چت‌ها موقتاً در مرورگر ذخیره می‌شوند (حداکثر 50 پیام)
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
            <CardWithIcon
                icon={MessageSquare}
                title={
                    <div className="flex items-center gap-2">
                        <span>چت با AI</span>
                        <HelpGuide
                            title="راهنمای چت با AI"
                            content={`**چطور از چت با AI استفاده کنم؟**

1. ابتدا یک مدل AI را از منوی بالا انتخاب کنید
2. پیام خود را در کادر پایین تایپ کنید
3. Enter بزنید یا روی دکمه ارسال کلیک کنید
4. AI به شما پاسخ خواهد داد

**نکات مهم:**
• چت‌های این صفحه ذخیره نمی‌شوند
• برای ذخیره چت‌ها، از ویجت کنار صفحه استفاده کنید
• می‌توانید تا 20 پیام آخر را در یک مکالمه استفاده کنید`}
                            variant="badge"
                            position="bottom"
                        />
                    </div>
                }
                iconBgColor="bg-pink"
                iconColor="stroke-pink-2"
                borderColor="border-b-pink-1"
                className="flex flex-col h-full overflow-hidden"
                headerClassName="flex-shrink-0 border-b pb-3"
                contentClassName="!p-0 flex-1 flex flex-col overflow-hidden"
                titleExtra={
                    <div className="flex items-center gap-2">
                        {loadingProviders ? (
                            <Skeleton className="h-10 w-32" />
                        ) : (
                                <Select
                                    value={selectedProvider || undefined}
                                    onValueChange={setSelectedProvider}
                                >
                                    <SelectTrigger className="w-auto min-w-[140px] border-0 bg-bg hover:bg-bg/80 shadow-sm px-4 py-1.5">
                                        <SelectValue placeholder={getAIUI('selectModelPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProviders.length === 0 ? (
                                            <div className="p-2 text-sm text-font-s text-center">
                                                {getAIUI('noActiveProviders')}
                                            </div>
                                        ) : (
                                            availableProviders.map((provider) => (
                                                <SelectItem
                                                    key={provider.id}
                                                    value={provider.slug || provider.provider_name || String(provider.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{getProviderIcon(provider)}</span>
                                                        <span>{provider.display_name || getProviderDisplayName(provider)}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                        )}
                    </div>
                }
            >
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                        {messages.length > 0 && messages.length <= 5 && (
                            <div className="mb-4 p-3 bg-blue/10 border border-blue-1 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-1 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-font-s leading-relaxed">
                                            <strong className="text-blue-2">توجه:</strong> چت‌های شما به صورت موقت در مرورگر ذخیره می‌شوند (حداکثر 50 پیام). برای حفظ طولانی‌مدت، از دکمه پاک کردن استفاده نکنید.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-font-s">
                                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">{msg.aiUI('startConversation')}</p>
                                <p className="text-sm">
                                    {msg.aiUI('chatDescription')}
                                </p>
                                {availableProviders.length === 0 && (
                                    <div className="mt-4 p-3 bg-yellow border border-yellow-1 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-yellow mt-0.5">
                                                <AlertCircle className="h-4 w-4 stroke-yellow-1" />
                                            </div>
                                            <div className="text-sm text-yellow-2">
                                                <p className="font-medium mb-1">{getAIUI('noActiveProviders')}</p>
                                                <p>
                                                    {getAIUI('chatInstructionsFull')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 ${
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {msg.role === 'user' && (
                                        <Avatar className="flex-shrink-0 w-8 h-8 rounded-full">
                                            {getAdminProfileImageUrl() ? (
                                                <AvatarImage 
                                                    src={getAdminProfileImageUrl()!} 
                                                    alt={getAdminDisplayName()}
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <AvatarFallback className="bg-gray-2 text-static-w text-xs font-medium rounded-full">
                                                    {getAdminInitials()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            msg.role === 'user'
                                                ? 'bg-card text-font-p border'
                                                : 'bg-bg text-font-s'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 stroke-font-s" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {sending && (
                            <div className="flex items-center gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 stroke-font-s" />
                                </div>
                                <div className="bg-bg text-font-s rounded-lg px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">{getAIUI('responding')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                </div>
                <div className="flex-shrink-0 border-t bg-card px-6 pt-4 pb-0">
                    <div className="relative w-full">
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="پیام خود را بنویسید..."
                            className="min-h-[60px] max-h-[200px] resize-none w-full border bg-card pl-32 pr-4 rounded-lg shadow-sm py-4"
                            style={{ paddingTop: '18px', paddingBottom: '18px' }}
                            disabled={sending || !selectedProvider}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button
                                type="button"
                                className="flex items-center justify-center text-font-s hover:text-font-p transition-colors"
                                aria-label="میکروفون"
                            >
                                <Mic className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center text-font-s hover:text-font-p transition-colors"
                                aria-label="پیوست"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <Button
                                onClick={handleSend}
                                disabled={sending || !message.trim() || !selectedProvider}
                                className="bg-primary hover:bg-primary/90 text-static-w px-4 gap-2 rounded-lg"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>ارسال...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>ارسال</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    {availableProviders.length === 0 && (
                        <p className="text-xs text-font-s mt-2 text-center w-full">
                            {getAIUI('chatInstructions')}
                        </p>
                    )}
                    {compact && (
                        <div className="mt-3 px-1">
                            <p className="text-xs text-font-s text-center leading-relaxed">
                                💡 چت‌ها موقتاً در مرورگر ذخیره می‌شوند (حداکثر 50 پیام). برای حفظ طولانی‌مدت، از دکمه پاک کردن استفاده نکنید.
                            </p>
                        </div>
                    )}
                    {!compact && (
                        <div className="mt-3 px-1">
                            <p className="text-xs text-font-s text-center leading-relaxed">
                                ⚠️ چت‌های این صفحه ذخیره نمی‌شوند. برای ذخیره چت‌ها، از ویجت کنار صفحه استفاده کنید.
                            </p>
                        </div>
                    )}
                </div>
            </CardWithIcon>
        </div>
    );
}

