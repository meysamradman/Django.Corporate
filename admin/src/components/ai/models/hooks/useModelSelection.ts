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
        // فعال کردن مدل با استفاده از endpoint جدید select-model
        // این endpoint خودش مدل‌های قبلی رو غیرفعال می‌کنه
        
        if (mode === 'full' && modelData && providerName) {
          // حالت Full: برای OpenRouter/HuggingFace - استفاده از provider slug
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

          // استفاده از endpoint جدید select-model
          const selectPayload: any = {
            provider: targetProvider.slug, // backend انتظار slug داره نه ID
            capability: capability,
            model_id: modelData.id,
            model_name: modelData.name,
          };

          // اضافه کردن pricing اگر موجود باشه
          if (modelData.pricing?.prompt !== undefined && modelData.pricing?.prompt !== null) {
            selectPayload.pricing_input = parseFloat(modelData.pricing.prompt.toFixed(6));
          }
          if (modelData.pricing?.completion !== undefined && modelData.pricing?.completion !== null) {
            selectPayload.pricing_output = parseFloat(modelData.pricing.completion.toFixed(6));
          }
          
          console.log('🔵 [Full Mode] Select Model Payload:', selectPayload);
          await aiApi.models.selectModel(selectPayload);
        } else {
          // حالت Simple: برای Static Provider ها (OpenAI, Gemini, و غیره)
          // دریافت provider slug از providerId
          const providersResponse = await aiApi.providers.getAll();
          const providers = providersResponse.data || [];
          
          const providerIdNum = parseInt(providerId);
          if (!providerIdNum || isNaN(providerIdNum)) {
            throw new Error(`شناسه Provider نامعتبر است: ${providerId}`);
          }

          const targetProvider = providers.find((p: any) => p.id === providerIdNum);
          if (!targetProvider) {
            throw new Error(`Provider با ID ${providerIdNum} یافت نشد`);
          }

          // استفاده از endpoint جدید select-model
          const selectPayload = {
            provider: targetProvider.slug, // backend انتظار slug داره نه ID
            capability: capability,
            model_id: modelId,
            model_name: modelData?.name || modelId,
          };
          
          console.log('🟢 [Simple Mode] Select Model Payload:', selectPayload);
          await aiApi.models.selectModel(selectPayload);
        }
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
