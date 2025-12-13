"use client";

import React, { useState, useMemo } from 'react';
import { Search, Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/elements/Input';
import { Button } from '@/components/elements/Button';
import { Spinner } from '@/components/elements/Spinner';
import { ModelCard, ModelCardModel } from './ModelCard';
import { CapabilityFilter, CapabilityType } from './CapabilityFilter';
import { useModelSelection } from '../models/hooks/useModelSelection';

interface ModelSelectorProps {
  providerId: string;
  providerName?: string; // اختیاری - برای OpenRouter لازمه
  models: ModelCardModel[];
  loading: boolean;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSuccess?: () => void;
  showCapabilityFilter?: boolean;
  modelsPerPage?: number;
  mode?: 'simple' | 'full'; // simple: بقیه providers | full: OpenRouter
}

export function ModelSelector({
  providerId,
  providerName,
  models,
  loading,
  capability,
  onSuccess,
  showCapabilityFilter = false,
  modelsPerPage = 24,
  mode = 'simple'
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityType>('all');

  const { activeModels, savingModelId, handleToggleModel } = useModelSelection({
    providerId,
    providerName,
    capability,
    onSuccess,
    mode
  });

  // فیلتر و جستجو
  const filteredModels = useMemo(() => {
    let filtered = models;

    // فیلتر capability
    if (showCapabilityFilter && capabilityFilter !== 'all') {
      filtered = filtered.filter(model => 
        model.category === capabilityFilter ||
        (model as any).categories?.includes(capabilityFilter)
      );
    }

    // جستجو
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.provider?.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
      );
    }

    // مرتب‌سازی: 1) فعال اول 2) رایگان اول 3) به ترتیب نام
    return filtered.sort((a, b) => {
      const aActive = activeModels.has(a.id);
      const bActive = activeModels.has(b.id);
      
      // اول: مدل‌های فعال
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // دوم: مدل‌های رایگان
      if (a.free && !b.free) return -1;
      if (!a.free && b.free) return 1;
      
      // سوم: به ترتیب حروف الفبا
      return a.name.localeCompare(b.name);
    });
  }, [models, searchQuery, capabilityFilter, showCapabilityFilter, activeModels]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / modelsPerPage);
  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * modelsPerPage;
    const end = start + modelsPerPage;
    return filteredModels.slice(start, end);
  }, [filteredModels, currentPage, modelsPerPage]);

  // تعداد مدل‌ها برای هر capability
  const capabilityCounts = useMemo(() => {
    if (!showCapabilityFilter) return undefined;
    
    const counts: Record<CapabilityType, number> = {
      all: models.length,
      chat: models.filter(m => m.category === 'chat').length,
      content: models.filter(m => m.category === 'content').length,
      image: models.filter(m => m.category === 'image').length,
      audio: models.filter(m => m.category === 'audio').length,
    };
    return counts;
  }, [models, showCapabilityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Capability Filter */}
      {showCapabilityFilter && (
        <CapabilityFilter
          selected={capabilityFilter}
          onChange={(cap) => {
            setCapabilityFilter(cap);
            setCurrentPage(1);
          }}
          counts={capabilityCounts}
        />
      )}

      {/* Search & View Mode */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="جستجو در مدل‌ها..."
            className="pr-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
        <span>
          نمایش {paginatedModels.length} از {filteredModels.length} مدل
          {searchQuery && ` (در نتایج جستجو برای "${searchQuery}")`}
        </span>
        <span>
          {activeModels.size} مدل فعال
        </span>
      </div>

      {/* Models Grid/List */}
      {paginatedModels.length === 0 ? (
        <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
          {searchQuery ? 'مدلی با این مشخصات یافت نشد' : 'مدلی موجود نیست'}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          {paginatedModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isActive={activeModels.has(model.id)}
              isSaving={savingModelId === model.id}
              onToggle={() => handleToggleModel(model.id, model as any)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronRight className="w-4 h-4" />
            قبلی
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
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
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            بعدی
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
