"use client";

import React, { useState, useEffect } from 'react';
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
        const response = await aiApi.image.getHuggingFaceModels(task);
        
        if (response.metaData.status === 'success' && response.data) {
          const modelsData = Array.isArray(response.data) ? response.data : [];
          const mappedModels: HuggingFaceModel[] = modelsData.map((model: any) => ({
            id: model.id || model.name,
            name: model.name || model.id,
            description: model.description || '',
            task: model.task || '',
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            tags: model.tags || [],
          }));
          setModels(mappedModels);
        }
      } catch (error) {
        toast.error('خطا در دریافت مدل‌ها');
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