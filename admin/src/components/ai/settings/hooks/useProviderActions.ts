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
          // همیشه آپدیت کن تا بعد از save هم درست بمونه
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
          // همیشه آپدیت کن تا بعد از save هم درست بمونه
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
    onSuccess: async (response, variables) => {
      const { providerId, apiKey, useSharedApi } = variables;
      const backendProviderName = frontendToBackendProviderMap[providerId];
      
      // CRITICAL: اول refetch کن تا داده واقعی از backend بیاد
      await queryClient.refetchQueries({ queryKey: ['ai-backend-providers'] });
      await queryClient.refetchQueries({ queryKey: ['ai-personal-settings'] });
      
      // بعد state رو آپدیت کن
      if (useSharedApi && isSuperAdmin) {
        if (apiKey.trim()) {
          setSharedApiKeys(prev => ({
            ...prev,
            [providerId]: apiKey
          }));
        } else {
          // اگر API key خالی است، از state حذف کن
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
          // اگر API key خالی است، از state حذف کن
          setPersonalApiKeys(prev => {
            const newKeys = { ...prev };
            delete newKeys[providerId];
            return newKeys;
          });
        }
      }
      
      if (apiKey.trim()) {
        showSuccess('API key با موفقیت ذخیره شد');
      } else {
        showSuccess('API key با موفقیت حذف شد');
      }
      
      setShowApiKeys(prev => ({
        ...prev,
        [providerId]: false
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

      // Super Admin می‌تواند وضعیت Provider را مستقیماً تغییر دهد
      if (isSuperAdmin && useSharedApi) {
        const backendProvider = providers.find(p => p.id === providerId)?.backendProvider;
        if (backendProvider?.id) {
          return await aiApi.image.toggleProvider(backendProvider.id, isActive);
        } else {
          throw new Error('Provider یافت نشد');
        }
      }

      // Normal Admin فقط می‌تواند تنظیمات شخصی خود را تغییر دهد
      const setting = personalSettingsMap[providerId];
      const data = {
        provider_name: backendProviderName,
        is_active: isActive,
        use_shared_api: false, // Normal Admin همیشه personal است
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
    onSuccess: (response, variables) => {
      const { providerId, isActive, useSharedApi } = variables;
      
      // Optimistic update بر اساس نوع API
      if (useSharedApi && isSuperAdmin) {
        // Super Admin با Shared API → آپدیت Provider اصلی
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
        // Personal API (برای هر دو Super و Normal Admin) → آپدیت Personal Settings
        queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
          if (!old) return old;
          const backendProviderName = frontendToBackendProviderMap[providerId];
          
          // اگه setting وجود داره، آپدیت کن
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
            // اگه setting وجود نداره، ایجاد کن
            return [...old, {
              provider_name: backendProviderName,
              provider_slug: backendProviderName,
              is_active: isActive,
              use_shared_api: false,
            }];
          }
        });
      }
      
      // Invalidate برای sync با backend
      queryClient.invalidateQueries({ queryKey: ['ai-backend-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccess('وضعیت با موفقیت تغییر کرد');
    },
    onError: (error: any) => {
      showError(error?.message || 'خطا در تغییر وضعیت');
    },
  });

  const handleSaveProvider = useCallback((providerId: string, useSharedApi: boolean, apiKeyValue?: string) => {
    // اگر apiKeyValue داده شده، از آن استفاده کن، وگرنه از state بخون
    const apiKey = apiKeyValue !== undefined 
      ? apiKeyValue 
      : (useSharedApi ? (sharedApiKeys[providerId] || '') : (personalApiKeys[providerId] || ''));
    
    // اگه API key خالیه، برای پاک کردن ارسال می‌کنیم
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
