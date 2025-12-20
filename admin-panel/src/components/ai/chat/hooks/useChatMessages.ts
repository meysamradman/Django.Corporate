import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

interface UseChatMessagesOptions {
    compact?: boolean;
    userAuthenticated?: boolean;
}

export function useChatMessages({ compact = false, userAuthenticated = false }: UseChatMessagesOptions) {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (compact && typeof window !== 'undefined' && userAuthenticated) {
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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (compact && typeof window !== 'undefined' && userAuthenticated) {
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
        } else if (typeof window !== 'undefined' && !userAuthenticated) {
            localStorage.removeItem('ai_chat_messages');
        }
    }, [messages, userAuthenticated, compact]);

    const addMessage = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    };

    const removeLastUserMessage = (content: string) => {
        setMessages(prev => prev.filter((msg, idx) =>
            !(msg.role === 'user' && msg.content === content && idx === prev.length - 1)
        ));
    };

    const clearMessages = () => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ai_chat_messages');
        }
    };

    return {
        messages,
        messagesEndRef,
        addMessage,
        removeLastUserMessage,
        clearMessages,
    };
}
