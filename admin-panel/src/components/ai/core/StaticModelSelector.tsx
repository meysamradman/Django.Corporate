import { useState, useEffect } from 'react';
import { aiApi } from '@/api/ai/ai';
import { showSuccess, showError } from '@/core/toast';
import { Card, CardContent } from '@/components/elements/Card';
import { Badge } from '@/components/elements/Badge';
import { Spinner } from '@/components/elements/Spinner';
import { Switch } from '@/components/elements/Switch';
import type { StaticModel } from '@/types/ai/ai';

interface StaticModelSelectorProps {
  providerId: string;
  providerSlug: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  models: StaticModel[];
  onSave: () => void;
  singleSelection?: boolean;
}

export function StaticModelSelector({
  providerId,
  providerSlug,
  capability,
  models,
  onSave,
  singleSelection = true
}: StaticModelSelectorProps) {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveModel();
  }, [capability, providerSlug]);

  const fetchActiveModel = async () => {
    try {
      setLoading(true);
      const response = await aiApi.models.getActiveModel(providerSlug, capability);
      if (response.data && response.data.model_id) {
        setActiveModelId(response.data.model_id);
      }
    } catch {
      setActiveModelId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModel = async (modelId: string) => {
    const isCurrentlyActive = activeModelId === modelId;
    
    try {
      setSavingModelId(modelId);
      
      const model = models.find(m => m.id === modelId);
      if (!model) return;

      const providerIdNum = parseInt(providerId);
      
      if (!providerIdNum || isNaN(providerIdNum)) {
        showError('خطا: شناسه Provider نامعتبر است');
        return;
      }

      if (singleSelection && !isCurrentlyActive && activeModelId) {
        try {
          const allModelsResponse = await aiApi.models.getAll();
          if (allModelsResponse.metaData.status === 'success' && allModelsResponse.data) {
            const allModels = Array.isArray(allModelsResponse.data) ? allModelsResponse.data : [];
            const activeModel = allModels.find(
              (m: any) => 
                m.provider_id === providerIdNum && 
                m.capabilities?.includes(capability) && 
                m.is_active
            );
            
            if (activeModel?.id) {
              await aiApi.models.update(activeModel.id, { is_active: false });
            }
          }
        } catch {
        }
      }

      const modelData = {
        provider_id: providerIdNum,
        model_id: model.id,
        name: model.name,
        display_name: model.display_name,
        description: model.description,
        capabilities: [capability],
        pricing_input: model.pricing_input,
        pricing_output: model.pricing_output,
        max_tokens: model.max_tokens,
        context_window: model.context_window,
        is_active: !isCurrentlyActive,
        sort_order: 0,
      };

      const response = await aiApi.models.create(modelData);
      
      if (response.metaData.status === 'success') {
        await fetchActiveModel();
        showSuccess(isCurrentlyActive ? 'مدل غیرفعال شد' : 'مدل فعال شد');
        
        setTimeout(() => {
          onSave();
        }, 300);
      }
    } catch (error: any) {
      showError(error?.message || 'خطا در تغییر وضعیت مدل');
    } finally {
      setSavingModelId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-8 text-font-s">
        هیچ مدلی برای این capability یافت نشد
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...models]
          .sort((a, b) => {
            const aActive = activeModelId === a.id;
            const bActive = activeModelId === b.id;
            
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            
            const aFree = (!a.pricing_input || a.pricing_input === 0) && (!a.pricing_output || a.pricing_output === 0);
            const bFree = (!b.pricing_input || b.pricing_input === 0) && (!b.pricing_output || b.pricing_output === 0);
            if (aFree && !bFree) return -1;
            if (!aFree && bFree) return 1;
            
            return a.name.localeCompare(b.name);
          })
          .map((model) => {
          const isActive = activeModelId === model.id;
          const isSaving = savingModelId === model.id;
          const isFree = (!model.pricing_input || model.pricing_input === 0) && (!model.pricing_output || model.pricing_output === 0);

          return (
            <Card
              key={model.id}
              className={`transition-all hover:shadow-md ${
                isActive ? 'border-green-1/50 bg-green/10' : 'border-border'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-bold text-base text-font-p">
                        {model.display_name}
                      </h4>
                      {isFree && (
                        <Badge className="bg-green-0 text-green-1 text-xs">
                          رایگان
                        </Badge>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-sm text-font-s mb-2 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSaving && (
                      <span className="w-3 h-3 border-2 border-blue-1 border-t-transparent rounded-full animate-spin" />
                    )}
                    <Switch
                      id={`model-${model.id}`}
                      checked={isActive}
                      onCheckedChange={() => handleToggleModel(model.id)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-br">
                  <div className="flex items-center gap-1 text-xs text-font-s">
                    {model.pricing_input !== null && (
                      <span>💰 ${model.pricing_input}/1M (in)</span>
                    )}
                  </div>
                  {model.context_window && (
                    <div className="text-xs text-font-s">
                      📝 {model.context_window.toLocaleString()} tokens
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
