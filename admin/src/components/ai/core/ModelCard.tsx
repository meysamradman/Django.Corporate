"use client";

import React from 'react';
import { Badge } from '@/components/elements/Badge';
import { Switch } from '@/components/elements/Switch';
import { Card, CardContent } from '@/components/elements/Card';
import { Info, DollarSign, Sparkles } from 'lucide-react';

export interface ModelCardModel {
  id: string;
  name: string;
  provider?: string;
  price?: string;
  free?: boolean;
  description?: string;
  context_length?: number;
  category?: 'chat' | 'image' | 'audio' | 'content'; // اضافه شد
  pricing?: {
    prompt?: number;
    completion?: number;
  };
}

interface ModelCardProps {
  model: ModelCardModel;
  isActive: boolean;
  isSaving: boolean;
  onToggle: (modelId: string) => void;
  viewMode?: 'grid' | 'list';
}

export function ModelCard({
  model,
  isActive,
  isSaving,
  onToggle,
  viewMode = 'grid'
}: ModelCardProps) {

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark hover:border-primary-light dark:hover:border-primary-dark transition-all">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
              {model.name}
            </h4>
            {model.provider && (
              <Badge variant="outline" className="text-xs shrink-0">
                {model.provider}
              </Badge>
            )}
            {model.free ? (
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs shrink-0">
                رایگان
              </Badge>
            ) : (
              <Badge variant="gray" className="text-xs shrink-0">
                <DollarSign className="w-3 h-3 mr-1" />
                {model.price || 'پولی'}
              </Badge>
            )}
          </div>
          {model.description && (
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-1">
              {model.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 mr-4 shrink-0">
          {isSaving && (
            <span className="w-3 h-3 border-2 border-blue-1 border-t-transparent rounded-full animate-spin" />
          )}
          <Switch
            id={`model-${model.id}`}
            checked={isActive}
            onCheckedChange={() => onToggle(model.id)}
            disabled={isSaving}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:border-primary-light dark:hover:border-primary-dark transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2 truncate">
              {model.name}
            </h4>
            {model.provider && (
              <Badge variant="outline" className="text-xs mb-2">
                {model.provider}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mr-2 shrink-0">
            {isSaving && (
              <span className="w-3 h-3 border-2 border-blue-1 border-t-transparent rounded-full animate-spin" />
            )}
            <Switch
              id={`model-${model.id}`}
              checked={isActive}
              onCheckedChange={() => onToggle(model.id)}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          {model.free ? (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs w-full justify-center">
              <Sparkles className="w-3 h-3 mr-1" />
              رایگان
            </Badge>
          ) : (
            <Badge variant="gray" className="text-xs w-full justify-center">
              <DollarSign className="w-3 h-3 mr-1" />
              {model.price || 'پولی'}
            </Badge>
          )}

          {model.description && (
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2 min-h-[2.5rem]">
              {model.description}
            </p>
          )}

          {model.context_length && model.context_length > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <Info className="w-3 h-3" />
              <span>Context: {model.context_length.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
