import { StaticModelSelector } from '@/components/ai/core/StaticModelSelector';
import type { StaticModel } from '@/components/ai/core/StaticModelSelector';

interface OpenAIModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const OPENAI_MODELS: Record<string, StaticModel[]> = {
  chat: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      display_name: 'GPT-4o (Latest)',
      description: 'مدل پیشرفته‌ترین OpenAI با قابلیت‌های چندوجهی',
      pricing_input: 2.5,
      pricing_output: 10,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4o-mini',
      name: 'gpt-4o-mini',
      display_name: 'GPT-4o Mini',
      description: 'نسخه کوچک و سریع‌تر GPT-4o',
      pricing_input: 0.15,
      pricing_output: 0.6,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      display_name: 'GPT-4 Turbo',
      description: 'مدل پیشرفته با سرعت بالا',
      pricing_input: 10,
      pricing_output: 30,
      max_tokens: 4096,
      context_window: 128000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      display_name: 'GPT-3.5 Turbo',
      description: 'سریع و اقتصادی برای استفاده روزمره',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 4096,
      context_window: 16385,
    },
    {
      id: 'o1',
      name: 'o1',
      display_name: 'O1 (Reasoning)',
      description: 'مدل استدلال پیشرفته برای مسائل پیچیده',
      pricing_input: 15,
      pricing_output: 60,
      max_tokens: 100000,
      context_window: 200000,
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      display_name: 'O1 Mini',
      description: 'نسخه کوچک‌تر O1 با سرعت بیشتر',
      pricing_input: 3,
      pricing_output: 12,
      max_tokens: 65536,
      context_window: 128000,
    },
  ],
  content: [
    {
      id: 'gpt-4o',
      name: 'gpt-4o',
      display_name: 'GPT-4o (Latest)',
      description: 'بهترین برای تولید محتوای باکیفیت',
      pricing_input: 2.5,
      pricing_output: 10,
      max_tokens: 16384,
      context_window: 128000,
    },
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      display_name: 'GPT-4 Turbo',
      description: 'تولید محتوای حرفه‌ای با سرعت بالا',
      pricing_input: 10,
      pricing_output: 30,
      max_tokens: 4096,
      context_window: 128000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      display_name: 'GPT-3.5 Turbo',
      description: 'تولید سریع محتوا با هزینه کم',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 4096,
      context_window: 16385,
    },
  ],
  image: [
    {
      id: 'dall-e-3',
      name: 'dall-e-3',
      display_name: 'DALL-E 3',
      description: 'تولید تصویر با کیفیت بالا',
      pricing_input: 0.04,
      pricing_output: 0.08,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'dall-e-2',
      name: 'dall-e-2',
      display_name: 'DALL-E 2',
      description: 'تولید سریع تصویر با هزینه کمتر',
      pricing_input: 0.016,
      pricing_output: 0.018,
      max_tokens: null,
      context_window: null,
    },
  ],
  audio: [
    {
      id: 'tts-1',
      name: 'tts-1',
      display_name: 'TTS-1 (Text to Speech)',
      description: 'تبدیل متن به گفتار با کیفیت استاندارد',
      pricing_input: 15,
      pricing_output: 15,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'tts-1-hd',
      name: 'tts-1-hd',
      display_name: 'TTS-1 HD',
      description: 'تبدیل متن به گفتار با کیفیت بالا',
      pricing_input: 30,
      pricing_output: 30,
      max_tokens: null,
      context_window: null,
    },
    {
      id: 'whisper-1',
      name: 'whisper-1',
      display_name: 'Whisper (Speech to Text)',
      description: 'تبدیل گفتار به متن',
      pricing_input: 0.006,
      pricing_output: 0.006,
      max_tokens: null,
      context_window: null,
    },
  ],
};

export function OpenAIModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: OpenAIModelSelectorContentProps) {
  const models = OPENAI_MODELS[capability] || [];

  return (
    <StaticModelSelector
      providerId={providerId}
      providerSlug="openai"
      capability={capability}
      models={models}
      onSave={onSave}
      singleSelection={true}
    />
  );
}
