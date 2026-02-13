import type { AvailableProvider } from '@/types/ai/ai';
import { getProviderMetadata, normalizeProviderId } from '../core/providerCatalog';

const resolveProviderId = (provider: AvailableProvider): string => {
    const rawId = String(
        (provider as any).slug ||
        provider.provider_name ||
        provider.provider_display ||
        provider.id ||
        ''
    );
    return normalizeProviderId(rawId);
};

export const getProviderDisplayName = (provider: AvailableProvider): string => {
    if ((provider as any).display_name) {
        const name = String((provider as any).display_name);
        return name.split('(')[0].trim();
    }

    const providerId = resolveProviderId(provider);
    const metadata = getProviderMetadata(providerId);
    if (metadata) return metadata.name;

    const fallback = String(provider.provider_name || provider.id || 'Unknown');
    return fallback;
};

export const getProviderDescription = (provider: AvailableProvider, _type: 'content' | 'image' | 'chat' | 'audio' = 'content'): string => {

    const providerId = resolveProviderId(provider);
    if (!providerId) {
        return 'مدل هوش مصنوعی';
    }

    const metadata = getProviderMetadata(providerId);
    if (metadata?.description) return metadata.description;

    return `مدل ${providerId}`;
};

export const getProviderIcon = (provider: AvailableProvider): string => {

    const providerId = resolveProviderId(provider);
    const metadata = getProviderMetadata(providerId);
    if (metadata?.icon) return metadata.icon;
    return '✨';
};

