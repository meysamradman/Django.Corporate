"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Textarea } from '@/components/elements/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { aiApi, AvailableProvider } from '@/api/ai/route';
import { Loader2, MessageSquare, Send, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from '@/components/elements/Sonner';
import { Skeleton } from '@/components/elements/Skeleton';
import { msg } from '@/core/messages/message';
import { getProviderDisplayName } from '../shared/utils';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export function AIChat() {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleClearChat = () => {
        if (messages.length === 0) return;
        
        if (confirm(msg.aiUI('confirmClearChat'))) {
            setMessages([]);
            toast.success(msg.ai('chatCleared'));
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
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
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
                                                    {getProviderDisplayName(provider)}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            {messages.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleClearChat}
                                    title={msg.aiUI('clearChat')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                    {msg.role === 'assistant' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 stroke-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <span className="text-primary-foreground text-sm font-medium">
                                                شما
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {sending && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 stroke-primary" />
                                </div>
                                <div className="bg-muted rounded-lg px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm text-muted-foreground">{msg.aiUI('responding')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="flex-shrink-0 border-t p-4">
                        <div className="flex gap-2">
                            <Textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={msg.aiUI('messagePlaceholder')}
                                className="min-h-[60px] max-h-[200px] resize-none"
                                disabled={sending || !selectedProvider}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={sending || !message.trim() || !selectedProvider}
                                size="icon"
                                className="self-end"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {availableProviders.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                {msg.aiUI('chatInstructions')}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

