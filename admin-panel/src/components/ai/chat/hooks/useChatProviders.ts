import { useState, useEffect, useRef } from 'react';
import { aiApi } from '@/api/ai/ai';
import type { AvailableProvider } from '@/types/ai/ai';

interface UseChatProvidersOptions {
    compact?: boolean;
    hasAIPermission?: boolean;
    userAuthenticated?: boolean;
}

export function useChatProviders({ hasAIPermission = false, userAuthenticated = false }: UseChatProvidersOptions) {
    const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_chat_selected_provider');
            return saved || '';
        }
        return '';
    });
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    
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
        if (typeof window !== 'undefined' && selectedProvider && userAuthenticated) {
            localStorage.setItem('ai_chat_selected_provider', selectedProvider);
        }
    }, [selectedProvider, userAuthenticated]);

    const fetchAvailableProviders = async () => {
        try {
            setLoadingProviders(true);
            const response = await aiApi.chat.getAvailableProviders();
            if (response.metaData.status === 'success') {
                const providersData = Array.isArray(response.data)
                    ? response.data
                    : (response.data as any)?.data || [];
                setAvailableProviders(providersData);

                if (providersData.length > 0) {
                    setSelectedProvider(prev => {
                        if (prev === 'gemini') {
                             const googleExists = providersData.some((p: any) => p.slug === 'google');
                             if (googleExists) return 'google';
                        }
                        
                        const isValid = providersData.some((p: any) => (p.slug || p.provider_name || String(p.id)) === prev);
                        if (!isValid) {
                            return providersData[0].slug || providersData[0].provider_name || String(providersData[0].id);
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
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

    const handleSetSelectedProvider = (val: string | ((prev: string) => string)) => {
        if (typeof val === 'function') {
            setSelectedProvider(prev => {
                const newState = val(prev);
                if (newState !== prev) setSelectedModel(null);
                return newState;
            });
        } else {
             if (val !== selectedProvider) setSelectedModel(null);
             setSelectedProvider(val);
        }
    };

    return {
        availableProviders,
        loadingProviders,
        selectedProvider,
        setSelectedProvider: handleSetSelectedProvider,
        selectedModel,
        setSelectedModel,
        showProviderDropdown,
        setShowProviderDropdown,
        selectedProviderData,
        clearProviderStorage,
    };
}
