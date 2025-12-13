"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';
import { frontendToBackendProviderMap } from '../hooks/useAISettings';

interface UseProviderActionsProps {
  providers: any[];
  personalSettingsMap: Record<string, any>;
  isSuperAdmin: boolean;
}

export function useProviderActions({
  providers,
  personalSettingsMap,
  isSuperAdmin,
}: UseProviderActionsProps) {
  const queryClient = useQueryClient();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const loadedApiKeys = useMemo(() => {
    if (!providers.length) return {};

    const keys: Record<string, string> = {};
    providers.forEach(provider => {
      const setting = personalSettingsMap[provider.id];
      if (setting?.api_key) {
        const apiKey = setting.api_key;
        if (apiKey && apiKey !== '***' && apiKey.trim() !== '') {
          keys[provider.id] = apiKey;
        }
      }
    });
    return keys;
  }, [providers, personalSettingsMap]);

  useEffect(() => {
    if (Object.keys(loadedApiKeys).length === 0) return;

    setApiKeys(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(loadedApiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== '***') {
          if (!prev[key] || prev[key].trim() === '' || prev[key] === '***') {
            updated[key] = value;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [loadedApiKeys]);

  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ providerId, apiKey, useSharedApi }: { providerId: string; apiKey: string; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.saveProvider({
            id: backendProvider.id,
            provider_name: backendProviderName,
            shared_api_key: apiKey,
            is_active: true,
          });
        } else {
          return await aiApi.image.saveProvider({
            provider_name: backendProviderName,
            shared_api_key: apiKey,
            is_active: true,
          });
        }
      }

      const setting = personalSettingsMap[providerId];
      const data = {
        provider_name: backendProviderName,
        api_key: apiKey,
        use_shared_api: useSharedApi,
        is_active: true,
      };

      if (setting?.id) {
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccess('API key با موفقیت ذخیره شد');
      setApiKeys(prev => ({
        ...prev,
        [variables.providerId]: variables.apiKey
      }));
      setShowApiKeys(prev => ({
        ...prev,
        [variables.providerId]: false
      }));
    },
    onError: (error: any) => {
      showError(error?.message || 'خطا در ذخیره API key');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ providerId, isActive, useSharedApi }: { providerId: string; isActive: boolean; useSharedApi: boolean }) => {
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.toggleProvider(backendProvider.id, isActive);
        } else {
          throw new Error('Provider یافت نشد');
        }
      }

      const setting = personalSettingsMap[providerId];
      const data = {
        provider_name: backendProviderName,
        is_active: isActive,
        use_shared_api: useSharedApi,
      };

      if (setting?.id) {
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccess('وضعیت با موفقیت تغییر کرد');
    },
    onError: (error: any) => {
      showError(error?.message || 'خطا در تغییر وضعیت');
    },
  });

  const handleSaveProvider = useCallback((providerId: string) => {
    const apiKey = apiKeys[providerId] || '';
    const setting = personalSettingsMap[providerId];
    const useSharedApi = setting?.use_shared_api ?? false;

    if (!useSharedApi && !apiKey.trim()) {
      showError('لطفاً API key را وارد کنید');
      return;
    }

    saveApiKeyMutation.mutate({
      providerId,
      apiKey: apiKey.trim(),
      useSharedApi,
    });
  }, [apiKeys, personalSettingsMap, saveApiKeyMutation]);

  const handleToggleActive = useCallback((providerId: string, checked: boolean, useSharedApi: boolean) => {
    const finalUseSharedApi = isSuperAdmin ? useSharedApi : false;
    toggleActiveMutation.mutate({
      providerId,
      isActive: checked,
      useSharedApi: finalUseSharedApi,
    });
  }, [toggleActiveMutation, isSuperAdmin]);

  return {
    apiKeys,
    setApiKeys,
    showApiKeys,
    setShowApiKeys,
    saveApiKeyMutation,
    toggleActiveMutation,
    handleSaveProvider,
    handleToggleActive,
  };
}
