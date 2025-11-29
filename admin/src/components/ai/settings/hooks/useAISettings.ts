import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { 
  PROVIDER_METADATA, 
  getProviderMetadata,
  BACKEND_TO_FRONTEND_ID,
  FRONTEND_TO_BACKEND_NAME 
} from '../config/providerConfig';

export interface Model {
  id: number;
  name: string;
  provider?: string;
  price: string;
  free: boolean;
  selected: boolean;
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  models: Model[];
  backendProvider?: any;
}

// ✅ استفاده از config مرکزی برای scalability
// همه mapping ها از providerConfig.ts می‌آیند

// Re-export برای backward compatibility
export const backendToFrontendIdMap = BACKEND_TO_FRONTEND_ID;
export const frontendToBackendProviderMap = FRONTEND_TO_BACKEND_NAME;

// Backend provider name → Frontend provider ID mapping (reverse)
export const backendToFrontendProviderMap: Record<string, string[]> = Object.entries(BACKEND_TO_FRONTEND_ID).reduce(
  (acc, [backend, frontend]) => {
    acc[backend] = [frontend];
    return acc;
  },
  {} as Record<string, string[]>
);

export function useAISettings() {
  const queryClient = useQueryClient();

  // ✅ دریافت provider ها از backend - بدون cache
  const { data: backendProviders, isLoading: isLoadingBackendProviders } = useQuery({
    queryKey: ['ai-backend-providers'],
    queryFn: async () => {
      const response = await aiApi.image.getProviders();
      return response.data || [];
    },
    staleTime: 0, // ✅ بدون cache - همیشه از سرور بگیر
  });

  // ✅ دریافت models (مدل‌های واقعی) از backend - بدون cache
  const { data: modelsData } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const response = await aiApi.models.getAll();
      return response.data || [];
    },
    staleTime: 0, // ✅ بدون cache - همیشه از سرور بگیر
  });

  // ✅ دریافت تنظیمات شخصی - بدون cache
  const { data: personalSettings } = useQuery({
    queryKey: ['ai-personal-settings'],
    queryFn: async () => {
      const response = await aiApi.personalSettings.getMySettings();
      return response.data || [];
    },
    staleTime: 0, // ✅ بدون cache - همیشه از سرور بگیر
  });

  // ساخت providers از backend data
  const providers = useMemo((): Provider[] => {
    // اگر backend data داریم، از اون استفاده کن
    if (backendProviders && backendProviders.length > 0) {
      const result: Provider[] = [];
      
      backendProviders.forEach((backendProvider: any) => {
        // ✅ نمایش همه provider ها (فیلتر حذف شد - فقط جستجو)
        
        const backendName = backendProvider.name; // ✅ backend response has 'name' field
        const backendSlug = backendProvider.slug; // slug for mapping
        const frontendId = backendToFrontendIdMap[backendName] || backendToFrontendIdMap[backendSlug] || backendSlug;
        const metadata = getProviderMetadata(frontendId);
        
        if (metadata) {
          // دریافت مدل‌های واقعی از models API
          const providerModels: Model[] = [];
          
          if (modelsData && Array.isArray(modelsData)) {
            // فیلتر کردن models بر اساس provider
            const filteredModels = modelsData.filter((model: any) => 
              model.provider === backendProvider.id || 
              model.provider_name === backendName
            );
            
            filteredModels.forEach((model: any, index: number) => {
              // ✅ نمایش همه model ها (فیلتر حذف شد)
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
    
    // Fallback: اگر backend data نداریم، از models استفاده کن
    const fallbackProviders: Provider[] = [];
    
    if (modelsData && Array.isArray(modelsData)) {
      // گروه‌بندی models بر اساس provider
      const modelsByProvider: Record<string, any[]> = {};
      
      modelsData.forEach((model: any) => {
        const providerName = model.provider_name || 'unknown';
        if (!modelsByProvider[providerName]) {
          modelsByProvider[providerName] = [];
        }
        modelsByProvider[providerName].push(model);
      });
      
      // ساخت provider برای هر گروه
      Object.entries(modelsByProvider).forEach(([backendName, models]) => {
        const frontendId = BACKEND_TO_FRONTEND_ID[backendName] || backendName;
        const metadata = getProviderMetadata(frontendId);
        
        if (metadata) {
          const providerModels: Model[] = models.map((model: any, index: number) => ({
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

  // Map تنظیمات شخصی به provider
  const personalSettingsMap = useMemo(() => {
    const map: Record<string, { id?: number; use_shared_api: boolean; api_key?: string; backend_name?: string; is_active?: boolean }> = {};
    if (personalSettings) {
      personalSettings.forEach((setting: any) => {
        // ✅ استفاده از provider_slug برای match کردن (بهتر از provider_name)
        const backendProviderSlug = setting.provider_slug || setting.provider_name;
        // برای هر backend provider slug/name، frontend provider ID های مربوطه رو پیدا کن
        const frontendIds = backendToFrontendProviderMap[backendProviderSlug] || [];
        
        // اگر frontend ID پیدا نشد، از backend slug/name استفاده کن
        if (frontendIds.length === 0) {
          frontendIds.push(backendProviderSlug);
        }
        
        frontendIds.forEach((frontendId) => {
          map[frontendId] = {
            id: setting.id,
            use_shared_api: setting.use_shared_api ?? true,
            api_key: setting.api_key,
            backend_name: backendProviderSlug,
            is_active: setting.is_active ?? false,
          };
        });
      });
    }
    return map;
  }, [personalSettings]);

  // Mutation برای تغییر use_shared_api
  const toggleUseSharedApiMutation = useMutation({
    mutationFn: async ({ providerId, useSharedApi }: { providerId: string; useSharedApi: boolean }) => {
      const setting = personalSettingsMap[providerId];
      
      // Map frontend provider ID به backend provider name
      const backendProviderName = frontendToBackendProviderMap[providerId];
      if (!backendProviderName) {
        throw new Error(`Provider '${providerId}' در backend پشتیبانی نمی‌شود`);
      }
      
      const data = {
        provider_name: backendProviderName,
        use_shared_api: useSharedApi,
        is_active: true,
      };

      // اگر تنظیمات شخصی برای این backend provider وجود داره، update کن
      if (setting?.id) {
        // Update existing
        return await aiApi.personalSettings.saveMySettings({
          id: setting.id,
          ...data,
        });
      } else {
        // Create new
        return await aiApi.personalSettings.saveMySettings(data);
      }
    },
    onSuccess: (_, variables) => {
      // ✅ Optimistic Update: فوراً state رو به‌روز کن
      queryClient.setQueryData(['ai-personal-settings'], (old: any) => {
        if (!old) return old;
        return old.map((setting: any) => {
          if (setting.provider_name === frontendToBackendProviderMap[variables.providerId]) {
            return { ...setting, use_shared_api: variables.useSharedApi };
          }
          return setting;
        });
      });
      
      // سپس refetch کن (برای اطمینان)
      queryClient.invalidateQueries({ queryKey: ['ai-personal-settings'] });
      showSuccessToast('تنظیمات با موفقیت به‌روزرسانی شد');
    },
    onError: (error: any) => {
      showErrorToast(error?.message || 'خطا در به‌روزرسانی تنظیمات');
    },
  });

  // بررسی اینکه آیا از API مشترک استفاده می‌کنه یا نه
  const getUseSharedApi = (providerId: string): boolean => {
    const setting = personalSettingsMap[providerId];
    // اگر تنظیمات نداره، پیش‌فرض: استفاده از API مشترک (true)
    if (!setting) {
      return true;
    }
    return setting.use_shared_api ?? true;
  };

  // ✅ REMOVED: Global Control - Backend doesn't have this endpoint yet
  // When backend implements it, restore these queries

  return {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
    getUseSharedApi,
    // ✅ REMOVED: Global Control exports - not available yet
  };
}

