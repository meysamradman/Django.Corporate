export type AIProviderFeature = 'chat' | 'content' | 'image' | 'audio';

export interface ProviderMetadata {
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  category?: 'popular' | 'standard' | 'specialized';
  supportedFeatures?: AIProviderFeature[];
}

export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  openrouter: {
    name: 'OpenRouter',
    icon: '🌐',
    description: '400+ مدل از 60+ Provider',
    apiKeyLabel: 'API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    description: 'GPT, DALL-E, TTS',
    apiKeyLabel: 'OpenAI API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image', 'audio'],
  },
  google: {
    name: 'Google Gemini',
    icon: '🔵',
    description: 'Gemini Models',
    apiKeyLabel: 'Google API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  gemini: {
    name: 'Google Gemini',
    icon: '🔵',
    description: 'Gemini Models',
    apiKeyLabel: 'Google API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🔷',
    description: 'Reasoning & Chat',
    apiKeyLabel: 'DeepSeek API Key',
    category: 'standard',
    supportedFeatures: ['chat', 'content'],
  },
  huggingface: {
    name: 'Hugging Face',
    icon: '🤗',
    description: 'Open Source Models',
    apiKeyLabel: 'Hugging Face API Key',
    category: 'standard',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    description: 'Ultra-fast inference',
    apiKeyLabel: 'Groq API Key',
    category: 'standard',
    supportedFeatures: ['chat', 'content'],
  },
};

export const BACKEND_TO_FRONTEND_ID: Record<string, string> = {
  openrouter: 'openrouter',
  openai: 'openai',
  deepseek: 'deepseek',
  google: 'google',
  gemini: 'google',
  huggingface: 'huggingface',
  groq: 'groq',
};

export const FRONTEND_TO_BACKEND_NAME: Record<string, string> = {
  openrouter: 'openrouter',
  openai: 'openai',
  deepseek: 'deepseek',
  google: 'google',
  gemini: 'google',
  huggingface: 'huggingface',
  groq: 'groq',
};

export function normalizeProviderId(providerId: string | number | null | undefined): string {
  const raw = String(providerId ?? '').trim().toLowerCase();
  if (!raw) return '';
  return BACKEND_TO_FRONTEND_ID[raw] || raw;
}

export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  const normalized = normalizeProviderId(providerId);
  return PROVIDER_METADATA[normalized] || null;
}

export function getProvidersByCategory(category: 'popular' | 'standard' | 'specialized'): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([, metadata]) => metadata.category === category)
    .map(([id]) => id);
}

export function getProvidersByFeature(feature: AIProviderFeature): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([, metadata]) => metadata.supportedFeatures?.includes(feature))
    .map(([id]) => id);
}

export function getAllProviders(): string[] {
  return Object.keys(PROVIDER_METADATA);
}

export function getProviderCount(): number {
  return Object.keys(PROVIDER_METADATA).length;
}

export function isProviderSupported(providerId: string): boolean {
  return normalizeProviderId(providerId) in PROVIDER_METADATA;
}

export function getAllProvidersWithMetadata(): Array<{ id: string; metadata: ProviderMetadata }> {
  return Object.entries(PROVIDER_METADATA).map(([id, metadata]) => ({ id, metadata }));
}