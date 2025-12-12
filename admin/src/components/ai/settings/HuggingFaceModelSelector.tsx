"use client";


import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Grid3x3,
  List,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { aiApi } from '@/api/ai/route';
import { toast } from '@/components/elements/Sonner';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Badge } from '@/components/elements/Badge';
import { Card, CardContent } from '@/components/elements/Card';
import { Switch } from '@/components/elements/Switch';
import { Label } from '@/components/elements/Label';
import { Spinner } from '@/components/elements/Spinner';

interface Model {
  id: string;
  name: string;
  description?: string;
  task?: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
}

interface HuggingFaceModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: Model[]) => void;
  onSelectionChange?: (selectedCount: number) => void;
  capability?: 'chat' | 'content' | 'image' | 'audio';
  onSaveRef?: React.MutableRefObject<(() => void) | undefined>;
}

const MODELS_PER_PAGE = 24;

export function HuggingFaceModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
  capability = 'image',
  onSaveRef
}: HuggingFaceModelSelectorContentProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [savingModelId, setSavingModelId] = useState<string | null>(null);
  const [activeModels, setActiveModels] = useState<Set<string>>(new Set()); // ✅ مدل‌های فعال

  console.log('🤗 [Hugging Face Init] Capability دریافت شده:', {
    capability: capability,
    providerId: providerId,
    providerName: providerName
  });

  React.useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = undefined; // دیگر نیازی به دکمه ذخیره نداریم
    }
  }, [onSaveRef]);

  useEffect(() => {
    fetchModels();
    fetchActiveModels(); // ✅ دریافت مدل‌های فعال
  }, [capability]);

  const getTaskFilter = (cap: string): string | undefined => {
    if (cap === 'image') return 'text-to-image';
    if (cap === 'chat') return 'text-generation';
    if (cap === 'content') return 'text-generation';
    if (cap === 'audio') return 'automatic-speech-recognition';
    return undefined;
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
        console.log('✅ [Hugging Face] مدل‌های فعال:', Array.from(activeModelIds));
      }
    } catch (error) {
      console.error('❌ [Hugging Face] خطا در دریافت مدل‌های فعال:', error);
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const task = getTaskFilter(capability);
      console.log('🔎 [Hugging Face] درخواست API:', { capability, task });
      
      const response = await aiApi.image.getHuggingFaceModels(task);
      if (response.metaData.status === 'success' && response.data) {
        const modelsData = Array.isArray(response.data) ? response.data : [];
        const mappedModels = modelsData.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id,
          description: model.description || '',
          task: model.task || '',
          downloads: model.downloads || 0,
          likes: model.likes || 0,
          tags: model.tags || [],
        }));
        
        console.log('🤗 [Hugging Face] آمار مدل‌ها:', {
          total: mappedModels.length,
          capability: capability,
          requestedTask: task,
          actualTasks: [...new Set(mappedModels.map(m => m.task))],
          samples: mappedModels.slice(0, 3).map(m => ({ name: m.name, task: m.task }))
        });
        
        setModels(mappedModels);
      }
    } catch (error) {
      toast.error('خطا در دریافت مدل‌ها');
      setModels([]);
    } finally {
      setLoading(false);
    }
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
      };

      console.log('💾 [Hugging Face Toggle] در حال ذخیره مدل:', {
        model_name: model.name,
        capability: capability,
        provider: targetProvider.name
      });

      // ذخیره در دیتابیس
      const response = await aiApi.models.create(modelData);
      
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
      console.error('❌ [Hugging Face Toggle] خطا:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'خطا در ذخیره مدل';
      toast.error(errorMsg);
    } finally {
      setSavingModelId(null);
    }
  }, [models, capability, providerName, onSave]);

  const filteredModels = useMemo(() => {
    let filtered = models;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(model => {
        const searchableText = `${model.name} ${model.description || ''} ${(model.tags || []).join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      // ✅ فعال‌ها اول
      const aActive = activeModels.has(a.id);
      const bActive = activeModels.has(b.id);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // بر اساس downloads (در بین هم‌سطح)
      if (a.downloads && b.downloads) {
        return b.downloads - a.downloads;
      }
      return 0;
    });
    return sorted;
  }, [models, searchQuery, activeModels]);

  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const startIndex = (currentPage - 1) * MODELS_PER_PAGE;
  const endIndex = startIndex + MODELS_PER_PAGE;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, capability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4 text-purple-500" />
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
          <p className="text-font-s">
            {searchQuery ? 'هیچ مدلی با این جستجو یافت نشد' : `هیچ مدل ${capability === 'chat' ? 'چت' : capability === 'image' ? 'تصویر' : 'صدا'} یافت نشد`}
          </p>
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
              <Badge variant="outline" className="bg-green/10 text-green-2 border-green-1 text-xs">
                رایگان
              </Badge>
            </div>
            {model.description && (
              <p className="text-sm mb-2 line-clamp-2 text-font-s">
                {model.description}
              </p>
            )}
            {model.task && (
              <Badge variant="outline" className="text-xs">
                {model.task}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isSaving && (
              <span className="w-3 h-3 border-2 border-purple-1 border-t-transparent rounded-full animate-spin" />
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
          {model.downloads !== undefined && (
            <div className="text-xs text-font-s">
              📥 {model.downloads.toLocaleString()}
            </div>
          )}
          {model.likes !== undefined && (
            <div className="text-xs text-font-s">
              ❤️ {model.likes.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ModelListItem({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card className="transition-all border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-font-p">
                {model.name}
              </h4>
              {model.task && (
                <Badge variant="outline" className="text-xs">
                  {model.task}
                </Badge>
              )}
            </div>
            {model.description && (
              <p className="text-sm line-clamp-1 text-font-s">
                {model.description}
              </p>
            )}
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
