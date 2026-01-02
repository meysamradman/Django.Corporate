import { useState, useRef, type RefObject, type KeyboardEvent, type ChangeEvent } from 'react';
import { aiApi } from '@/api/ai/ai';
import { showError, showSuccess, showInfo } from '@/core/toast';

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
    textareaRef: RefObject<HTMLTextAreaElement | null>;
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
            showError('لطفاً ابتدا یک مدل AI انتخاب کنید');
            return;
        }

        if (!message.trim()) {
            showError('لطفاً پیام خود را وارد کنید');
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
                file: attachedFile,
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
            removeLastUserMessage(currentMessage);

            let errorMessage = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';

            if (error?.response?.message) {
                errorMessage = error.response.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            showError(errorMessage);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showError('حجم فایل نباید بیشتر از 10 مگابایت باشد');
                return;
            }
            setAttachedFile(file);
            showSuccess(`فایل ${file.name} آماده ارسال است`);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachedFile = () => {
        setAttachedFile(null);
        showInfo('فایل حذف شد');
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
