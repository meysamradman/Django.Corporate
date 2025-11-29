/**
 * Provider Configuration
 * 
 * 🎯 مقیاس‌پذیر برای 30+ Provider
 * ✅ CSR - بدون cache در frontend (cache فقط در backend با Redis)
 * ✅ جدا از منطق کد اصلی برای راحتی نگهداری
 * ✅ افزودن provider جدید = فقط یک entry اضافه کنید
 * 
 * @version 2.0
 * @optimized برای سرعت و scalability
 */

export interface ProviderMetadata {
  name: string;
  icon: string;
  description: string;
  apiKeyLabel: string;
  category?: 'popular' | 'standard' | 'specialized';
  supportedFeatures?: ('chat' | 'content' | 'image')[];
}

/**
 * تمام Provider های موجود
 * 
 * نکته مهم: 
 * - برای اضافه کردن Provider جدید، فقط یک entry در این object اضافه کنید
 * - mapping ها در BACKEND_TO_FRONTEND_ID و FRONTEND_TO_BACKEND_NAME هم باید اضافه شوند
 * - هیچ تغییر دیگری در کد لازم نیست! 🚀
 * 
 * مثال اضافه کردن Provider جدید:
 * ```
 * 'anthropic': {
 *   name: 'Anthropic Claude',
 *   icon: '🧠',
 *   description: 'Claude AI برای محاوره پیشرفته',
 *   apiKeyLabel: 'Anthropic API Key',
 *   category: 'popular',
 *   supportedFeatures: ['chat', 'content'],
 * },
 * ```
 */
export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  // Popular Providers
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
  
  // Standard Providers
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
  
  // TODO: اضافه کردن Provider های جدید اینجا (تا 30+)
  // 
  // مثال‌های آماده:
  // 
  // 'anthropic': {
  //   name: 'Anthropic Claude',
  //   icon: '🧠',
  //   description: 'Claude AI برای محاوره پیشرفته',
  //   apiKeyLabel: 'Anthropic API Key',
  //   category: 'popular',
  //   supportedFeatures: ['chat', 'content'],
  // },
  // 'groq': {
  //   name: 'Groq',
  //   icon: '⚡',
  //   description: 'سریع‌ترین inference (300+ tokens/sec)',
  //   apiKeyLabel: 'Groq API Key',
  //   category: 'standard',
  //   supportedFeatures: ['chat', 'content'],
  // },
  // 'mistral': {
  //   name: 'Mistral AI',
  //   icon: '🌪️',
  //   description: 'Mistral Large و Medium',
  //   apiKeyLabel: 'Mistral API Key',
  //   category: 'standard',
  //   supportedFeatures: ['chat', 'content'],
  // },
  // 'cohere': {
  //   name: 'Cohere',
  //   icon: '🔷',
  //   description: 'Command و Embed مدل‌ها',
  //   apiKeyLabel: 'Cohere API Key',
  //   category: 'standard',
  //   supportedFeatures: ['chat', 'content'],
  // },
  // 'stability': {
  //   name: 'Stability AI',
  //   icon: '🎨',
  //   description: 'SDXL و SD3 برای تولید تصویر',
  //   apiKeyLabel: 'Stability API Key',
  //   category: 'specialized',
  //   supportedFeatures: ['image'],
  // },
  // 'replicate': {
  //   name: 'Replicate',
  //   icon: '🔄',
  //   description: 'صدها مدل open-source',
  //   apiKeyLabel: 'Replicate API Key',
  //   category: 'specialized',
  //   supportedFeatures: ['chat', 'content', 'image'],
  // },
  // 'together': {
  //   name: 'Together AI',
  //   icon: '🤝',
  //   description: 'مدل‌های open-source سریع',
  //   apiKeyLabel: 'Together API Key',
  //   category: 'standard',
  //   supportedFeatures: ['chat', 'content', 'image'],
  // },
};

/**
 * دریافت metadata یک Provider
 */
export function getProviderMetadata(providerId: string): ProviderMetadata | null {
  return PROVIDER_METADATA[providerId] || null;
}

/**
 * دریافت لیست Provider ها بر اساس دسته‌بندی
 */
export function getProvidersByCategory(category: 'popular' | 'standard' | 'specialized'): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([id]) => id);
}

/**
 * دریافت لیست Provider ها بر اساس قابلیت
 */
export function getProvidersByFeature(feature: 'chat' | 'content' | 'image'): string[] {
  return Object.entries(PROVIDER_METADATA)
    .filter(([_, metadata]) => metadata.supportedFeatures?.includes(feature))
    .map(([id]) => id);
}

/**
 * دریافت لیست تمام Provider ها
 */
export function getAllProviders(): string[] {
  return Object.keys(PROVIDER_METADATA);
}

/**
 * دریافت تعداد کل Provider ها
 */
export function getProviderCount(): number {
  return Object.keys(PROVIDER_METADATA).length;
}

/**
 * Backend → Frontend Mapping
 * 
 * نکته: هنگام اضافه کردن provider جدید، این mapping را هم اضافه کنید
 */
export const BACKEND_TO_FRONTEND_ID: Record<string, string> = {
  'openrouter': 'openrouter',
  'openai': 'openai',
  'deepseek': 'deepseek',
  'gemini': 'gemini',
  'huggingface': 'huggingface',
  'groq': 'groq',
  // TODO: اضافه کردن mapping های جدید
  // مثال: 'anthropic': 'anthropic',
};

/**
 * Frontend → Backend Mapping
 */
export const FRONTEND_TO_BACKEND_NAME: Record<string, string> = {
  'openrouter': 'openrouter',
  'openai': 'openai',
  'deepseek': 'deepseek',
  'gemini': 'gemini',
  'huggingface': 'huggingface',
  'groq': 'groq',
  // TODO: اضافه کردن mapping های جدید
  // مثال: 'anthropic': 'anthropic',
};

/**
 * بررسی اینکه آیا یک provider پشتیبانی می‌شود یا نه
 */
export function isProviderSupported(providerId: string): boolean {
  return providerId in PROVIDER_METADATA;
}

/**
 * دریافت لیست کامل Provider ها با اطلاعات کامل
 */
export function getAllProvidersWithMetadata(): Array<{ id: string; metadata: ProviderMetadata }> {
  return Object.entries(PROVIDER_METADATA).map(([id, metadata]) => ({ id, metadata }));
}
