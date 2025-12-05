export interface ProviderMetadata {
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  category?: 'popular' | 'standard' | 'specialized';
  supportedFeatures?: ('chat' | 'content' | 'image')[];
}

export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  'openrouter': {
    name: 'OpenRouter',
    icon: '🌐',
    description: 'مدل OpenRouter',
    apiKeyLabel: 'API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  'openai': {
    name: 'OpenAI',
    icon: '🤖',
    description: 'مدل OpenAI',
    apiKeyLabel: 'OpenAI API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content', 'image'],
  },
  'gemini': {
    name: 'Google Gemini',
    icon: '🔵',
    description: 'مدل Gemini',
    apiKeyLabel: 'Google API Key',
    category: 'popular',
    supportedFeatures: ['chat', 'content'],
  },
  
  'deepseek': {
    name: 'DeepSeek',
    icon: '⚡',
    description: 'مدل DeepSeek',
    apiKeyLabel: 'DeepSeek API Key',
    category: 'standard',
    supportedFeatures: ['chat', 'content'],
  },
  'huggingface': {
    name: 'Hugging Face',
    icon: '🤗',
    description: 'مدل Hugging Face',
    apiKeyLabel: 'Hugging Face API Key',
    category: 'standard',
    supportedFeatures: ['image'],
  },
  'groq': {
    name: 'Groq',
    icon: '⚡',
    description: 'مدل Groq',
    apiKeyLabel: 'Groq API Key',
    category: 'standard',
    supportedFeatures: ['chat', 'content'],
  },
};

export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  return PROVIDER_METADATA[providerId] || null;
}

export function getProvidersByCategory(category: 'popular' | 'standard' | 'specialized'): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([id]) => id);
}

export function getProvidersByFeature(feature: 'chat' | 'content' | 'image'): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([_, metadata]) => metadata.supportedFeatures?.includes(feature))
    .map(([id]) => id);
}

export function getAllProviders(): string[] {
  return Object.keys(PROVIDER_METADATA);
}

export function getProviderCount(): number {
  return Object.keys(PROVIDER_METADATA).length;
}

export const BACKEND_TO_FRONTEND_ID: Record<string, string> = {
  'openrouter': 'openrouter',
  'openai': 'openai',
  'deepseek': 'deepseek',
  'gemini': 'gemini',
  'huggingface': 'huggingface',
  'groq': 'groq',
};

export const FRONTEND_TO_BACKEND_NAME: Record<string, string> = {
  'openrouter': 'openrouter',
  'openai': 'openai',
  'deepseek': 'deepseek',
  'gemini': 'gemini',
  'huggingface': 'huggingface',
  'groq': 'groq',
};

export function isProviderSupported(providerId: string): boolean {
  return providerId in PROVIDER_METADATA;
}

export function getAllProvidersWithMetadata(): Array<{ id: string; metadata: ProviderMetadata }> {
  return Object.entries(PROVIDER_METADATA).map(([id, metadata]) => ({ id, metadata }));
}
