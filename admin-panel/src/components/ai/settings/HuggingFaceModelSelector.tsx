"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';
import { ModelSelector } from '@/components/ai/core';
import type { ModelCardModel } from '@/components/ai/core';

interface HuggingFaceModel extends ModelCardModel {
  task?: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
}

interface HuggingFaceModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: HuggingFaceModel[]) => void;
  onSelectionChange?: (selectedCount: number) => void;
  capability?: 'chat' | 'content' | 'image' | 'audio';
  onSaveRef?: React.MutableRefObject<(() => void) | undefined>;
}

const TASK_MAP: Record<string, string> = {
  image: 'text-to-image',
  chat: 'text-generation',
  content: 'text-generation',
  audio: 'automatic-speech-recognition',
};

export function HuggingFaceModelSelectorContent({
  providerId,
  providerName,
  onSave,
  capability = 'image',
  onSaveRef
}: HuggingFaceModelSelectorContentProps) {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
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
        const task = TASK_MAP[capability];
        // استفاده از endpoint مناسب بر اساس capability
        let response;
        if (capability === 'image') {
          response = await aiApi.image.getHuggingFaceModels(task);
        } else if (capability === 'chat') {
          response = await aiApi.chat.getHuggingFaceModels(task);
        } else if (capability === 'content') {
          response = await aiApi.content.getHuggingFaceModels(task);
        } else {
          response = await aiApi.image.getHuggingFaceModels(task);
        }
        
        if (response.metaData.status === 'success' && response.data) {
          // Backend حالا data.models برمی‌گردونه
          const responseData = response.data as any;
          const modelsData = responseData.models || (Array.isArray(response.data) ? response.data : []);
          
          const mappedModels: HuggingFaceModel[] = modelsData.map((model: any) => {
            // HuggingFace همه مدل‌هایش رایگان است
            const isFree = true;
            const priceDisplay = 'رایگان';
            
            return {
              id: model.id || model.name,
              name: model.name || model.id,
              description: model.description || '',
              task: model.task || '',
              downloads: model.downloads || 0,
              likes: model.likes || 0,
              tags: model.tags || [],
              category: capability,
              free: isFree,
              price: priceDisplay,
              pricing: {
                prompt: 0,
                completion: 0
              }
            };
          });
          setModels(mappedModels);
        } else {
          toast.error('خطا در دریافت مدل‌ها از Hugging Face');
          setModels([]);
        }
      } catch (error) {
        toast.error('خطا در دریافت مدل‌ها از Hugging Face');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [capability]);

  return (
    <ModelSelector
      providerId={providerId}
      providerName={providerName}
      models={models}
      loading={loading}
      capability={capability}
      onSuccess={() => onSave([])}
      modelsPerPage={24}
      mode="full"
    />
  );
}