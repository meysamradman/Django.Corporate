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
              flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all
              ${isSelected
                ? 'bg-primary text-wt'
                : 'bg-card text-font-s hover:bg-primary/10 hover:text-primary'
              }
            `}
          >
            {isSelected && <Sparkles className="w-4 h-4" />}
            <span>{cap.label}</span>
            {count !== undefined && count > 0 && (
              <Badge 
                variant={isSelected ? 'gray' : 'outline'} 
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
