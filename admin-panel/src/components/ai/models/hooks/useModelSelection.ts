import { useState, useEffect } from 'react';
import { aiApi } from '@/api/ai/ai';
import { showSuccess, showError } from '@/core/toast';
import type { ModelData } from '@/types/ai/ai';

interface UseModelSelectionProps {
  providerId: string;
  providerName?: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSuccess?: () => void;
  mode?: 'simple' | 'full';
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
    } catch {
      // Silently handle error - models will remain in current state
    }
  };

  useEffect(() => {
    fetchActiveModels();
  }, [capability]);

  const handleToggleModel = async (modelId: string, modelData?: ModelData) => {
    const isCurrentlyActive = activeModels.has(modelId);
    
    try {
      setSavingModelId(modelId);

      if (isCurrentlyActive) {
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
        if (mode === 'full' && modelData && providerName) {
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

          const selectPayload: any = {
            provider: targetProvider.slug,
            capability: capability,
            model_id: modelData.id,
            model_name: modelData.name,
          };

          if (modelData.pricing?.prompt !== undefined && modelData.pricing?.prompt !== null) {
            selectPayload.pricing_input = parseFloat(modelData.pricing.prompt.toFixed(6));
          }
          if (modelData.pricing?.completion !== undefined && modelData.pricing?.completion !== null) {
            selectPayload.pricing_output = parseFloat(modelData.pricing.completion.toFixed(6));
          }
          
          await aiApi.models.selectModel(selectPayload);
        } else {
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

          const selectPayload = {
            provider: targetProvider.slug,
            capability: capability,
            model_id: modelId,
            model_name: modelData?.name || modelId,
          };
          
          await aiApi.models.selectModel(selectPayload);
        }
        setActiveModels(prev => new Set(prev).add(modelId));
        showSuccess('مدل با موفقیت فعال شد');
      }

      onSuccess?.();
      await fetchActiveModels();
    } catch (error: any) {
      let errorMessage = 'خطا در تغییر وضعیت مدل';
      
      if (error?.response?._data?.metaData?.message) {
        errorMessage = error.response._data.metaData.message;
      } else if (error?.response?.message) {
        errorMessage = error.response.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.response?.errors) {
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
