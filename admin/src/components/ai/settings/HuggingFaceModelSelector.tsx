"use client";

/**
 * 🎨 Selector برای انتخاب مدل‌های Hugging Face
 * 
 * مدل‌های Hugging Face شامل:
 * - Stable Diffusion XL
 * - Stable Diffusion 2.1
 * - و مدل‌های دیگر
 */

import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Badge } from '@/components/elements/Badge';
import { Checkbox } from '@/components/elements/Checkbox';
import { Card, CardContent } from '@/components/elements/Card';
import { Spinner } from '@/components/elements/Spinner';

interface HuggingFaceModel {
  id: string;
  name: string;
  description?: string;
  category: 'image' | 'text';
  selected?: boolean;
}

interface HuggingFaceModelSelectorContentProps {
  providerId: string;
  providerName: string;
  onSave: (selectedModels: HuggingFaceModel[]) => void;
  onSelectionChange?: (selectedCount: number) => void;
}

// لیست مدل‌های معروف Hugging Face
const HUGGINGFACE_MODELS: HuggingFaceModel[] = [
  // Image Models
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'مدل پیشرفته برای تولید تصاویر با کیفیت بالا',
    category: 'image',
  },
  {
    id: 'stabilityai/stable-diffusion-2-1',
    name: 'Stable Diffusion 2.1',
    description: 'نسخه بهبود یافته Stable Diffusion',
    category: 'image',
  },
  {
    id: 'runwayml/stable-diffusion-v1-5',
    name: 'Stable Diffusion v1.5',
    description: 'نسخه پایدار و محبوب',
    category: 'image',
  },
  {
    id: 'CompVis/stable-diffusion-v1-4',
    name: 'Stable Diffusion v1.4',
    description: 'نسخه کلاسیک',
    category: 'image',
  },
  // Text Models
  {
    id: 'gpt2',
    name: 'GPT-2',
    description: 'مدل تولید متن',
    category: 'text',
  },
  {
    id: 'distilgpt2',
    name: 'DistilGPT-2',
    description: 'نسخه سبک‌تر GPT-2',
    category: 'text',
  },
];

export function HuggingFaceModelSelectorContent({
  providerId,
  providerName,
  onSave,
  onSelectionChange,
}: HuggingFaceModelSelectorContentProps) {
  const [models, setModels] = useState<HuggingFaceModel[]>(
    HUGGINGFACE_MODELS.map(m => ({ ...m, selected: false }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'image' | 'text'>('all');

  const filteredModels = models.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      filterCategory === 'all' || model.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const selectedCount = models.filter(m => m.selected).length;

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedCount);
    }
  }, [selectedCount, onSelectionChange]);

  const toggleModel = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, selected: !model.selected }
        : model
    ));
  };

  const handleSave = () => {
    const selected = models.filter(m => m.selected);
    onSave(selected);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="space-y-4">
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

        <div className="flex gap-2">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            همه
          </Button>
          <Button
            variant={filterCategory === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('image')}
          >
            🖼️ تصویر
          </Button>
          <Button
            variant={filterCategory === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('text')}
          >
            📝 متن
          </Button>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-2">
        {filteredModels.map((model) => (
          <Card
            key={model.id}
            onClick={() => toggleModel(model.id)}
            className={`cursor-pointer transition-all hover:shadow-md ${
              model.selected ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={model.selected}
                  onCheckedChange={() => toggleModel(model.id)}
                  className="pointer-events-none"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold text-sm ${model.selected ? 'text-primary' : 'text-font-p'}`}>
                      {model.name}
                    </h4>
                    <Badge variant={model.category === 'image' ? 'blue' : 'gray'}>
                      {model.category === 'image' ? '🖼️ تصویر' : '📝 متن'}
                    </Badge>
                  </div>
                  <p className="text-xs text-font-s mb-1">
                    {model.id}
                  </p>
                  {model.description && (
                    <p className="text-xs text-font-s">
                      {model.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-font-s">مدلی یافت نشد</p>
        </div>
      )}

      {/* Selected Count */}
      {selectedCount > 0 && (
        <div className="text-center py-2">
          <p className="text-sm text-font-s">
            {selectedCount} مدل انتخاب شده
          </p>
        </div>
      )}
    </div>
  );
}

