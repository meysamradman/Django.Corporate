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
  Filter,
  Grid3x3,
  List,
  DollarSign,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Badge } from '@/components/elements/Badge';
import { Checkbox } from '@/components/elements/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/Select';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface Model {
  id: string;
  name: string;
  provider?: string;
  price?: string;
  free?: boolean;
  selected?: boolean;
  category?: 'chat' | 'image' | 'content';
  description?: string;
  context_length?: number;
  architecture?: {
    modality: string;
    tokenizer: string;
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
export function OpenRouterModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
  onSaveRef
}: OpenRouterModelSelectorContentProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'chat' | 'image' | 'content'>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popular'>('popular');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

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
        setModels(modelsData.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id,
          provider: model.provider || extractProvider(model.id),
          price: model.pricing?.prompt || model.pricing?.completion || 'نامشخص',
          free: !model.pricing || (model.pricing.prompt === '0' && model.pricing.completion === '0'),
          selected: false,
          category: detectCategory(model),
          description: model.description,
          context_length: model.context_length,
          architecture: model.architecture
        })));
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('خطا در دریافت مدل‌ها');
      // Fallback to mock data
      setModels(getMockModels());
    } finally {
      setLoading(false);
    }
  };

  const getMockModels = (): Model[] => {
    return [
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', price: '$30/1M', free: false, category: 'chat' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', price: '$10/1M', free: false, category: 'chat' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', price: '$15/1M', free: false, category: 'chat' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', price: 'رایگان', free: true, category: 'chat' },
      { id: 'meta/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', price: 'رایگان', free: true, category: 'chat' },
      { id: 'openai/dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', price: '$0.08/image', free: false, category: 'image' },
      { id: 'openai/dall-e-2', name: 'DALL-E 2', provider: 'OpenAI', price: '$0.04/image', free: false, category: 'image' },
      { id: 'google/imagen-3', name: 'Imagen 3', provider: 'Google', price: '$0.02/image', free: false, category: 'image' },
    ];
  };

  const extractProvider = (id: string): string => {
    const parts = id.split('/');
    return parts[0] || 'Unknown';
  };

  const detectCategory = (model: any): 'chat' | 'image' | 'content' => {
    const id = (model.id || model.name || '').toLowerCase();
    if (id.includes('dall-e') || id.includes('imagen') || id.includes('flux') || id.includes('stable')) {
      return 'image';
    }
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

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models.filter(model => {
      // Search filter
      const matchesSearch = 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.provider && model.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (model.id && model.id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Price filter
      const matchesPrice = 
        filterType === 'all' ||
        (filterType === 'free' && model.free) ||
        (filterType === 'paid' && !model.free);
      
      // Category filter
      const matchesCategory = 
        filterCategory === 'all' || model.category === filterCategory;
      
      // Provider filter
      const matchesProvider = 
        filterProvider === 'all' || model.provider === filterProvider;
      
      return matchesSearch && matchesPrice && matchesCategory && matchesProvider;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        if (a.free && !b.free) return -1;
        if (!a.free && b.free) return 1;
        return 0;
      } else {
        // Popular (selected first, then by name)
        const aSelected = selectedModels.has(a.id);
        const bSelected = selectedModels.has(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [models, searchQuery, filterType, filterCategory, filterProvider, sortBy, selectedModels]);

  const uniqueProviders = useMemo(() => {
    const providers = new Set(models.map(m => m.provider).filter((p): p is string => Boolean(p)));
    return Array.from(providers).sort();
  }, [models]);

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
              {filteredAndSortedModels.length} مدل موجود • {selectedModels.size} انتخاب شده
            </p>
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

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در مدل‌ها..."
                className="pr-10"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span>فیلترها</span>
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2">نوع قیمت</Label>
                    <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="free">رایگان</SelectItem>
                        <SelectItem value="paid">پولی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2">دسته‌بندی</Label>
                    <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="chat">💬 Chat</SelectItem>
                        <SelectItem value="image">🖼️ Image</SelectItem>
                        <SelectItem value="content">📝 Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2">Provider</Label>
                    <Select value={filterProvider} onValueChange={setFilterProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        {uniqueProviders.map(provider => (
                          <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2">مرتب‌سازی</Label>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">محبوب</SelectItem>
                        <SelectItem value="name">نام</SelectItem>
                        <SelectItem value="price">قیمت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Models Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedModels.map((model) => {
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
            {filteredAndSortedModels.map((model) => {
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

        {/* Empty State */}
        {filteredAndSortedModels.length === 0 && (
          <div className="text-center py-12">
            <Info className="w-12 h-12 mx-auto mb-4 text-font-s" />
            <p className="text-font-s">مدلی یافت نشد</p>
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

