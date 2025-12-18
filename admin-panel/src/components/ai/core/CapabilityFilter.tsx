"use client";

import React from 'react';
import { Badge } from '@/components/elements/Badge';
import { Sparkles } from 'lucide-react';

export type CapabilityType = 'all' | 'chat' | 'content' | 'image' | 'audio';

interface CapabilityFilterProps {
  selected: CapabilityType;
  onChange: (capability: CapabilityType) => void;
  counts?: Record<CapabilityType, number>;
}

const CAPABILITIES: Array<{ value: CapabilityType; label: string }> = [
  { value: 'all', label: 'همه' },
  { value: 'chat', label: 'چت' },
  { value: 'content', label: 'محتوا' },
  { value: 'image', label: 'تصویر' },
  { value: 'audio', label: 'صدا' },
];

export function CapabilityFilter({ selected, onChange, counts }: CapabilityFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CAPABILITIES.map((cap) => {
        const isSelected = selected === cap.value;
        const count = counts?.[cap.value];
        
        return (
          <button
            key={cap.value}
            onClick={() => onChange(cap.value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${isSelected
                ? 'bg-primary-light dark:bg-primary-dark text-white shadow-lg'
                : 'bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 hover:text-primary-light dark:hover:text-primary-dark'
              }
            `}
          >
            {isSelected && <Sparkles className="w-4 h-4" />}
            <span>{cap.label}</span>
            {count !== undefined && count > 0 && (
              <Badge 
                variant={isSelected ? 'secondary' : 'outline'} 
                className="mr-1 text-xs"
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
