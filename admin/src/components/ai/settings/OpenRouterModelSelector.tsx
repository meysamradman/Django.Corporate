"use client";

/**
 * 🎨 صفحه حرفه‌ای و خلاقانه برای انتخاب مدل‌های OpenRouter
 * 
 * ویژگی‌ها:
 * - جستجوی پیشرفته
 * - فیلتر بر اساس قیمت، Provider، نوع (Chat/Image/Content)
 * - نمایش Grid/List
 * - انتخاب چندتایی
 * - نمایش اطلاعات کامل هر مدل
 */

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
import { Checkbox } from '@/components/elements/Checkbox';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface Model {
  id: string;
  name: string;
  provider?: string;
  price?: string;
  free?: boolean;
  selected?: boolean;
  category?: 'chat' | 'image' | 'audio' | 'content'; // ✅ اضافه کردن audio
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
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
  capability?: 'chat' | 'content' | 'image' | 'audio'; // ✅ فیلتر بر اساس capability
}

// Component اصلی (برای استفاده در صفحه جداگانه - deprecated)
export function OpenRouterModelSelector({
  providerId,
  providerName,
  onClose,
  onSave
}: OpenRouterModelSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
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

// Component محتوا (برای استفاده در Modal)
const MODELS_PER_PAGE = 24; // برای Popup

export function OpenRouterModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
  onSaveRef,
  capability = 'chat' // ✅ Default: chat
}: OpenRouterModelSelectorContentProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [registeredProviders, setRegisteredProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRegisteredProviders();
    fetchModels();
  }, []);

  // ✅ دریافت لیست Provider های ثبت شده در دیتابیس
  const fetchRegisteredProviders = async () => {
    try {
      const response = await aiApi.providers.getAll();
      if (response.metaData.status === 'success' && response.data) {
        const providers = Array.isArray(response.data) ? response.data : [];
        // استخراج slug های Provider ها (فقط Provider های فعال)
        const providerSlugs = new Set(
          providers
            .filter((p: any) => p.is_active !== false) // فقط Provider های فعال
            .map((p: any) => (p.slug || '').toLowerCase())
            .filter(Boolean)
        );
        setRegisteredProviders(providerSlugs);
        console.log('[OpenRouter] Registered providers:', Array.from(providerSlugs));
      }
    } catch (error) {
      console.warn('[OpenRouter] Failed to fetch registered providers:', error);
      // در صورت خطا، همه را نمایش بده (fallback)
    }
  };

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedModels.size);
    }
  }, [selectedModels.size, onSelectionChange]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await aiApi.chat.getOpenRouterModels();
      if (response.metaData.status === 'success' && response.data) {
        const modelsData = Array.isArray(response.data) ? response.data : [];
        // ✅ فقط مدل‌های واقعی از API (نه mock data)
        const realModels = modelsData.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id,
          provider: model.provider || extractProvider(model.id || model.name || ''),
          price: model.pricing?.prompt || model.pricing?.completion || 'نامشخص',
          free: !model.pricing || (model.pricing.prompt === '0' && model.pricing.completion === '0'),
          selected: false,
          category: detectCategory(model),
          description: model.description || '',
          context_length: model.context_length || 0,
          architecture: model.architecture || {}
        }));
        setModels(realModels);
        console.log(`[OpenRouter] Loaded ${realModels.length} models from API`);
      } else {
        // ✅ اگر خطا بود، لیست خالی بده (نه mock data)
        console.error('[OpenRouter] Failed to fetch models:', response);
        toast.error('خطا در دریافت مدل‌ها از OpenRouter');
        setModels([]);
      }
    } catch (error) {
      console.error('[OpenRouter] Error fetching models:', error);
      toast.error('خطا در دریافت مدل‌ها از OpenRouter');
      // ✅ اگر خطا بود، لیست خالی بده (نه mock data)
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const extractProvider = (id: string): string => {
    const parts = id.split('/');
    return parts[0] || 'Unknown';
  };

  // ✅ تشخیص capability بر اساس architecture.modality (دقیق‌تر از نام مدل)
  const detectCategory = (model: any): 'chat' | 'content' | 'image' | 'audio' => {
    // اول از architecture.modality استفاده کن (دقیق‌ترین روش)
    const modality = model.architecture?.modality?.toLowerCase();
    if (modality === 'image' || modality === 'vision') {
      return 'image';
    }
    if (modality === 'audio' || modality === 'speech') {
      return 'audio';
    }
    // Fallback: اگر modality نبود، از نام مدل استفاده کن
    const id = (model.id || model.name || '').toLowerCase();
    if (id.includes('dall-e') || id.includes('imagen') || id.includes('flux') || id.includes('stable') || id.includes('midjourney')) {
      return 'image';
    }
    if (id.includes('tts') || id.includes('speech') || id.includes('whisper')) {
      return 'audio';
    }
    // Default: chat (برای content هم از chat استفاده می‌کنیم چون هر دو text generation هستند)
    return 'chat';
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      // Notify parent of selection change
      if (onSelectionChange) {
        onSelectionChange(newSet.size);
      }
      return newSet;
    });
  };

  // ✅ فیلتر بر اساس capability + جستجو + Provider های ثبت شده
  const filteredModels = useMemo(() => {
    let filtered = models;
    
    // 0. ✅ فیلتر بر اساس Provider های ثبت شده در دیتابیس
    if (registeredProviders.size > 0) {
      filtered = filtered.filter(model => {
        // استخراج Provider از model.id (مثلاً: anthropic/claude-3.5-sonnet -> anthropic)
        const modelProvider = extractProvider(model.id || model.name || '').toLowerCase();
        // بررسی اینکه آیا این Provider در دیتابیس ثبت شده است
        const isRegistered = registeredProviders.has(modelProvider);
        if (!isRegistered) {
          console.log(`[OpenRouter] Filtered out model ${model.id} - Provider "${modelProvider}" not registered`);
        }
        return isRegistered;
      });
    }
    
    // 1. ✅ فیلتر بر اساس capability (استفاده از architecture.modality)
    if (capability === 'chat') {
      filtered = filtered.filter(model => {
        // اول از architecture.modality استفاده کن
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
          return false;
        }
        // Fallback: اگر modality نبود، از نام مدل استفاده کن
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        // حذف مدل‌های image و audio
        return category === 'chat' && 
               !id.includes('dall-e') && !id.includes('flux') && 
               !id.includes('stable') && !id.includes('tts') &&
               !id.includes('speech') && !id.includes('whisper') &&
               !name.includes('image') && !name.includes('audio');
      });
    } else if (capability === 'content') {
      // ✅ محتوا: همان مدل‌های chat (text generation) اما ممکن است برخی مدل‌ها فقط برای content بهینه شده باشند
      filtered = filtered.filter(model => {
        // اول از architecture.modality استفاده کن
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'audio' || modality === 'speech' || modality === 'vision') {
          return false;
        }
        // Fallback: اگر modality نبود، از نام مدل استفاده کن
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        // حذف مدل‌های image و audio (مثل chat)
        return category === 'chat' && 
               !id.includes('dall-e') && !id.includes('flux') && 
               !id.includes('stable') && !id.includes('tts') &&
               !id.includes('speech') && !id.includes('whisper') &&
               !name.includes('image') && !name.includes('audio');
      });
    } else if (capability === 'image') {
      filtered = filtered.filter(model => {
        // اول از architecture.modality استفاده کن
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'image' || modality === 'vision') {
          return true;
        }
        // Fallback: اگر modality نبود، از نام مدل استفاده کن
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        return category === 'image' ||
               id.includes('dall-e') || id.includes('flux') || 
               id.includes('stable') || id.includes('midjourney') ||
               id.includes('imagen') || name.includes('dall-e') ||
               name.includes('flux') || name.includes('stable') ||
               name.includes('midjourney') || name.includes('imagen');
      });
    } else if (capability === 'audio') {
      filtered = filtered.filter(model => {
        // اول از architecture.modality استفاده کن
        const modality = model.architecture?.modality?.toLowerCase();
        if (modality === 'audio' || modality === 'speech') {
          return true;
        }
        // Fallback: اگر modality نبود، از نام مدل استفاده کن
        const id = (model.id || '').toLowerCase();
        const name = (model.name || '').toLowerCase();
        const category = detectCategory(model);
        return category === 'audio' ||
               id.includes('tts') || id.includes('audio') || 
               id.includes('speech') || id.includes('whisper') ||
               name.includes('tts') || name.includes('audio') ||
               name.includes('speech') || name.includes('whisper');
      });
    }
    
    // 2. فیلتر بر اساس جستجو
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(model => {
        const searchableText = `${model.name} ${model.provider} ${model.description || ''}`.toLowerCase();
        return searchableText.includes(query);
      });
    }
    
    return filtered;
  }, [models, searchQuery, capability, registeredProviders]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const startIndex = (currentPage - 1) * MODELS_PER_PAGE;
  const endIndex = startIndex + MODELS_PER_PAGE;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, capability]);


  // Expose save function via ref (will be used by parent)
  React.useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = () => {
        const selected = models.filter(m => selectedModels.has(m.id));
        onSave(selected);
      };
    }
  }, [models, selectedModels, onSave, onSaveRef]);

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
    <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-font-s text-sm">
              {filteredModels.length} مدل موجود • {selectedModels.size} انتخاب شده
              {totalPages > 1 && ` • صفحه ${currentPage} از ${totalPages}`}
            </p>
            {registeredProviders.size > 0 && (
              <Badge variant="outline" className="text-xs">
                فقط Provider های ثبت شده ({registeredProviders.size})
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3x3 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search - فقط جستجو */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مدل‌ها..."
            className="pr-10"
          />
        </div>

        {/* Models Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedModels.map((model) => {
              const isSelected = selectedModels.has(model.id);
              return (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={isSelected}
                  onToggle={() => toggleModel(model.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedModels.map((model) => {
              const isSelected = selectedModels.has(model.id);
              return (
                <ModelListItem
                  key={model.id}
                  model={model}
                  isSelected={isSelected}
                  onToggle={() => toggleModel(model.id)}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

        {/* Empty State */}
        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <Info className="w-12 h-12 mx-auto mb-4 text-font-s" />
            <p className="text-font-s">
              {searchQuery ? 'هیچ مدلی با این جستجو یافت نشد' : `هیچ مدل ${capability === 'chat' ? 'چت' : capability === 'image' ? 'تصویر' : 'صدا'} یافت نشد`}
            </p>
          </div>
        )}
    </div>
  );
}

// ============================================
// 🎨 Model Card Component
// ============================================

function ModelCard({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card
      onClick={onToggle}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'border-pink-1 bg-pink' : ''
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-bold text-base ${isSelected ? 'text-static-w' : 'text-font-p'}`}>
                {model.name}
              </h4>
              {model.free && (
                <Badge variant="green">رایگان</Badge>
              )}
            </div>
            {model.provider && (
              <p className={`text-sm mb-2 ${isSelected ? 'text-static-w/70' : 'text-font-s'}`}>
                {model.provider}
              </p>
            )}
            {model.category && (
              <div className={`flex items-center gap-1 text-xs ${isSelected ? 'text-static-w/60' : 'text-font-s'}`}>
                {model.category === 'chat' && '💬 Chat'}
                {model.category === 'image' && '🖼️ Image'}
                {model.category === 'content' && '📝 Content'}
              </div>
            )}
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="pointer-events-none"
          />
        </div>
        
        <div className={`flex items-center justify-between pt-3 border-t ${isSelected ? 'border-static-w/10' : 'border-br'}`}>
          <div className={`flex items-center gap-1 text-sm ${isSelected ? 'text-static-w/80' : 'text-font-s'}`}>
            <DollarSign className="w-4 h-4" />
            <span>{model.price || 'نامشخص'}</span>
          </div>
          {model.context_length && (
            <div className={`text-xs ${isSelected ? 'text-static-w/60' : 'text-font-s'}`}>
              {model.context_length.toLocaleString()} tokens
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 🎨 Model List Item Component
// ============================================

function ModelListItem({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card
      onClick={onToggle}
      className={`cursor-pointer transition-all hover:shadow-sm ${isSelected ? 'border-pink-1 bg-pink' : ''}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-4 flex-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="pointer-events-none"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-sm ${isSelected ? 'text-static-w' : 'text-font-p'}`}>
                {model.name}
              </h4>
              {model.free && (
                <Badge variant="green">رایگان</Badge>
              )}
              {model.category && (
                <span className={`text-xs ${isSelected ? 'text-static-w/70' : 'text-font-s'}`}>
                  {model.category === 'chat' && '💬'}
                  {model.category === 'image' && '🖼️'}
                  {model.category === 'content' && '📝'}
                </span>
              )}
            </div>
            <p className={`text-xs ${isSelected ? 'text-static-w/70' : 'text-font-s'}`}>
              {model.provider} • {model.price || 'نامشخص'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

