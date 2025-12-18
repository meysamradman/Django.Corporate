import { useState, useRef } from 'react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

interface UseChatHandlersOptions {
    selectedProvider: string;
    messages: ChatMessage[];
    addMessage: (message: ChatMessage) => void;
    removeLastUserMessage: (content: string) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useChatHandlers({
    selectedProvider,
    messages,
    addMessage,
    removeLastUserMessage,
    textareaRef,
}: UseChatHandlersOptions) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        addMessage(userMessage);
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
                addMessage(assistantMessage);
            } else {
                throw new Error(response.metaData.message || 'خطا در دریافت پاسخ از AI');
            }
        } catch (error: any) {
            // Remove user message on error
            removeLastUserMessage(currentMessage);
            
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

    return {
        message,
        setMessage,
        sending,
        attachedFile,
        fileInputRef,
        handleSend,
        handleKeyPress,
        handleFileUpload,
        handleFileChange,
        removeAttachedFile,
    };
}
