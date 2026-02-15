import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { showSuccess, showError } from '@/core/toast';
import { usePermission, PERMISSIONS } from '@/core/permissions';
import type { AISettingsModel, AISettingsProvider } from '@/types/ai/ai';
import {
  getProviderMetadata,
  BACKEND_TO_FRONTEND_ID,
  FRONTEND_TO_BACKEND_NAME
} from '../config/providerConfig';

export const backendToFrontendIdMap = BACKEND_TO_FRONTEND_ID;
export const frontendToBackendProviderMap = FRONTEND_TO_BACKEND_NAME;

export const backendToFrontendProviderMap: Record<string, string[]> = Object.entries(BACKEND_TO_FRONTEND_ID).reduce(
  (acc, [backend, frontend]) => {
    acc[backend] = [frontend];
    return acc;
  },
  {} as Record<string, string[]>
);

export function useAISettings() {
  const queryClient = useQueryClient();
  const { hasPermission, isLoading: isPermissionLoading } = usePermission();
  const canLoadModels = hasPermission(PERMISSIONS.AI.MODELS_MANAGE);
  const { data: backendProviders, isLoading: isLoadingBackendProviders } = useQuery({
    queryKey: ['ai-backend-providers'],
    queryFn: async () => {
      const response = await aiApi.image.getProviders();
      return response.data || [];
    },
    staleTime: 0,
  });

  const { data: modelsData } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const response = await aiApi.models.getAll();
      return response.data || [];
    },
    staleTime: 0,
    enabled: !isPermissionLoading && canLoadModels,
  });

  const { data: personalSettings } = useQuery({
    queryKey: ['ai-personal-settings'],
    queryFn: async () => {
      const response = await aiApi.personalSettings.getMySettings();
      return response.data || [];
    },
    staleTime: 0,
  });

  const providers = useMemo((): AISettingsProvider[] => {
    if (backendProviders && backendProviders.length > 0) {
      const result: AISettingsProvider[] = [];

      backendProviders.forEach((backendProvider: any) => {

        const backendName = backendProvider.name;
        const backendSlug = backendProvider.slug;
        const frontendId = backendToFrontendIdMap[backendName] || backendToFrontendIdMap[backendSlug] || backendSlug;
        const metadata = getProviderMetadata(frontendId);

        if (metadata) {
          const providerModels: AISettingsModel[] = [];

          if (modelsData && Array.isArray(modelsData)) {
            const filteredModels = modelsData.filter((model: any) =>
              model.provider === backendProvider.id ||
              model.provider_name === backendName
            );

            filteredModels.forEach((model: any, index: number) => {
              providerModels.push({
                id: model.id || index + 1,
                name: model.model_name || model.name,
                provider: backendName,
                price: 'N/A',
                free: false,
                selected: false,
              });
            });
          }

          result.push({
            id: frontendId,
            name: metadata.name,
            icon: metadata.icon,
            description: metadata.description,
            apiKeyLabel: metadata.apiKeyLabel,
            models: providerModels,
            backendProvider: backendProvider,
          });
        }
      });

      return result;
    }

    const fallbackProviders: AISettingsProvider[] = [];

    if (modelsData && Array.isArray(modelsData)) {
      const modelsByProvider: Record<string, any[]> = {};

      modelsData.forEach((model: any) => {
        const providerName = model.provider_name || 'unknown';
        if (!modelsByProvider[providerName]) {
          modelsByProvider[providerName] = [];
        }
        modelsByProvider[providerName].push(model);
      });

      Object.entries(modelsByProvider).forEach(([backendName, models]) => {
        const frontendId = BACKEND_TO_FRONTEND_ID[backendName] || backendName;
        const metadata = getProviderMetadata(frontendId);

        if (metadata) {
          const providerModels: AISettingsModel[] = models.map((model: any, index: number) => ({
            id: model.id || index + 1,
            name: model.model_name || model.name,
            provider: backendName,
            price: 'N/A',
            free: false,
            selected: false,
          }));

          fallbackProviders.push({
            id: frontendId,
            name: metadata.name,
            icon: metadata.icon,
            description: metadata.description,
            apiKeyLabel: metadata.apiKeyLabel,
            models: providerModels,
          });
        }
      });
    }

    return fallbackProviders;
  }, [backendProviders, modelsData]);

  const personalSettingsMap = useMemo(() => {
    const map: Record<string, { id?: number; use_shared_api: boolean; api_key?: string; backend_name?: string; is_active?: boolean }> = {};
    if (personalSettings) {
      personalSettings.forEach((setting: any) => {
        const backendProviderSlug = setting.provider_slug || setting.provider_name;
        const frontendIds = backendToFrontendProviderMap[backendProviderSlug] || [];

        if (frontendIds.length === 0) {
          frontendIds.push(backendProviderSlug);
        }

        frontendIds.forEach((frontendId) => {
          map[frontendId] = {
            id: setting.id,
            use_shared_api: setting.use_shared_api ?? false,
            api_key: setting.personal_api_key_value || '',
            backend_name: backendProviderSlug,
            is_active: setting.is_active ?? false,
          };
        });
      });
    }
    return map;
  }, [personalSettings]);

  const toggleUseSharedApiMutation = useMutation({
    mutationFn: async ({ providerId, useSharedApi }: { providerId: string; useSharedApi: boolean }) => {
      const setting = personalSettingsMap[providerId];

      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }

      const data = {
        provider_name: backendProviderName,
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
      queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
        if (!old) return old;
        return old.map((setting: any) => {
          if (setting.provider_name === frontendToBackendProviderMap[variables.providerId]) {
            return { ...setting, use_shared_api: variables.useSharedApi };
          }
          return setting;
        });
      });

      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccess('تنظیمات با موفقیت به‌روزرسانی شد');
    },
    onError: (error: any) => {
      showError(error?.message || 'خطا در به‌روزرسانی تنظیمات');
    },
  });

  const getUseSharedApi = (providerId: string): boolean => {
    const setting = personalSettingsMap[providerId];
    if (!setting) {
      return false;
    }
    return setting.use_shared_api ?? false;
  };

  return {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
    getUseSharedApi,
  };
}

