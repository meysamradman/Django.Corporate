"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';
import { Button } from '@/components/elements/Button';
import { ModelSelector } from '@/components/ai/core';
import type { ModelCardModel } from '@/components/ai/core';

interface OpenRouterModel extends ModelCardModel {
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
  pricing?: {
    prompt?: number;
    completion?: number;
  };
  category?: 'chat' | 'image' | 'audio' | 'content';
}

interface OpenRouterModelSelectorProps {
  providerId: string;
  providerName: string;
  onClose: () => void;
  onSave: (selectedModels: OpenRouterModel[]) => void;
}

interface OpenRouterModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: OpenRouterModel[]) => void;
  onSelectionChange?: (selectedCount: number) => void;
  onSaveRef?: React.MutableRefObject<(() => void) | undefined>;
  capability?: 'chat' | 'content' | 'image' | 'audio';
}

export function OpenRouterModelSelector({
  providerId,
  providerName,
  onClose,
  onSave
}: OpenRouterModelSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              انتخاب مدل‌های {providerName}
            </h1>
          </div>
        </div>
      </div>

      <OpenRouterModelSelectorContent
        providerId={providerId}
        providerName={providerName}
        onSave={onSave}
      />
    </div>
  );
}

const detectCategory = (model: any): 'chat' | 'content' | 'image' | 'audio' => {
  const modality = model.architecture?.modality?.toLowerCase();
  if (modality === 'image' || modality === 'vision') return 'image';
  if (modality === 'audio' || modality === 'speech') return 'audio';
  
  const id = (model.id || model.name || '').toLowerCase();
  if (id.includes('dall-e') || id.includes('imagen') || id.includes('flux') || id.includes('stable') || id.includes('midjourney')) {
    return 'image';
  }
  if (id.includes('tts') || id.includes('speech') || id.includes('whisper')) {
    return 'audio';
  }
  return 'chat';
};

const extractProvider = (id: string): string => {
  const parts = id.split('/');
  return parts[0] || 'Unknown';
};

const filterByCapability = (models: OpenRouterModel[], capability: string): OpenRouterModel[] => {
  // Chat و Content جداگانه هستند - هر کدام مدل خودش رو دارند
  if (capability === 'chat') {
    return models.filter(model => {
      const modality = model.architecture?.modality?.toLowerCase();
      if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
        return false;
      }
      const id = (model.id || '').toLowerCase();
      const name = (model.name || '').toLowerCase();
      return model.category === 'chat' &&
        !id.includes('dall-e') && !id.includes('flux') && !id.includes('stable') &&
        !id.includes('tts') && !id.includes('speech') && !id.includes('whisper') &&
        !name.includes('image') && !name.includes('audio');
    });
  }
  
  if (capability === 'content') {
    // Content هم مثل chat است ولی مدل جداگانه دارد
    return models.filter(model => {
      const modality = model.architecture?.modality?.toLowerCase();
      if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
        return false;
      }
      const id = (model.id || '').toLowerCase();
      const name = (model.name || '').toLowerCase();
      return model.category === 'chat' &&
        !id.includes('dall-e') && !id.includes('flux') && !id.includes('stable') &&
        !id.includes('tts') && !id.includes('speech') && !id.includes('whisper') &&
        !name.includes('image') && !name.includes('audio');
    });
  }
  
  if (capability === 'image') {
    return models.filter(model => {
      const modality = model.architecture?.modality?.toLowerCase();
      if (modality === 'image' || modality === 'vision') return true;
      const id = (model.id || '').toLowerCase();
      const name = (model.name || '').toLowerCase();
      return model.category === 'image' ||
        id.includes('dall-e') || id.includes('flux') || id.includes('stable') ||
        id.includes('midjourney') || id.includes('imagen') ||
        name.includes('dall-e') || name.includes('flux') || name.includes('stable');
    });
  }
  
  if (capability === 'audio') {
    return models.filter(model => {
      const modality = model.architecture?.modality?.toLowerCase();
      if (modality === 'audio' || modality === 'speech') return true;
      const id = (model.id || '').toLowerCase();
      const name = (model.name || '').toLowerCase();
      return model.category === 'audio' ||
        id.includes('tts') || id.includes('audio') || id.includes('speech') || id.includes('whisper') ||
        name.includes('tts') || name.includes('audio') || name.includes('speech');
    });
  }
  
  return models;
};

export function OpenRouterModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSaveRef,
  capability = 'chat'
}: OpenRouterModelSelectorContentProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = undefined;
    }
  }, [onSaveRef]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await aiApi.chat.getOpenRouterModels();
        if (response.metaData.status === 'success' && response.data) {
          // Backend حالا data.models برمی‌گردونه
          const responseData = response.data as any;
          const modelsData = responseData.models || (Array.isArray(response.data) ? response.data : []);
          
          const realModels: OpenRouterModel[] = modelsData.map((model: any) => {
            const promptPrice = parseFloat(model.pricing?.prompt || '0');
            const completionPrice = parseFloat(model.pricing?.completion || '0');
            const isFree = promptPrice === 0 && completionPrice === 0;
            
            let priceDisplay = 'رایگان';
            if (!isFree) {
              if (promptPrice > 0 || completionPrice > 0) {
                const prices = [];
                if (promptPrice > 0) prices.push(`$${promptPrice}/1M (input)`);
                if (completionPrice > 0) prices.push(`$${completionPrice}/1M (output)`);
                priceDisplay = prices.join(' | ');
              } else {
                priceDisplay = 'نامشخص';
              }
            }
            
            return {
              id: model.id || model.name,
              name: model.name || model.id,
              provider: model.provider || extractProvider(model.id || model.name || ''),
              price: priceDisplay,
              free: isFree,
              category: detectCategory(model),
              description: model.description || '',
              context_length: model.context_length || 0,
              architecture: model.architecture || {},
              pricing: {
                prompt: promptPrice,
                completion: completionPrice
              }
            };
          });
          setModels(realModels);
        } else {
          toast.error('خطا در دریافت مدل‌ها از OpenRouter');
          setModels([]);
        }
      } catch (error) {
        toast.error('خطا در دریافت مدل‌ها از OpenRouter');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [capability]);

  const filteredModels = useMemo(
    () => filterByCapability(models, capability),
    [models, capability]
  );

  return (
    <ModelSelector
      providerId={providerId}
      providerName={providerName}
      models={filteredModels}
      loading={loading}
      capability={capability}
      onSuccess={() => onSave([])}
      modelsPerPage={24}
      mode="full"
    />
  );
}