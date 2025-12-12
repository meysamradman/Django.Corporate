"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Grid3x3,
  List,
  DollarSign,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Badge } from '@/components/elements/Badge';
import { Card, CardContent } from '@/components/elements/Card';
import { Switch } from '@/components/elements/Switch';
import { Spinner } from '@/components/elements/Spinner';

interface Model {
  id: string;
  name: string;
  provider?: string;
  price?: string;
  free?: boolean;
  category?: 'chat' | 'image' | 'audio' | 'content';
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
  pricing?: {
    prompt?: number;
    completion?: number;
  };
}

interface OpenRouterModelSelectorProps {
  providerId: string;
  providerName: string;
  onClose: () => void;
  onSave: (selectedModels: Model[]) => void;
}

interface OpenRouterModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: Model[]) => void;
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
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-pink-2" />
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

const MODELS_PER_PAGE = 24;

export function OpenRouterModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
  onSaveRef,
  capability = 'chat'
}: OpenRouterModelSelectorContentProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [registeredProviders, setRegisteredProviders] = useState<Set<string>>(new Set());
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set()); // ✅ مدل‌های فعال

  console.log('🎯 [OpenRouter Init] Capability دریافت شده:', {
    capability: capability,
    providerId: providerId,
    providerName: providerName
  });

  useEffect(() => {
    console.log('🔄 [OpenRouter] در حال بارگذاری مدل‌ها برای capability:', capability);
    fetchRegisteredProviders();
    fetchModels();
    fetchActiveModels(); // ✅ دریافت مدل‌های فعال
  }, [capability]);

  const fetchRegisteredProviders = async () => {
    try {
      const response = await aiApi.providers.getAll();
      if (response.metaData.status === 'success' && response.data) {
        const providers = Array.isArray(response.data) ? response.data : [];
        const providerSlugs = new Set(
          providers
            .filter((p: any) => p.is_active !== false)
            .map((p: any) => (p.slug || '').toLowerCase())
            .filter(Boolean)
        );
        setRegisteredProviders(providerSlugs);
      }
    } catch (error) {
    }
  };

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
        console.log('✅ [OpenRouter] مدل‌های فعال:', Array.from(activeModelIds));
      }
    } catch (error) {
      console.error('❌ [OpenRouter] خطا در دریافت مدل‌های فعال:', error);
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await aiApi.chat.getOpenRouterModels();
      if (response.metaData.status === 'success' && response.data) {
        const modelsData = Array.isArray(response.data) ? response.data : [];
        const realModels = modelsData.map((model: any) => {
          // تشخیص دقیق Free/Paid
          const promptPrice = parseFloat(model.pricing?.prompt || '0');
          const completionPrice = parseFloat(model.pricing?.completion || '0');
          const isFree = promptPrice === 0 && completionPrice === 0;
          
          // فرمت قیمت برای نمایش
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
        
        console.log('📊 [OpenRouter] آمار مدل‌ها:', {
          total: realModels.length,
          free: realModels.filter(m => m.free).length,
          paid: realModels.filter(m => !m.free).length,
          byProvider: realModels.reduce((acc, m) => {
            acc[m.provider] = (acc[m.provider] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
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

  const extractProvider = (id: string): string => {
    const parts = id.split('/');
    return parts[0] || 'Unknown';
  };

  const detectCategory = (model: any): 'chat' | 'content' | 'image' | 'audio' => {
    const modality = model.architecture?.modality?.toLowerCase();
    if (modality === 'image' || modality === 'vision') {
      return 'image';
    }
    if (modality === 'audio' || modality === 'speech') {
      return 'audio';
    }
    const id = (model.id || model.name || '').toLowerCase();
    if (id.includes('dall-e') || id.includes('imagen') || id.includes('flux') || id.includes('stable') || id.includes('midjourney')) {
      return 'image';
    }
    if (id.includes('tts') || id.includes('speech') || id.includes('whisper')) {
      return 'audio';
    }
    return 'chat';
  };

  const toggleModel = React.useCallback(async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      toast.error('مدل یافت نشد');
      return;
    }

    setSavingModelId(modelId);
    
    try {
      // دریافت provider از دیتابیس
      const providersResponse = await aiApi.providers.getAll();
      const providers = providersResponse.data || [];
      
      const targetProvider = providers.find((p: any) =>
        p.name.toLowerCase() === providerName.toLowerCase() ||
        p.slug.toLowerCase() === providerName.toLowerCase() ||
        p.display_name.toLowerCase() === providerName.toLowerCase()
      );

      if (!targetProvider) {
        toast.error(`Provider '${providerName}' یافت نشد`);
        setSavingModelId(null);
        return;
      }

      // ساخت داده مدل برای ذخیره
      const modelData = {
        provider_id: targetProvider.id,
        name: model.name,
        model_id: model.id,
        display_name: model.name,
        is_active: true, // ✅ فعال می‌شه
        capabilities: [capability],
        description: model.description,
        pricing_input: model.pricing?.prompt || null,
        pricing_output: model.pricing?.completion || null,
        context_window: model.context_length || null,
      };

      console.log('💾 [OpenRouter Toggle] در حال ذخیره مدل:', {
        model_name: model.name,
        capability: capability,
        provider: targetProvider.name
      });

      // ذخیره در دیتابیس
      const response = await aiApi.models.create(modelData);
      
      console.log('📦 [OpenRouter Toggle] Response:', {
        status: response.metaData.status,
        savedModel: response.data,
        provider_name: response.data?.provider_name || response.data?.provider?.name || response.data?.provider?.display_name
      });
      
      if (response.metaData.status === 'success') {
        toast.success(`مدل ${model.name} با موفقیت فعال شد`);
        
        // ✅ اضافه کردن به لیست مدل‌های فعال
        setActiveModels(prev => new Set([...prev, model.id]));
        
        // بستن پاپ‌آپ و رفرش لیست
        if (onSave) {
          onSave([model]);
        }
      } else {
        throw new Error(response.metaData.message || 'خطا در ذخیره مدل');
      }
    } catch (error: any) {
      console.error('❌ [OpenRouter Toggle] خطا:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'خطا در ذخیره مدل';
      toast.error(errorMsg);
    } finally {
      setSavingModelId(null);
    }
  }, [models, capability, providerName, onSave]);

  const filteredModels = useMemo(() => {
    let filtered = models;

    console.log('🔍 [OpenRouter Filter] قبل از فیلتر capability:', {
      totalModels: filtered.length,
      capability: capability,
      sampleModels: filtered.slice(0, 3).map(m => ({ 
        id: m.id, 
        name: m.name, 
        category: m.category,
        modality: m.architecture?.modality 
      }))
    });

    if (capability === 'chat') {
      const beforeChat = filtered.length;
      filtered = filtered.filter(model => {
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
          return false;
        }
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        return category === 'chat' &&
          !id.includes('dall-e') && !id.includes('flux') &&
          !id.includes('stable') && !id.includes('tts') &&
          !id.includes('speech') && !id.includes('whisper') &&
          !name.includes('image') && !name.includes('audio');
      });
      console.log(`💬 [Chat Filter] ${beforeChat} → ${filtered.length} مدل`);
    } else if (capability === 'content') {
      const beforeContent = filtered.length;
      filtered = filtered.filter(model => {
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
          return false;
        }
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        return category === 'chat' &&
          !id.includes('dall-e') && !id.includes('flux') &&
          !id.includes('stable') && !id.includes('tts') &&
          !id.includes('speech') && !id.includes('whisper') &&
          !name.includes('image') && !name.includes('audio');
      });
      console.log(`📝 [Content Filter] ${beforeContent} → ${filtered.length} مدل`);
    } else if (capability === 'image') {
      const beforeImage = filtered.length;
      filtered = filtered.filter(model => {
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'vision') {
          return true;
        }
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        const result = category === 'image' ||
          id.includes('dall-e') || id.includes('flux') ||
          id.includes('stable') || id.includes('midjourney') ||
          id.includes('imagen') || name.includes('dall-e') ||
          name.includes('flux') || name.includes('stable') ||
          name.includes('midjourney') || name.includes('imagen');
        
        if (result) {
          console.log('🖼️ [Image Found]', { name: model.name, id: model.id, modality, category });
        }
        return result;
      });
      console.log(`🖼️ [Image Filter] ${beforeImage} → ${filtered.length} مدل`);
    } else if (capability === 'audio') {
      const beforeAudio = filtered.length;
      filtered = filtered.filter(model => {
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'audio' || modality === 'speech') {
          return true;
        }
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        return category === 'audio' ||
          id.includes('tts') || id.includes('audio') ||
          id.includes('speech') || id.includes('whisper') ||
          name.includes('tts') || name.includes('audio') ||
          name.includes('speech') || name.includes('whisper');
      });
      console.log(`🎵 [Audio Filter] ${beforeAudio} → ${filtered.length} مدل`);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(model => {
        const searchableText = `${model.name} ${model.provider} ${model.description || ''}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      // ✅ فعال‌ها اول
      const aActive = activeModels.has(a.id);
      const bActive = activeModels.has(b.id);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // رایگان‌ها اول (در بین هم‌سطح)
      if (a.free && !b.free) return -1;
      if (!a.free && b.free) return 1;
      
      return 0;
    });
    
    console.log('✅ [OpenRouter Filter] بعد از فیلتر:', {
      filteredCount: sorted.length,
      capability: capability,
      sampleFiltered: sorted.slice(0, 5).map(m => ({ id: m.id, name: m.name, category: m.category }))
    });
    
    return sorted;
  }, [models, searchQuery, capability, registeredProviders, activeModels]);

  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const startIndex = (currentPage - 1) * MODELS_PER_PAGE;
  const endIndex = startIndex + MODELS_PER_PAGE;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, capability]);

  React.useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = undefined; // دیگر نیازی به دکمه ذخیره نداریم
    }
  }, [onSaveRef]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4 text-pink-2" />
          <p className="text-font-s">در حال بارگذاری مدل‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* جستجو و اطلاعات در یک خط */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مدل‌ها..."
            className="pr-10"
          />
        </div>
        <div className="text-sm text-font-s whitespace-nowrap">
          {filteredModels.length} مدل موجود
          {totalPages > 1 && ` • صفحه ${currentPage}/${totalPages}`}
        </div>
      </div>

      {/* لیست مدل‌ها - فقط Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedModels.map((model) => {
          return (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={activeModels.has(model.id)}
              onToggle={() => toggleModel(model.id)}
              isSaving={savingModelId === model.id}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            قبلی
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[2.5rem]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            بعدی
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Info className="w-12 h-12 mx-auto mb-4 text-font-s" />
          <p className="text-font-p font-semibold mb-2">
            {searchQuery 
              ? 'هیچ مدلی با این جستجو یافت نشد'
              : 'هیچ مدلی یافت نشد'
            }
          </p>
          {!searchQuery && capability === 'image' && (
            <p className="text-sm text-font-s">
              💡 برای تصویر از <span className="font-semibold">Hugging Face</span> استفاده کنید
            </p>
          )}
          {!searchQuery && capability === 'audio' && (
            <p className="text-sm text-font-s">
              💡 برای صدا از <span className="font-semibold">Hugging Face</span> استفاده کنید
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, isSelected, onToggle, isSaving }: { model: Model; isSelected: boolean; onToggle: () => void; isSaving?: boolean }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-base text-font-p">
                {model.name}
              </h4>
              {model.free && (
                <Badge variant="outline" className="bg-green/10 text-green-2 border-green-1">
                  رایگان
                </Badge>
              )}
            </div>
            {model.provider && (
              <p className="text-sm text-font-s">
                {model.provider}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isSaving && (
              <span className="w-3 h-3 border-2 border-blue-1 border-t-transparent rounded-full animate-spin" />
            )}
            <Switch
              id={`model-${model.id}`}
              checked={isSelected}
              onCheckedChange={onToggle}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-br">
          <div className="flex items-center gap-1 text-sm text-font-s">
            <DollarSign className="w-4 h-4" />
            <span>{model.price || 'نامشخص'}</span>
          </div>
          {model.context_length && (
            <div className="text-xs text-font-s">
              {model.context_length.toLocaleString()} tokens
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelListItem({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card className="transition-all hover:shadow-sm border-border">
      <CardContent className="py-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Label htmlFor={`model-list-${model.id}`} className="text-xs text-font-s">
              {isSelected ? 'انتخاب شده' : 'انتخاب نشده'}
            </Label>
            <Switch
              id={`model-list-${model.id}`}
              checked={isSelected}
              onCheckedChange={onToggle}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-font-p">
                {model.name}
              </h4>
              {model.free && (
                <Badge variant="green">رایگان</Badge>
              )}
              {model.category && (
                <span className="text-xs text-font-s">
                  {model.category === 'chat' && '💬'}
                  {model.category === 'image' && '🖼️'}
                  {model.category === 'content' && '📝'}
                </span>
              )}
            </div>
            <p className="text-xs text-font-s">
              {model.provider} • {model.price || 'نامشخص'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

