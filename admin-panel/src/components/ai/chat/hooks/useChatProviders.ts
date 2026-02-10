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

    console.log('🚀 [useChatProviders] Hook Init. UserAuthenticated:', userAuthenticated, 'HasPermissions:', hasAIPermission);

    useEffect(() => {
        console.log('🔄 [useChatProviders] useEffect. Auth:', userAuthenticated, 'Fetched:', providersFetched.current);
        if (userAuthenticated && !providersFetched.current) {
            if (hasAIPermission) {
                providersFetched.current = true;
                console.log('⚡ [useChatProviders] Calling fetchAvailableProviders...');
                fetchAvailableProviders();
            } else {
                console.warn('⛔ [useChatProviders] No permissions.');
                setLoadingProviders(false);
            }
        } else if (!userAuthenticated) {
            console.log('⏳ [useChatProviders] Waiting for auth...');
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
            console.log('🔍 [useChatProviders] Fetching available providers...');

            const response = await aiApi.chat.getAvailableProviders();
            console.log('📦 [useChatProviders] Response:', response);

            if (response.metaData.status === 'success') {
                const providersData = Array.isArray(response.data)
                    ? response.data
                    : (response.data as any)?.data || [];

                console.log('📋 [useChatProviders] Providers data:', providersData);
                setAvailableProviders(providersData);
            }
        } catch (error) {
            console.error('❌ [useChatProviders] Error fetching providers:', error);
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
