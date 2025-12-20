import { Card, CardContent } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Check, X } from 'lucide-react';
import { getProviderMetadata } from '@/components/ai/settings/config/providerConfig';

interface ProviderCardProps {
  providerSlug: string;
  providerName: string;
  description: string;
  activeModel?: {
    display_name?: string;
    name?: string;
  };
  onSelect: () => void;
}

const getProviderColorConfig = (slug: string) => {
  const slugLower = slug.toLowerCase();
  
  if (slugLower.includes('openrouter')) {
    return {
      bg: 'bg-blue/5',
      border: 'border-blue-1/40',
      hoverBg: 'hover:bg-blue/10',
      hoverBorder: 'hover:border-blue-1/60',
      iconBg: 'bg-blue-0/80',
    };
  }
  if (slugLower.includes('huggingface') || slugLower.includes('hugging')) {
    return {
      bg: 'bg-purple/5',
      border: 'border-purple-1/40',
      hoverBg: 'hover:bg-purple/10',
      hoverBorder: 'hover:border-purple-1/60',
      iconBg: 'bg-purple-0/80',
    };
  }
  if (slugLower.includes('openai')) {
    return {
      bg: 'bg-green/5',
      border: 'border-green-1/40',
      hoverBg: 'hover:bg-green/10',
      hoverBorder: 'hover:border-green-1/60',
      iconBg: 'bg-green-0/80',
    };
  }
  if (slugLower.includes('gemini')) {
    return {
      bg: 'bg-orange/5',
      border: 'border-orange-1/40',
      hoverBg: 'hover:bg-orange/10',
      hoverBorder: 'hover:border-orange-1/60',
      iconBg: 'bg-orange-0/80',
    };
  }
  if (slugLower.includes('deepseek')) {
    return {
      bg: 'bg-yellow/5',
      border: 'border-yellow-1/40',
      hoverBg: 'hover:bg-yellow/10',
      hoverBorder: 'hover:border-yellow-1/60',
      iconBg: 'bg-yellow-0/80',
    };
  }
  if (slugLower.includes('groq')) {
    return {
      bg: 'bg-pink/5',
      border: 'border-pink-1/40',
      hoverBg: 'hover:bg-pink/10',
      hoverBorder: 'hover:border-pink-1/60',
      iconBg: 'bg-pink-0/80',
    };
  }
  
  return {
    bg: 'bg-gray/5',
    border: 'border-gray-1/40',
    hoverBg: 'hover:bg-gray/10',
    hoverBorder: 'hover:border-gray-1/60',
    iconBg: 'bg-gray-0/80',
  };
};

export function ProviderCard({
  providerSlug,
  providerName,
  description,
  activeModel,
  onSelect,
}: ProviderCardProps) {
  const metadata = getProviderMetadata(providerSlug);
  const hasActiveModel = Boolean(activeModel);
  const displayName = activeModel?.display_name || activeModel?.name;
  const colorConfig = getProviderColorConfig(providerSlug);
  const providerIcon = metadata?.icon || '✨';

  return (
    <Card className={`${colorConfig.bg} ${colorConfig.border} ${colorConfig.hoverBg} ${colorConfig.hoverBorder} transition-all duration-200 shadow-sm hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center">
              <span className="text-2xl leading-none">{providerIcon}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <h3 className="font-semibold text-font-p text-base leading-tight">{providerName}</h3>
                <p className="text-xs text-font-s mt-1 leading-relaxed">{description}</p>
              </div>
              {hasActiveModel ? (
                <div className="mt-2.5 space-y-1.5">
                  <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    فعال
                  </Badge>
                  <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                    {displayName}
                  </div>
                </div>
              ) : (
                <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                  <X className="w-3 h-3" />
                  مدل فعالی ندارد
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            className="flex-shrink-0 h-9 px-4"
          >
            انتخاب
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

