import { AvailableProvider } from '@/types/ai/ai';

export const getProviderDisplayName = (provider: AvailableProvider): string => {
    const providerMap: Record<string, string> = {
        'gemini': 'Google Gemini',
        'openai': 'OpenAI GPT',
        'deepseek': 'DeepSeek',
        'huggingface': 'Hugging Face',
        'dall-e': 'OpenAI DALL-E',
    };
    
    if (provider.provider_display) {
        const name = provider.provider_display.toLowerCase();
        if (name.includes('gemini')) return 'Google Gemini';
        if (name.includes('openai') || name.includes('gpt') || name.includes('dall-e') || name.includes('dalle')) return 'OpenAI GPT';
        if (name.includes('deepseek')) return 'DeepSeek';
        if (name.includes('hugging')) return 'Hugging Face';
    }
    
    return providerMap[provider.provider_name.toLowerCase()] || provider.provider_name;
};

export const getProviderDescription = (provider: AvailableProvider, type: 'content' | 'image' | 'chat' = 'content'): string => {
    const contentDescMap: Record<string, string> = {
        'gemini': 'مدل هوش مصنوعی Google برای تولید محتوای با کیفیت و SEO',
        'openai': 'مدل پیشرفته OpenAI GPT برای تولید محتوای حرفه‌ای',
        'deepseek': 'مدل DeepSeek برای تولید محتوا با الگوریتم‌های پیشرفته',
        'huggingface': 'مدل Hugging Face برای تولید محتوای متنوع و خلاقانه',
    };
    
    const imageDescMap: Record<string, string> = {
        'gemini': 'مدل هوش مصنوعی Google برای تولید تصاویر با کیفیت بالا',
        'openai': 'مدل پیشرفته OpenAI برای تولید تصاویر واقع‌گرایانه',
        'deepseek': 'مدل DeepSeek برای تولید تصاویر با الگوریتم‌های پیشرفته',
        'huggingface': 'مدل Hugging Face برای تولید تصاویر متنوع و خلاقانه',
        'dall-e': 'مدل پیشرفته OpenAI برای تولید تصاویر واقع‌گرایانه',
    };
    
    const chatDescMap: Record<string, string> = {
        'gemini': 'مدل Google Gemini برای چت و گفتگو',
        'openai': 'مدل OpenAI GPT برای چت پیشرفته',
        'deepseek': 'مدل DeepSeek برای چت با الگوریتم‌های پیشرفته',
    };
    
    const key = provider.provider_name.toLowerCase();
    const descMap = type === 'image' ? imageDescMap : type === 'chat' ? chatDescMap : contentDescMap;
    return descMap[key] || `مدل هوش مصنوعی برای ${type === 'image' ? 'تولید تصاویر' : type === 'chat' ? 'چت' : 'تولید محتوا'}`;
};

export const getProviderIcon = (provider: AvailableProvider): string => {
    const name = provider.provider_name.toLowerCase();
    if (name.includes('gemini')) return '🔵';
    if (name.includes('openai') || name.includes('dall-e') || name.includes('dalle') || name.includes('gpt')) return '🤖';
    if (name.includes('deepseek')) return '🔷';
    if (name.includes('hugging')) return '🤗';
    return '✨';
};

