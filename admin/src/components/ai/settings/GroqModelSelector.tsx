"use client";

import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface GroqModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const GROQ_MODELS = {
  chat: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'llama-3.3-70b-versatile',
      display_name: 'Llama 3.3 70B',
      description: 'مدل قدرتمند و سریع Meta - رایگان!',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'llama-3.1-70b-versatile',
      display_name: 'Llama 3.1 70B',
      description: 'نسخه قبلی Llama - رایگان و سریع',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'llama3-70b-8192',
      name: 'llama3-70b-8192',
      display_name: 'Llama 3 70B',
      description: 'مدل پایدار و قابل اعتماد',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 8192,
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'mixtral-8x7b-32768',
      display_name: 'Mixtral 8x7B',
      description: 'مدل Mistral AI با کیفیت عالی',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 32768,
    },
    {
      id: 'gemma2-9b-it',
      name: 'gemma2-9b-it',
      display_name: 'Gemma 2 9B',
      description: 'مدل کوچک و سریع Google',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 8192,
    },
  ],
  content: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'llama-3.3-70b-versatile',
      display_name: 'Llama 3.3 70B',
      description: 'بهترین برای تولید محتوای باکیفیت - رایگان!',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'mixtral-8x7b-32768',
      display_name: 'Mixtral 8x7B',
      description: 'تولید محتوای حرفه‌ای',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 32768,
    },
  ],
  image: [],
  audio: [
    {
      id: 'whisper-large-v3',
      name: 'whisper-large-v3',
      display_name: 'Whisper Large V3',
      description: 'تبدیل گفتار به متن - رایگان و دقیق',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'distil-whisper-large-v3-en',
      name: 'distil-whisper-large-v3-en',
      display_name: 'Distil-Whisper Large V3',
      description: 'نسخه سریع‌تر Whisper برای انگلیسی',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: null,
      context_window: null,
    },
  ],
};

export function GroqModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: GroqModelSelectorContentProps) {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const models = GROQ_MODELS[capability] || [];

  useEffect(() => {
    fetchActiveModel();
  }, [capability]);

  const fetchActiveModel = async () => {
    try {
      setLoading(true);
      const response = await aiApi.models.getActiveModel('groq', capability);
      if (response.data && response.data.model_id) {
        setActiveModelId(response.data.model_id);
      }
    } catch (error: any) {
      // 404 is expected when no active model exists - don't log
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
      
      // Debug log
      console.log('Provider ID:', providerId, 'Parsed:', providerIdNum);
      
      if (!providerIdNum || isNaN(providerIdNum)) {
        showError('خطا: شناسه Provider نامعتبر است');
        return;
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

      console.log('Sending model data:', modelData);

      const response = await aiApi.models.create(modelData);
      
      if (response.metaData.status === 'success') {
        setActiveModelId(isCurrentlyActive ? null : modelId);
        showSuccess(isCurrentlyActive ? 'مدل غیرفعال شد' : 'مدل فعال شد');
        onSave();
      }
    } catch (error: any) {
      console.error('Error creating model:', error);
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
        Groq فعلاً برای {capability === 'image' ? 'تصویر' : 'این قابلیت'} مدل ندارد
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const isActive = activeModelId === model.id;
          const isSaving = savingModelId === model.id;
          const isFree = model.pricing_input === 0 && model.pricing_output === 0;

          return (
            <Card
              key={model.id}
              className={`transition-all hover:shadow-md ${
                isActive ? 'border-green-1/50 bg-green/10' : 'border-border'
              }`}
            >
              <CardContent className="p-3 space-y-2">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight flex-1">
                      {model.display_name}
                    </h3>
                    {isActive && (
                      <Badge variant="green" className="flex-shrink-0">
                        <Check className="w-3 h-3 ml-1" />
                        فعال
                      </Badge>
                    )}
                  </div>
                  {model.description && (
                    <p className="text-xs text-font-s line-clamp-2 leading-relaxed">
                      {model.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="green" className="text-xs">
                    رایگان
                  </Badge>
                  {model.context_window && (
                    <Badge variant="outline" className="text-xs">
                      {model.context_window.toLocaleString()} tokens
                    </Badge>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`w-full text-xs h-8 ${
                      isActive 
                        ? 'bg-green-1 hover:bg-green-2 text-white border-green-1' 
                        : 'bg-bg hover:bg-bg-hover text-font-s border-border'
                    }`}
                    onClick={() => handleToggleModel(model.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        در حال ذخیره...
                      </span>
                    ) : isActive ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        فعال
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <X className="w-3 h-3" />
                        غیرفعال
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
