import type { AvailableProvider } from '@/types/ai/ai';

export const getProviderDisplayName = (provider: AvailableProvider): string => {
    if ((provider as any).display_name) {
        const name = String((provider as any).display_name);
        return name.split('(')[0].trim();
    }

    const providerMap: Record<string, string> = {
        'google': 'Google Gemini',
        'gemini': 'Google Gemini',
        'openai': 'OpenAI GPT',
        'deepseek': 'DeepSeek',
        'openrouter': 'OpenRouter',
        'huggingface': 'Hugging Face',
        'groq': 'Groq',
        'dall-e': 'OpenAI DALL-E',
    };

    if ((provider as any).slug) {
        const slug = String((provider as any).slug).toLowerCase();
        if (providerMap[slug]) {
            return providerMap[slug];
        }
    }

    if (provider.provider_display) {
        const name = provider.provider_display.toLowerCase();
        if (name.includes('google') || name.includes('gemini')) return 'Google Gemini';
        if (name.includes('openai') || name.includes('gpt') || name.includes('dall-e') || name.includes('dalle')) return 'OpenAI GPT';
        if (name.includes('deepseek')) return 'DeepSeek';
        if (name.includes('openrouter')) return 'OpenRouter';
        if (name.includes('hugging')) return 'Hugging Face';
        if (name.includes('groq')) return 'Groq';
    }

    const providerName = provider.provider_name || provider.id || 'Unknown';
    const nameKey = String(providerName).toLowerCase();
    return providerMap[nameKey] || String(providerName);
};

export const getProviderDescription = (provider: AvailableProvider, _type: 'content' | 'image' | 'chat' = 'content'): string => {

    let providerName = (provider as any).slug;

    if (!providerName) {
        providerName = provider.provider_name || provider.id || '';
    }

    if (!providerName) {
        return 'مدل هوش مصنوعی';
    }

    const key = String(providerName).toLowerCase();

    const providerNameMap: Record<string, string> = {
        'google': 'Gemini',
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

    let providerName = (provider as any).slug;

    if (!providerName) {
        providerName = provider.provider_name || provider.provider_display || provider.id || '';
    }

    if (!providerName) return '✨';

    const name = String(providerName).toLowerCase();
    if (name.includes('google') || name.includes('gemini')) return '🔵';
    if (name.includes('openai') || name.includes('dall-e') || name.includes('dalle') || name.includes('gpt')) return '🤖';
    if (name.includes('deepseek')) return '🔷';
    if (name.includes('openrouter')) return '🌐';
    if (name.includes('hugging')) return '🤗';
    if (name.includes('groq')) return '⚡';
    return '✨';
};

