"use client";

import { useState, useEffect } from 'react';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';

export interface ModelData {
  id: string;
  name: string;
  provider?: string;
  price?: string;
  free?: boolean;
  category?: 'chat' | 'image' | 'audio' | 'content';
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: number;
    completion?: number;
  };
}

interface UseModelSelectionProps {
  providerId: string;
  providerName?: string; // اختیاری - برای OpenRouter لازمه
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSuccess?: () => void;
  mode?: 'simple' | 'full'; // simple: فقط provider_id | full: با تمام اطلاعات مدل
}

export function useModelSelection({
  providerId,
  providerName,
  capability,
  onSuccess,
  mode = 'simple'
}: UseModelSelectionProps) {
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set());
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [modelDataMap, setModelDataMap] = useState<Map<string, ModelData>>(new Map()); // برای ذخیره اطلاعات کامل مدل‌ها

  // دریافت مدل‌های فعال
  const fetchActiveModels = async () => {
    try {
      const response = await aiApi.models.getAll();
      if (response.metaData.status === 'success' && response.data) {
        const models = Array.isArray(response.data) ? response.data : [];
        const activeModelIds = new Set(
          models
            .filter((m: any) => m.is_active && m.capabilities?.includes(capability))
            .map((m: any) => m.model_id)
        );
        setActiveModels(activeModelIds);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت مدل‌های فعال:', error);
    }
  };

  useEffect(() => {
    fetchActiveModels();
  }, [capability]);

  // تغییر وضعیت مدل
  const handleToggleModel = async (modelId: string, modelData?: ModelData) => {
    const isCurrentlyActive = activeModels.has(modelId);
    
    try {
      setSavingModelId(modelId);

      if (isCurrentlyActive) {
        // غیرفعال کردن مدل - به‌روزرسانی is_active به false
        const response = await aiApi.models.getAll();
        if (response.metaData.status === 'success' && response.data) {
          const models = Array.isArray(response.data) ? response.data : [];
          const existingModel = models.find(
            (m: any) => m.model_id === modelId && m.capabilities?.includes(capability)
          );

          if (existingModel?.id) {
            await aiApi.models.update(existingModel.id, { is_active: false });
            setActiveModels(prev => {
              const newSet = new Set(prev);
              newSet.delete(modelId);
              return newSet;
            });
            showSuccess('مدل با موفقیت غیرفعال شد');
          }
        }
      } else {
        // فعال کردن مدل - ابتدا مدل قبلی رو غیرفعال کن
        if (mode === 'full') {
          // برای OpenRouter: ابتدا همه مدل‌های فعال برای این provider+capability رو غیرفعال کن
          try {
            const providersResponse = await aiApi.providers.getAll();
            const providers = providersResponse.data || [];
            const targetProvider = providers.find((p: any) =>
              p.name.toLowerCase() === providerName?.toLowerCase() ||
              p.slug.toLowerCase() === providerName?.toLowerCase() ||
              p.display_name.toLowerCase() === providerName?.toLowerCase()
            );

            if (targetProvider) {
              const allModelsResponse = await aiApi.models.getAll();
              if (allModelsResponse.metaData.status === 'success' && allModelsResponse.data) {
                const allModels = Array.isArray(allModelsResponse.data) ? allModelsResponse.data : [];
                const activeModelsForCapability = allModels.filter(
                  (m: any) => 
                    m.provider_id === targetProvider.id && 
                    m.capabilities?.includes(capability) && 
                    m.is_active
                );
                
                // غیرفعال کردن همه مدل‌های فعال قبلی
                for (const activeModel of activeModelsForCapability) {
                  await aiApi.models.update(activeModel.id, { is_active: false });
                }
              }
            }
          } catch (error) {
            console.error('خطا در غیرفعال کردن مدل قبلی:', error);
          }
        }

        let payload: any;

        if (mode === 'full' && modelData && providerName) {
          // حالت Full: برای OpenRouter/HuggingFace - دریافت provider_id واقعی
          const providersResponse = await aiApi.providers.getAll();
          const providers = providersResponse.data || [];
          
          const targetProvider = providers.find((p: any) =>
            p.name.toLowerCase() === providerName.toLowerCase() ||
            p.slug.toLowerCase() === providerName.toLowerCase() ||
            p.display_name.toLowerCase() === providerName.toLowerCase()
          );

          if (!targetProvider) {
            throw new Error(`Provider '${providerName}' یافت نشد`);
          }

          // پیلود کامل با تمام اطلاعات - فقط فیلدهای valid
          payload = {
            provider_id: targetProvider.id,
            name: modelData.name,
            model_id: modelData.id,
            display_name: modelData.name,
            is_active: true,
            capabilities: [capability],
          };

          // فقط فیلدهای valid رو اضافه کن
          if (modelData.description) {
            payload.description = modelData.description;
          }
          // تبدیل pricing به فرمت درست با حداکثر 6 رقم اعشار
          if (modelData.pricing?.prompt !== undefined && modelData.pricing?.prompt !== null) {
            payload.pricing_input = parseFloat(modelData.pricing.prompt.toFixed(6));
          }
          if (modelData.pricing?.completion !== undefined && modelData.pricing?.completion !== null) {
            payload.pricing_output = parseFloat(modelData.pricing.completion.toFixed(6));
          }
          if (modelData.context_length) {
            payload.context_window = modelData.context_length;
          }
          
          console.log('🔵 [Full Mode] Payload:', payload);
        } else {
          // حالت Simple: برای Static Provider ها (OpenAI, Gemini, و غیره)
          // اینجا providerId باید number باشه
          const providerIdNum = parseInt(providerId);
          if (!providerIdNum || isNaN(providerIdNum)) {
            throw new Error(`شناسه Provider نامعتبر است: ${providerId}`);
          }
          
          payload = {
            provider_id: providerIdNum,
            model_id: modelId,
            name: modelData?.name || modelId,
            display_name: modelData?.name || modelId,
            capabilities: [capability],
            is_active: true,
            sort_order: 0,
          };
        }

        await aiApi.models.create(payload);
        setActiveModels(prev => new Set(prev).add(modelId));
        showSuccess('مدل با موفقیت فعال شد');
      }

      onSuccess?.();
      await fetchActiveModels(); // رفرش لیست
    } catch (error: any) {
      console.error('❌ خطا در تغییر وضعیت مدل:', error);
      
      // لاگ کامل خطا برای دیباگ
      console.error('📋 Full Error Object:', error);
      console.error('📋 Error Response:', error?.response);
      console.error('📋 Error Response Data:', error?.response?._data);
      console.error('📋 Error Errors Field:', error?.response?.errors);
      
      let errorMessage = 'خطا در تغییر وضعیت مدل';
      
      // دریافت پیام دقیق از backend
      if (error?.response?._data?.metaData?.message) {
        errorMessage = error.response._data.metaData.message;
      } else if (error?.response?.message) {
        errorMessage = error.response.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // اگر errors وجود داشت، اونارو هم نمایش بده
      if (error?.response?.errors) {
        console.error('📋 Validation Errors:', error.response.errors);
        const validationErrors = error.response.errors;
        if (typeof validationErrors === 'object') {
          const errorDetails = Object.entries(validationErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          errorMessage += ` - ${errorDetails}`;
        }
      }
      
      showError(errorMessage);
    } finally {
      setSavingModelId(null);
    }
  };

  return {
    activeModels,
    savingModelId,
    handleToggleModel,
    refreshActiveModels: fetchActiveModels
  };
}
