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
import { Loader2, MessageSquare, Send, Sparkles, AlertCircle, User, Paperclip, Trash2, ChevronDown, Check, Lock, X } from 'lucide-react';
import { HelpGuide } from '@/components/elements/HelpGuide';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { msg, getAI, getAIUI } from '@/core/messages';
import { getProviderDisplayName, getProviderIcon } from '../shared/utils';
import { EmptyProvidersCard } from '../shared';
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
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const providersFetched = useRef(false);
    const providerDropdownRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setShowProviderDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            console.log('🔍 [AI Chat] درخواست Available Providers...');
            
            const response = await aiApi.chat.getAvailableProviders();
            console.log('✅ [AI Chat] پاسخ Available Providers:', {
                status: response.metaData.status,
                total: Array.isArray(response.data) ? response.data.length : 0,
                providers: Array.isArray(response.data) 
                    ? response.data.map((p: any) => ({
                        provider_name: p.provider_name || p.name,
                        models_count: p.models?.length || 0,
                        models: p.models?.slice(0, 3).map((m: any) => m.model_name || m.name)
                    }))
                    : []
            });

            if (response.metaData.status === 'success') {
                const providersData = Array.isArray(response.data)
                    ? response.data
                    : (response.data as any)?.data || [];

                setAvailableProviders(providersData);
            }
        } catch (error: any) {
            console.error('❌ [AI Chat] خطا در Available Providers:', error);
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleSend = async () => {
        if (!selectedProvider) {
            toast.error('لطفاً ابتدا یک مدل AI انتخاب کنید');
            return;
        }

        if (!message.trim()) {
            toast.error('لطفاً پیام خود را وارد کنید');
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

            if (response.metaData.status === 'success' && response.data?.reply) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.data.reply,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                
                // Success toast with generation time
                const genTime = response.data.generation_time_ms;
                if (genTime) {
                    toast.success(`پاسخ در ${(genTime / 1000).toFixed(1)} ثانیه تولید شد`);
                }
            } else {
                throw new Error(response.metaData.message || 'خطا در دریافت پاسخ از AI');
            }
        } catch (error: any) {
            // Remove user message on error
            setMessages(prev => prev.filter((msg, idx) =>
                !(msg.role === 'user' && msg.content === currentMessage && idx === prev.length - 1)
            ));
            
            // Extract error message from ApiError structure
            let errorMessage = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
            
            if (error?.response?.message) {
                // ApiError structure
                errorMessage = error.response.message;
            } else if (error?.message) {
                // Standard Error
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
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

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // بررسی حجم فایل (مثلاً حداکثر 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                toast.error('حجم فایل نباید بیشتر از 10 مگابایت باشد');
                return;
            }
            setAttachedFile(file);
            toast.success(`فایل ${file.name} آماده ارسال است`);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachedFile = () => {
        setAttachedFile(null);
        toast.info('فایل حذف شد');
    };

    if (!loadingProviders && availableProviders.length === 0) {
        return <EmptyProvidersCard type="chat" />;
    }

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
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs font-medium">{provider.display_name || getProviderDisplayName(provider)}</span>
                                                        {provider.slug && (
                                                            <span className="text-[10px] text-font-s opacity-70">({provider.slug})</span>
                                                        )}
                                                    </div>
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

    const selectedProviderData = availableProviders.find(
        p => (p.slug || p.provider_name || String(p.id)) === selectedProvider
    );

    return (
        <div className="relative flex flex-col h-full">
            {/* Chat Messages Area */}
            <div className={`flex-1 ${
                messages.length === 0 ? '' : 'overflow-y-auto'
            }`}>
                <div className={`${
                    messages.length === 0 
                        ? 'h-full flex flex-col justify-center items-center px-4' 
                        : 'pt-8 pb-[200px]'
                }`}>
                    {/* Empty State - Centered */}
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

                    {/* Messages - Regular Flow */}
                    {messages.length > 0 && (
                        <div className="max-w-4xl mx-auto w-full px-4">
                            {/* Info Alert - Only show for first 5 messages */}
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

                            {/* Messages List */}
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

                            {/* Loading State */}
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
                    
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - Sticky when messages exist, centered when empty */}
            <div className={`${
                messages.length > 0 
                    ? 'sticky bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm' 
                    : 'sticky bottom-0 left-0 right-0 bg-transparent'
            } z-10`}>
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="bg-card rounded-2xl shadow-lg border border-br p-4">
                        {/* Textarea for message input */}
                        <div className="relative">
                            {/* Attached File Preview */}
                            {attachedFile && (
                                <div className="mb-2 p-2 bg-bg rounded-lg border border-br flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-font-s" />
                                        <span className="text-sm text-font-p">{attachedFile.name}</span>
                                        <span className="text-xs text-font-s">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeAttachedFile}
                                        className="p-1 hover:bg-card rounded transition-colors"
                                    >
                                        <X className="h-4 w-4 text-font-s" />
                                    </button>
                                </div>
                            )}
                            
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="پیام..."
                                rows={1}
                                disabled={sending || !selectedProvider}
                                className="w-full px-4 py-3 resize-none focus:outline-none text-base text-font-p placeholder-font-s bg-transparent overflow-hidden rounded-lg"
                                style={{
                                    minHeight: '24px',
                                    maxHeight: '200px',
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                            />
                            
                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Bottom controls */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-br">
                            {/* Left side - Provider dropdown */}
                            <div className="relative" ref={providerDropdownRef}>
                                {loadingProviders ? (
                                    <Skeleton className="h-9 w-32 rounded-full" />
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                                            disabled={!availableProviders.length}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray hover:bg-bg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {selectedProviderData && (
                                                <span className="text-lg">{getProviderIcon(selectedProviderData)}</span>
                                            )}
                                            <span className="text-sm font-medium text-font-p">
                                                {selectedProviderData
                                                    ? (selectedProviderData.display_name || getProviderDisplayName(selectedProviderData))
                                                    : getAIUI('selectModelPlaceholder')}
                                            </span>
                                            <ChevronDown className="h-4 w-4 text-font-s" />
                                        </button>

                                        {/* Provider Dropdown */}
                                        {showProviderDropdown && (
                                            <div className="absolute bottom-full right-0 mb-2 w-80 bg-card rounded-xl shadow-xl border border-br py-2 z-50 max-h-96 overflow-y-auto">
                                                {availableProviders.length === 0 ? (
                                                    <div className="p-4 text-sm text-font-s text-center">
                                                        {getAIUI('noActiveProviders')}
                                                    </div>
                                                ) : (
                                                    availableProviders.map((provider) => {
                                                        const isSelected = (provider.slug || provider.provider_name || String(provider.id)) === selectedProvider;
                                                        return (
                                                            <button
                                                                key={provider.id}
                                                                onClick={() => {
                                                                    setSelectedProvider(provider.slug || provider.provider_name || String(provider.id));
                                                                    setShowProviderDropdown(false);
                                                                }}
                                                                className="w-full px-4 py-3 text-right hover:bg-bg flex items-center justify-between transition-colors group"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <span className="text-lg">{getProviderIcon(provider)}</span>
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-sm font-medium text-font-p">
                                                                            {provider.display_name || getProviderDisplayName(provider)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check className="h-4 w-4 text-blue-1" />
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Right side - File Upload icon */}
                            <div className="flex items-center gap-2">
                                {/* Paperclip Icon - File Upload */}
                                <button
                                    type="button"
                                    onClick={handleFileUpload}
                                    className="p-2.5 text-font-s hover:text-font-p hover:bg-bg rounded-full transition-colors"
                                    aria-label="آپلود فایل"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

