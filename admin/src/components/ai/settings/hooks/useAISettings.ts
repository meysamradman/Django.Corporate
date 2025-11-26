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

  // دریافت provider ها از backend
  const { data: backendProviders, isLoading: isLoadingBackendProviders } = useQuery({
    queryKey: ['ai-backend-providers'],
    queryFn: async () => {
      const response = await aiApi.image.getProviders();
      return response.data || [];
    },
    staleTime: 0,
  });

  // دریافت capabilities (مدل‌های واقعی) از backend
  const { data: capabilitiesData } = useQuery({
    queryKey: ['ai-capabilities'],
    queryFn: async () => {
      const response = await aiApi.capabilities.getCapabilities(undefined, 'content');
      return response.data || {};
    },
    staleTime: 5 * 60 * 1000, // 5 دقیقه cache
  });

  // دریافت تنظیمات شخصی
  const { data: personalSettings } = useQuery({
    queryKey: ['ai-personal-settings'],
    queryFn: async () => {
      const response = await aiApi.personalSettings.getMySettings();
      return response.data || [];
    },
    staleTime: 0,
  });

  // ساخت providers از backend data
  const providers = useMemo((): Provider[] => {
    // اگر backend data داریم، از اون استفاده کن
    if (backendProviders && backendProviders.length > 0) {
      const result: Provider[] = [];
      
      backendProviders.forEach((backendProvider: any) => {
        const backendName = backendProvider.provider_name;
        const frontendId = backendToFrontendIdMap[backendName] || backendName;
        const metadata = getProviderMetadata(frontendId);
        
        if (metadata) {
          // دریافت مدل‌های واقعی از capabilities
          const providerCaps = capabilitiesData?.[backendName];
          const models: Model[] = [];
          
          if (providerCaps && providerCaps.models) {
            // برای هر نوع مدل (chat, content, image)
            const allModels = new Set<string>();
            
            // مدل‌های chat
            if (Array.isArray(providerCaps.models.chat)) {
              providerCaps.models.chat.forEach((modelName: string) => {
                allModels.add(modelName);
              });
            }
            
            // مدل‌های content
            if (Array.isArray(providerCaps.models.content)) {
              providerCaps.models.content.forEach((modelName: string) => {
                allModels.add(modelName);
              });
            }
            
            // مدل‌های image
            if (Array.isArray(providerCaps.models.image)) {
              providerCaps.models.image.forEach((modelName: string) => {
                allModels.add(modelName);
              });
            }
            
            // تبدیل به Model[]
            let modelId = 1;
            allModels.forEach((modelName) => {
              models.push({
                id: modelId++,
                name: modelName,
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
            models: models,
            backendProvider: backendProvider,
          });
        }
      });
      
      return result;
    }
    
    // Fallback: اگر backend data نداریم، از capabilities استفاده کن
    const fallbackProviders: Provider[] = [];
    
    if (capabilitiesData) {
      Object.entries(capabilitiesData).forEach(([backendName, caps]: [string, any]) => {
        const frontendId = BACKEND_TO_FRONTEND_ID[backendName] || backendName;
        const metadata = getProviderMetadata(frontendId);
        
        if (metadata && caps && caps.models) {
          const models: Model[] = [];
          const allModels = new Set<string>();
          
          // جمع‌آوری همه مدل‌ها
          if (Array.isArray(caps.models.chat)) {
            caps.models.chat.forEach((m: string) => allModels.add(m));
          }
          if (Array.isArray(caps.models.content)) {
            caps.models.content.forEach((m: string) => allModels.add(m));
          }
          if (Array.isArray(caps.models.image)) {
            caps.models.image.forEach((m: string) => allModels.add(m));
          }
          
          let modelId = 1;
          allModels.forEach((modelName) => {
            models.push({
              id: modelId++,
              name: modelName,
              provider: backendName,
              price: 'N/A',
              free: false,
              selected: false,
            });
          });
          
          fallbackProviders.push({
            id: frontendId,
            name: metadata.name,
            icon: metadata.icon,
            description: metadata.description,
            apiKeyLabel: metadata.apiKeyLabel,
            models: models,
          });
        }
      });
    }
  
    return fallbackProviders;
  }, [backendProviders, capabilitiesData]);

  // Map تنظیمات شخصی به provider
  const personalSettingsMap = useMemo(() => {
    const map: Record<string, { id?: number; use_shared_api: boolean; api_key?: string; backend_name?: string; is_active?: boolean }> = {};
    if (personalSettings) {
      personalSettings.forEach((setting: any) => {
        const backendProviderName = setting.provider_name;
        // برای هر backend provider name، frontend provider ID های مربوطه رو پیدا کن
        const frontendIds = backendToFrontendProviderMap[backendProviderName] || [];
        
        // اگر frontend ID پیدا نشد، از backend name استفاده کن
        if (frontendIds.length === 0) {
          frontendIds.push(backendProviderName);
        }
        
        frontendIds.forEach((frontendId) => {
          map[frontendId] = {
            id: setting.id,
            use_shared_api: setting.use_shared_api ?? true,
            api_key: setting.api_key,
            backend_name: backendProviderName,
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
    onSuccess: () => {
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

  return {
    providers,
    personalSettingsMap,
    isLoadingBackendProviders,
    toggleUseSharedApiMutation,
    getUseSharedApi,
  };
}

