import { StaticModelSelector } from '@/components/ai/core/StaticModelSelector';
import type { StaticModel } from '@/components/ai/core/StaticModelSelector';

interface DeepSeekModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const DEEPSEEK_MODELS: Record<string, StaticModel[]> = {
  chat: [
    {
      id: 'deepseek-chat',
      name: 'deepseek-chat',
      display_name: 'DeepSeek Chat',
      description: 'مدل چت پیشرفته با قیمت اقتصادی',
      pricing_input: 0.14,
      pricing_output: 0.28,
      max_tokens: 8192,
      context_window: 64000,
    },
    {
      id: 'deepseek-reasoner',
      name: 'deepseek-reasoner',
      display_name: 'DeepSeek R1 (Reasoning)',
      description: 'مدل استدلال قدرتمند برای مسائل پیچیده',
      pricing_input: 0.55,
      pricing_output: 2.19,
      max_tokens: 8192,
      context_window: 64000,
    },
  ],
  content: [
    {
      id: 'deepseek-chat',
      name: 'deepseek-chat',
      display_name: 'DeepSeek Chat',
      description: 'تولید محتوای باکیفیت با هزینه کم',
      pricing_input: 0.14,
      pricing_output: 0.28,
      max_tokens: 8192,
      context_window: 64000,
    },
    {
      id: 'deepseek-reasoner',
      name: 'deepseek-reasoner',
      display_name: 'DeepSeek R1 (Reasoning)',
      description: 'تولید محتوای تحلیلی و پیچیده',
      pricing_input: 0.55,
      pricing_output: 2.19,
      max_tokens: 8192,
      context_window: 64000,
    },
  ],
  image: [],
  audio: [],
};

export function DeepSeekModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: DeepSeekModelSelectorContentProps) {
  const models = DEEPSEEK_MODELS[capability] || [];

  return (
    <StaticModelSelector
      providerId={providerId}
      providerSlug="deepseek"
      capability={capability}
      models={models}
      onSave={onSave}
      singleSelection={true}
    />
  );
}
