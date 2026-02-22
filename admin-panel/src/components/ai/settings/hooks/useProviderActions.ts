import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { showSuccess, notifyApiError } from '@/core/toast';
import { getCrud, getStatus, getAction } from '@/core/messages/ui';
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
  const [personalApiKeys, setPersonalApiKeys] = useState<Record<string, string>>({});
  const [sharedApiKeys, setSharedApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const loadedPersonalApiKeys = useMemo(() => {
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

  const loadedSharedApiKeys = useMemo(() => {
    if (!providers.length) return {};

    const keys: Record<string, string> = {};
    providers.forEach(provider => {
      const backendProvider = provider.backendProvider;
      if (backendProvider?.shared_api_key) {
        const apiKey = backendProvider.shared_api_key;
        if (apiKey && apiKey !== '***' && apiKey.trim() !== '') {
          keys[provider.id] = apiKey;
        }
      }
    });
    return keys;
  }, [providers]);

  useEffect(() => {
    if (Object.keys(loadedPersonalApiKeys).length === 0) return;

    setPersonalApiKeys(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(loadedPersonalApiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== '***') {
          if (prev[key] !== value) {
            updated[key] = value;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [loadedPersonalApiKeys]);

  useEffect(() => {
    if (Object.keys(loadedSharedApiKeys).length === 0) return;

    setSharedApiKeys(prev => {
      const updated = { ...prev };
      let hasChanges = false;

      Object.entries(loadedSharedApiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== '***') {
          if (prev[key] !== value) {
            updated[key] = value;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [loadedSharedApiKeys]);

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
    onSuccess: async (_response, variables) => {
      const { providerId, apiKey, useSharedApi } = variables;

      await queryClient.refetchQueries({ queryKey: ['ai-backend-providers'] });
      await queryClient.refetchQueries({ queryKey: ['ai-personal-settings'] });

      if (useSharedApi && isSuperAdmin) {
        if (apiKey.trim()) {
          setSharedApiKeys(prev => ({
            ...prev,
            [providerId]: apiKey
          }));
        } else {
          setSharedApiKeys(prev => {
            const newKeys = { ...prev };
            delete newKeys[providerId];
            return newKeys;
          });
        }
      } else {
        if (apiKey.trim()) {
          setPersonalApiKeys(prev => ({
            ...prev,
            [providerId]: apiKey
          }));
        } else {
          setPersonalApiKeys(prev => {
            const newKeys = { ...prev };
            delete newKeys[providerId];
            return newKeys;
          });
        }
      }

      if (apiKey.trim()) {
        showSuccess(getCrud('saved', { item: 'API key' }));
      } else {
        showSuccess(getCrud('deleted', { item: 'API key' }));
      }

      setShowApiKeys(prev => ({
        ...prev,
        [providerId]: false
      }));
    },
    onError: (error: unknown) => {
      notifyApiError(error, {
        fallbackMessage: getAction('apiKeySaveError'),
        dedupeKey: 'ai-provider-save-key',
      });
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
        use_shared_api: false,
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
    onSuccess: (_response, variables) => {
      const { providerId, isActive, useSharedApi } = variables;

      if (useSharedApi && isSuperAdmin) {
        queryClient.setQueryData(['ai-backend-providers'], (old: any) => {
          if (!old) return old;
          return old.map((p: any) => {
            const provider = providers.find(prov => prov.backendProvider?.id === p.id);
            if (provider?.id === providerId) {
              return { ...p, is_active: isActive };
            }
            return p;
          });
        });
      } else {
        queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
          if (!old) return old;
          const backendProviderName = frontendToBackendProviderMap[providerId];

          const exists = old.some((s: any) =>
            s.provider_name === backendProviderName || s.provider_slug === backendProviderName
          );

          if (exists) {
            return old.map((setting: any) => {
              if (setting.provider_name === backendProviderName || setting.provider_slug === backendProviderName) {
                return { ...setting, is_active: isActive };
              }
              return setting;
            });
          } else {
            return [...old, {
              provider_name: backendProviderName,
              provider_slug: backendProviderName,
              is_active: isActive,
              use_shared_api: false,
            }];
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccess(getCrud('updated', { item: 'وضعیت' }));
    },
    onError: (error: unknown) => {
      notifyApiError(error, {
        fallbackMessage: getStatus('statusChangeError'),
        dedupeKey: 'ai-provider-toggle-active',
      });
    },
  });

  const handleSaveProvider = useCallback((providerId: string, useSharedApi: boolean, apiKeyValue?: string) => {
    const apiKey = apiKeyValue !== undefined
      ? apiKeyValue
      : (useSharedApi ? (sharedApiKeys[providerId] || '') : (personalApiKeys[providerId] || ''));

    saveApiKeyMutation.mutate({
      providerId,
      apiKey: apiKey.trim(),
      useSharedApi,
    });
  }, [personalApiKeys, sharedApiKeys, saveApiKeyMutation, isSuperAdmin]);

  const handleToggleActive = useCallback((providerId: string, checked: boolean, useSharedApi: boolean) => {
    const finalUseSharedApi = isSuperAdmin ? useSharedApi : false;
    toggleActiveMutation.mutate({
      providerId,
      isActive: checked,
      useSharedApi: finalUseSharedApi,
    });
  }, [toggleActiveMutation, isSuperAdmin]);

  return {
    personalApiKeys,
    sharedApiKeys,
    setPersonalApiKeys,
    setSharedApiKeys,
    showApiKeys,
    setShowApiKeys,
    saveApiKeyMutation,
    toggleActiveMutation,
    handleSaveProvider,
    handleToggleActive,
  };
}
