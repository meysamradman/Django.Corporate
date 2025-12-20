import { StaticModelSelector } from '@/components/ai/core/StaticModelSelector';
import type { StaticModel } from '@/components/ai/core/StaticModelSelector';

interface GroqModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const GROQ_MODELS: Record<string, StaticModel[]> = {
  chat: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'llama-3.3-70b-versatile',
      display_name: 'Llama 3.3 70B',
      description: 'مدل قدرتمند و سریع Meta - رایگان!',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'llama-3.1-70b-versatile',
      name: 'llama-3.1-70b-versatile',
      display_name: 'Llama 3.1 70B',
      description: 'نسخه قبلی Llama - رایگان و سریع',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'llama3-70b-8192',
      name: 'llama3-70b-8192',
      display_name: 'Llama 3 70B',
      description: 'مدل پایدار و قابل اعتماد',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 8192,
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'mixtral-8x7b-32768',
      display_name: 'Mixtral 8x7B',
      description: 'مدل Mistral AI با کیفیت عالی',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 32768,
    },
    {
      id: 'gemma2-9b-it',
      name: 'gemma2-9b-it',
      display_name: 'Gemma 2 9B',
      description: 'مدل کوچک و سریع Google',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 8192,
    },
  ],
  content: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'llama-3.3-70b-versatile',
      display_name: 'Llama 3.3 70B',
      description: 'بهترین برای تولید محتوای باکیفیت - رایگان!',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 128000,
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'mixtral-8x7b-32768',
      display_name: 'Mixtral 8x7B',
      description: 'تولید محتوای حرفه‌ای',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 32768,
      context_window: 32768,
    },
  ],
  image: [],
  audio: [
    {
      id: 'whisper-large-v3',
      name: 'whisper-large-v3',
      display_name: 'Whisper Large V3',
      description: 'تبدیل گفتار به متن - رایگان و دقیق',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'distil-whisper-large-v3-en',
      name: 'distil-whisper-large-v3-en',
      display_name: 'Distil-Whisper Large V3',
      description: 'نسخه سریع‌تر Whisper برای انگلیسی',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: null,
      context_window: null,
    },
  ],
};

export function GroqModelSelectorContent({
  providerId,
  capability,
  onSave,
}: GroqModelSelectorContentProps) {
  const models = GROQ_MODELS[capability] || [];

  return (
    <StaticModelSelector
      providerId={providerId}
      providerSlug="groq"
      capability={capability}
      models={models}
      onSave={onSave}
      singleSelection={true}
    />
  );
}
