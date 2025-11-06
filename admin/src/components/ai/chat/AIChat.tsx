"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/elements/Card';
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
import { aiApi, AvailableProvider } from '@/api/ai/route';
import { Loader2, MessageSquare, Send, Sparkles, AlertCircle, User, Mic, Paperclip } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { msg } from '@/core/messages/message';
import { getProviderDisplayName, getProviderIcon } from '../shared/utils';
import { useAuth } from '@/core/auth/AuthContext';
import { mediaService } from '@/components/media/services';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export function AIChat() {
    const { user } = useAuth();
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        fetchAvailableProviders();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            // Toast already shown by aiApi
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

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto pb-0">
            <Card className="flex flex-col flex-1 flex-shrink-0 overflow-hidden hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
                <CardHeader className="flex-shrink-0 border-b pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                                <MessageSquare className="w-5 h-5 stroke-primary" />
                            </div>
                            <CardTitle>چت با AI</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {loadingProviders ? (
                                <Skeleton className="h-10 w-32" />
                            ) : (
                                <Select
                                    value={selectedProvider || undefined}
                                    onValueChange={setSelectedProvider}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder={msg.aiUI('selectModelPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProviders.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                {msg.aiUI('noActiveProviders')}
                                            </div>
                                        ) : (
                                            availableProviders.map((provider) => (
                                                <SelectItem
                                                    key={provider.id}
                                                    value={provider.provider_name}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{getProviderIcon(provider)}</span>
                                                        <span>مدل {getProviderDisplayName(provider)}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">{msg.aiUI('startConversation')}</p>
                                <p className="text-sm">
                                    {msg.aiUI('chatDescription')}
                                </p>
                                {availableProviders.length === 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-yellow-100 mt-0.5">
                                                <AlertCircle className="h-4 w-4 stroke-yellow-600" />
                                            </div>
                                            <div className="text-sm text-yellow-800">
                                                <p className="font-medium mb-1">{msg.aiUI('noActiveProviders')}</p>
                                                <p>
                                                    {msg.aiUI('chatInstructionsFull')}
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
                                    className={`flex gap-3 ${
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
                                                <AvatarFallback className="bg-slate-700 text-white text-xs font-medium rounded-full">
                                                    {getAdminInitials()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            msg.role === 'user'
                                                ? 'bg-card text-card-foreground border border-border'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 stroke-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {sending && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 stroke-muted-foreground" />
                                </div>
                                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">{msg.aiUI('responding')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>

                <CardFooter className="flex-shrink-0 border-t border-border bg-card px-6 pt-4 pb-0">
                    <div className="relative w-full">
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="پیام خود را بنویسید..."
                            className="min-h-[60px] max-h-[200px] resize-none w-full border-border bg-card pl-32 pr-4 rounded-lg shadow-sm py-4"
                            style={{ paddingTop: '18px', paddingBottom: '18px' }}
                            disabled={sending || !selectedProvider}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button
                                type="button"
                                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="میکروفون"
                            >
                                <Mic className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="پیوست"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <Button
                                onClick={handleSend}
                                disabled={sending || !message.trim() || !selectedProvider}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 gap-2 rounded-lg"
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
                        <p className="text-xs text-muted-foreground mt-2 text-center w-full">
                            {msg.aiUI('chatInstructions')}
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

