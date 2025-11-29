"use client";

/**
 * 🎨 صفحه حرفه‌ای برای انتخاب مدل‌های Hugging Face
 * 
 * ویژگی‌ها:
 * - جستجوی پیشرفته
 * - فیلتر بر اساس task (text-to-image, text-generation, etc.)
 * - نمایش Grid/List
 * - انتخاب چندتایی
 * - Pagination
 */

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
import { Checkbox } from '@/components/elements/Checkbox';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface Model {
  id: string;
  name: string;
  description?: string;
  task?: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
  selected?: boolean;
}

interface HuggingFaceModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: Model[]) => void;
  onSelectionChange?: (selectedCount: number) => void;
  capability?: 'chat' | 'content' | 'image' | 'audio';
}

const MODELS_PER_PAGE = 24;

export function HuggingFaceModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
  capability = 'image'
}: HuggingFaceModelSelectorContentProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchModels();
  }, [capability]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedModels.size);
    }
  }, [selectedModels.size, onSelectionChange]);

  // ✅ Map capability to Hugging Face task (pipeline_tag)
  const getTaskFilter = (cap: string): string | undefined => {
    if (cap === 'image') return 'text-to-image';
    if (cap === 'chat') return 'text-generation';
    if (cap === 'content') return 'text-generation'; // ✅ محتوا همان text-generation است
    // ✅ برای audio: هم speech-to-text و هم text-to-speech را شامل می‌شود
    // Hugging Face از 'automatic-speech-recognition' برای speech-to-text استفاده می‌کند
    // و 'text-to-speech' برای TTS (اما ممکن است تعداد کمی داشته باشد)
    // برای audio capability، هر دو را شامل می‌کنیم
    if (cap === 'audio') return 'automatic-speech-recognition'; // یا 'text-to-speech' - فعلاً speech-to-text
    return undefined;
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const task = getTaskFilter(capability);
      const response = await aiApi.image.getHuggingFaceModels(task);
      if (response.metaData.status === 'success' && response.data) {
        const modelsData = Array.isArray(response.data) ? response.data : [];
        setModels(modelsData.map((model: any) => ({
          id: model.id || model.name,
          name: model.name || model.id,
          description: model.description || '',
          task: model.task || '',
          downloads: model.downloads || 0,
          likes: model.likes || 0,
          tags: model.tags || [],
          selected: false,
        })));
      }
    } catch (error) {
      console.error('Error fetching HuggingFace models:', error);
      toast.error('خطا در دریافت مدل‌ها');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      if (onSelectionChange) {
        onSelectionChange(newSet.size);
      }
      return newSet;
    });
  };

  // فیلتر بر اساس capability + جستجو
  const filteredModels = useMemo(() => {
    let filtered = models;
    
    // فیلتر بر اساس جستجو
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(model => {
        const searchableText = `${model.name} ${model.description || ''} ${(model.tags || []).join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      });
    }
    
    return filtered;
  }, [models, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
  const startIndex = (currentPage - 1) * MODELS_PER_PAGE;
  const endIndex = startIndex + MODELS_PER_PAGE;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
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
    <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-font-s text-sm">
              {filteredModels.length} مدل موجود • {selectedModels.size} انتخاب شده
              {totalPages > 1 && ` • صفحه ${currentPage} از ${totalPages}`}
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

        {/* Search */}
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

// Model Card Component
function ModelCard({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card
      onClick={onToggle}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'border-purple-500 bg-purple-500/10' : ''
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-bold text-base ${isSelected ? 'text-purple-500' : 'text-font-p'}`}>
                {model.name}
              </h4>
            </div>
            {model.description && (
              <p className={`text-sm mb-2 line-clamp-2 ${isSelected ? 'text-purple-500/70' : 'text-font-s'}`}>
                {model.description}
              </p>
            )}
            {model.task && (
              <Badge variant="outline" className="text-xs">
                {model.task}
              </Badge>
            )}
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="pointer-events-none"
          />
        </div>
        
        <div className={`flex items-center justify-between pt-3 border-t ${isSelected ? 'border-purple-500/20' : 'border-br'}`}>
          {model.downloads !== undefined && (
            <div className={`text-xs ${isSelected ? 'text-purple-500/60' : 'text-font-s'}`}>
              📥 {model.downloads.toLocaleString()}
            </div>
          )}
          {model.likes !== undefined && (
            <div className={`text-xs ${isSelected ? 'text-purple-500/60' : 'text-font-s'}`}>
              ❤️ {model.likes.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Model List Item Component
function ModelListItem({ model, isSelected, onToggle }: { model: Model; isSelected: boolean; onToggle: () => void }) {
  return (
    <Card
      onClick={onToggle}
      className={`cursor-pointer transition-all ${
        isSelected ? 'border-purple-500 bg-purple-500/10' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold ${isSelected ? 'text-purple-500' : 'text-font-p'}`}>
                {model.name}
              </h4>
              {model.task && (
                <Badge variant="outline" className="text-xs">
                  {model.task}
                </Badge>
              )}
            </div>
            {model.description && (
              <p className={`text-sm line-clamp-1 ${isSelected ? 'text-purple-500/70' : 'text-font-s'}`}>
                {model.description}
              </p>
            )}
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="pointer-events-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
