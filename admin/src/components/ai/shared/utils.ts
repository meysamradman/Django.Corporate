import { AvailableProvider } from '@/types/ai/ai';

export const getProviderDisplayName = (provider: AvailableProvider): string => {
    // ✅ اول از display_name استفاده کن (اگر وجود داشته باشد)
    if ((provider as any).display_name) {
        return (provider as any).display_name;
    }
    
    const providerMap: Record<string, string> = {
        'gemini': 'Google Gemini',
        'openai': 'OpenAI GPT',
        'deepseek': 'DeepSeek',
        'openrouter': 'OpenRouter (60+ Providers)',
        'huggingface': 'Hugging Face',
        'groq': 'Groq (Fast & Free)',
        'dall-e': 'OpenAI DALL-E',
    };
    
    // ✅ استفاده از slug (اگر وجود داشته باشد)
    if ((provider as any).slug) {
        const slug = String((provider as any).slug).toLowerCase();
        if (providerMap[slug]) {
            return providerMap[slug];
        }
    }
    
    // ✅ بررسی null/undefined برای provider_display
    if (provider.provider_display) {
        const name = provider.provider_display.toLowerCase();
        if (name.includes('gemini')) return 'Google Gemini';
        if (name.includes('openai') || name.includes('gpt') || name.includes('dall-e') || name.includes('dalle')) return 'OpenAI GPT';
        if (name.includes('deepseek')) return 'DeepSeek';
        if (name.includes('openrouter')) return 'OpenRouter (60+ Providers)';
        if (name.includes('hugging')) return 'Hugging Face';
        if (name.includes('groq')) return 'Groq (Fast & Free)';
    }
    
    // ✅ بررسی null/undefined برای provider_name و تبدیل به string
    const providerName = provider.provider_name || provider.id || 'Unknown';
    const nameKey = String(providerName).toLowerCase();
    return providerMap[nameKey] || String(providerName);
};

export const getProviderDescription = (provider: AvailableProvider, type: 'content' | 'image' | 'chat' = 'content'): string => {
    // ✅ اول از slug استفاده کن (اگر وجود داشته باشد)
    let providerName = (provider as any).slug;
    
    // ✅ اگر slug نبود، از provider_name استفاده کن
    if (!providerName) {
        providerName = provider.provider_name || provider.id || '';
    }
    
    if (!providerName) {
        return 'مدل هوش مصنوعی';
    }
    
    // ✅ تبدیل به string در صورت نیاز (ممکن است number باشد)
    const key = String(providerName).toLowerCase();
    
    // ✅ Map برای نام‌های نمایشی
    const providerNameMap: Record<string, string> = {
        'gemini': 'Gemini',
        'openai': 'OpenAI',
        'deepseek': 'DeepSeek',
        'openrouter': 'OpenRouter',
        'huggingface': 'Hugging Face',
        'groq': 'Groq',
        'dall-e': 'OpenAI',
        'dalle': 'OpenAI',
    };
    
    const displayName = providerNameMap[key] || String(providerName);
    return `مدل ${displayName}`;
};

export const getProviderIcon = (provider: AvailableProvider): string => {
    // ✅ اول از slug استفاده کن (اگر وجود داشته باشد)
    let providerName = (provider as any).slug;
    
    // ✅ اگر slug نبود، از provider_name استفاده کن
    if (!providerName) {
        providerName = provider.provider_name || provider.provider_display || provider.id || '';
    }
    
    if (!providerName) return '✨';
    
    // ✅ تبدیل به string در صورت نیاز (ممکن است number باشد)
    const name = String(providerName).toLowerCase();
    if (name.includes('gemini')) return '🔵';
    if (name.includes('openai') || name.includes('dall-e') || name.includes('dalle') || name.includes('gpt')) return '🤖';
    if (name.includes('deepseek')) return '🔷';
    if (name.includes('openrouter')) return '🌐';
    if (name.includes('hugging')) return '🤗';
    if (name.includes('groq')) return '⚡';
    return '✨';
};

