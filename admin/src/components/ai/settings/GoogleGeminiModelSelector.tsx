"use client";

import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface GoogleGeminiModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const GEMINI_MODELS = {
  chat: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'gemini-2.0-flash-exp',
      display_name: 'Gemini 2.0 Flash (Experimental)',
      description: 'جدیدترین و سریع‌ترین مدل Gemini با قابلیت‌های پیشرفته',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'gemini-1.5-pro',
      display_name: 'Gemini 1.5 Pro',
      description: 'مدل پیشرفته با context window بسیار بزرگ',
      pricing_input: 1.25,
      pricing_output: 5,
      max_tokens: 8192,
      context_window: 2000000,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash',
      description: 'سریع و کارآمد برای استفاده روزمره',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.0-pro',
      name: 'gemini-1.0-pro',
      display_name: 'Gemini 1.0 Pro',
      description: 'نسخه اولیه با قابلیت‌های خوب',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 2048,
      context_window: 32768,
    },
  ],
  content: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'gemini-2.0-flash-exp',
      display_name: 'Gemini 2.0 Flash (Experimental)',
      description: 'بهترین برای تولید محتوای باکیفیت',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'gemini-1.5-pro',
      display_name: 'Gemini 1.5 Pro',
      description: 'تولید محتوای حرفه‌ای با context بزرگ',
      pricing_input: 1.25,
      pricing_output: 5,
      max_tokens: 8192,
      context_window: 2000000,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash',
      description: 'تولید سریع محتوا',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
  ],
  image: [
    {
      id: 'imagen-3.0-generate-001',
      name: 'imagen-3.0-generate-001',
      display_name: 'Imagen 3.0',
      description: 'تولید تصویر با کیفیت بالا',
      pricing_input: 0.02,
      pricing_output: 0.02,
      max_tokens: null,
      context_window: null,
    },
  ],
  audio: [
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash (Audio)',
      description: 'پردازش و تولید صدا',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
  ],
};

export function GoogleGeminiModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: GoogleGeminiModelSelectorContentProps) {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const models = GEMINI_MODELS[capability] || [];

  useEffect(() => {
    fetchActiveModel();
  }, [capability]);

  const fetchActiveModel = async () => {
    try {
      setLoading(true);
      const response = await aiApi.models.getActiveModel('gemini', capability);
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
                  {isFree ? (
                    <Badge variant="green" className="text-xs">
                      رایگان
                    </Badge>
                  ) : (
                    model.pricing_input !== null && (
                      <Badge variant="outline" className="text-xs">
                        ${model.pricing_input}/1M
                      </Badge>
                    )
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
