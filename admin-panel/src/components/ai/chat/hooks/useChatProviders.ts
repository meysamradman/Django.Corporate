import { useState, useEffect, useRef } from 'react';
import { aiApi } from '@/api/ai/ai';
import type { AvailableProvider } from '@/types/ai/ai';

interface UseChatProvidersOptions {
    compact?: boolean;
    hasAIPermission?: boolean;
    userAuthenticated?: boolean;
}

export function useChatProviders({ compact = false, hasAIPermission = false, userAuthenticated = false }: UseChatProvidersOptions) {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>(() => {
        if (compact && typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_chat_selected_provider');
            return saved || '';
        }
        return '';
    });
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const providersFetched = useRef(false);

    useEffect(() => {
        if (userAuthenticated && !providersFetched.current) {
            if (hasAIPermission) {
                providersFetched.current = true;
                fetchAvailableProviders();
            } else {
                setLoadingProviders(false);
            }
        } else if (!userAuthenticated) {
            setLoadingProviders(true);
        }
    }, [userAuthenticated, hasAIPermission]);

    useEffect(() => {
        if (compact && typeof window !== 'undefined' && selectedProvider && userAuthenticated) {
            localStorage.setItem('ai_chat_selected_provider', selectedProvider);
        }
    }, [selectedProvider, userAuthenticated, compact]);

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
        } catch {
          // Error handling is done by react-query
        } finally {
            setLoadingProviders(false);
        }
    };

    const clearProviderStorage = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ai_chat_selected_provider');
        }
    };

    const selectedProviderData = availableProviders.find(
        p => (p.slug || p.provider_name || String(p.id)) === selectedProvider
    );

    return {
        availableProviders,
        loadingProviders,
        selectedProvider,
        setSelectedProvider,
        showProviderDropdown,
        setShowProviderDropdown,
        selectedProviderData,
        clearProviderStorage,
    };
}
