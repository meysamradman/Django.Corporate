"use client";

import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface OpenAIModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const OPENAI_MODELS = {
  chat: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      display_name: 'GPT-4o (Latest)',
      description: 'مدل پیشرفته‌ترین OpenAI با قابلیت‌های چندوجهی',
      pricing_input: 2.5,
      pricing_output: 10,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4o-mini',
      name: 'gpt-4o-mini',
      display_name: 'GPT-4o Mini',
      description: 'نسخه کوچک و سریع‌تر GPT-4o',
      pricing_input: 0.15,
      pricing_output: 0.6,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      display_name: 'GPT-4 Turbo',
      description: 'مدل پیشرفته با سرعت بالا',
      pricing_input: 10,
      pricing_output: 30,
      max_tokens: 4096,
      context_window: 128000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      display_name: 'GPT-3.5 Turbo',
      description: 'سریع و اقتصادی برای استفاده روزمره',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 4096,
      context_window: 16385,
    },
    {
      id: 'o1',
      name: 'o1',
      display_name: 'O1 (Reasoning)',
      description: 'مدل استدلال پیشرفته برای مسائل پیچیده',
      pricing_input: 15,
      pricing_output: 60,
      max_tokens: 100000,
      context_window: 200000,
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      display_name: 'O1 Mini',
      description: 'نسخه کوچک‌تر O1 با سرعت بیشتر',
      pricing_input: 3,
      pricing_output: 12,
      max_tokens: 65536,
      context_window: 128000,
    },
  ],
  content: [
    {
      id: 'gpt-4o',
      name: 'gpt-4o',
      display_name: 'GPT-4o (Latest)',
      description: 'بهترین برای تولید محتوای باکیفیت',
      pricing_input: 2.5,
      pricing_output: 10,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      display_name: 'GPT-4 Turbo',
      description: 'تولید محتوای حرفه‌ای با سرعت بالا',
      pricing_input: 10,
      pricing_output: 30,
      max_tokens: 4096,
      context_window: 128000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      display_name: 'GPT-3.5 Turbo',
      description: 'تولید سریع محتوا با هزینه کم',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 4096,
      context_window: 16385,
    },
  ],
  image: [
    {
      id: 'dall-e-3',
      name: 'dall-e-3',
      display_name: 'DALL-E 3',
      description: 'تولید تصویر با کیفیت بالا',
      pricing_input: 0.04,
      pricing_output: 0.08,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'dall-e-2',
      name: 'dall-e-2',
      display_name: 'DALL-E 2',
      description: 'تولید سریع تصویر با هزینه کمتر',
      pricing_input: 0.016,
      pricing_output: 0.018,
      max_tokens: null,
      context_window: null,
    },
  ],
  audio: [
    {
      id: 'tts-1',
      name: 'tts-1',
      display_name: 'TTS-1 (Text to Speech)',
      description: 'تبدیل متن به گفتار با کیفیت استاندارد',
      pricing_input: 15,
      pricing_output: 15,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'tts-1-hd',
      name: 'tts-1-hd',
      display_name: 'TTS-1 HD',
      description: 'تبدیل متن به گفتار با کیفیت بالا',
      pricing_input: 30,
      pricing_output: 30,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'whisper-1',
      name: 'whisper-1',
      display_name: 'Whisper (Speech to Text)',
      description: 'تبدیل گفتار به متن',
      pricing_input: 0.006,
      pricing_output: 0.006,
      max_tokens: null,
      context_window: null,
    },
  ],
};

export function OpenAIModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: OpenAIModelSelectorContentProps) {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const models = OPENAI_MODELS[capability] || [];

  useEffect(() => {
    fetchActiveModel();
  }, [capability]);

  const fetchActiveModel = async () => {
    try {
      setLoading(true);
      const response = await aiApi.models.getActiveModel('openai', capability);
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

      // ایجاد یا به‌روزرسانی مدل
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
        هیچ مدلی برای این capability یافت نشد
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const isActive = activeModelId === model.id;
          const isSaving = savingModelId === model.id;

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
                  {model.pricing_input !== null && (
                    <Badge variant="outline" className="text-xs">
                      ${model.pricing_input}/1M
                    </Badge>
                  )}
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
