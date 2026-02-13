import { useState, useEffect } from 'react';
import { aiApi } from '@/api/ai/ai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/Select';
import type { AIModelList } from '@/types/ai/ai';
import { cn } from '@/core/utils/cn';

interface ModelSelectorProps {
    providerSlug: string;
    selectedModel: string | null;
    onSelectModel?: (modelId: string) => void;
    capability: 'chat' | 'image' | 'content' | 'audio';
    className?: string;
    compact?: boolean;
    triggerClassName?: string;
}

export function ModelSelector({
    providerSlug,
    selectedModel,
    onSelectModel,
    capability,
    className,
    compact = false,
    triggerClassName,
}: ModelSelectorProps) {
    const [models, setModels] = useState<AIModelList[]>([]);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState(false);
    const [fetchedKey, setFetchedKey] = useState<string | null>(null);

    // Providers that support dynamic model fetching
    // const DYNAMIC_PROVIDERS = ['openrouter', 'huggingface'];
    // const isDynamic = DYNAMIC_PROVIDERS.includes(providerSlug.toLowerCase());

    useEffect(() => {
        const provider = String(providerSlug || '').toLowerCase().trim();
        const nextKey = provider && capability ? `${provider}:${capability}` : null;

        if (nextKey && nextKey !== fetchedKey) {
            fetchModels(provider, nextKey);
        }
    }, [providerSlug, capability, fetchedKey]);

    // Use a unified model type for display
    interface NormalizedModel {
        id: string; // The distinct identifier
        display: string; // The display name
        rawId: string | number; // Original ID for debugging/keys
    }

    const [normalizedModels, setNormalizedModels] = useState<NormalizedModel[]>([]);

    useEffect(() => {
        if (!models) {
            setNormalizedModels([]);
            return;
        }

        const norm = models.map(m => {
            // Handle different model shapes from API/Type definitions
            // AIModelList -> id is number, model_id is string, name is string
            // Dynamic logic (openrouter) -> id is string
            const idVal = (m as any).model_id || (m as any).id;
            const nameVal = m.name || (m as any).display_name || String(idVal);
            
            return {
                id: String(idVal),
                display: nameVal,
                rawId: (m as any).id
            };
        });
        setNormalizedModels(norm);
    }, [models]);

    const fetchModels = async (canonicalProvider: string, nextKey: string) => {
        setLoading(true);
        setError(false);
        try {
            const extractArray = (response: any): AIModelList[] => {
                if (Array.isArray(response)) return response as AIModelList[];
                if (Array.isArray(response?.data)) return response.data as AIModelList[];
                if (Array.isArray(response?.data?.data)) return response.data.data as AIModelList[];
                return [];
            };
            const data = extractArray(await aiApi.models.getModels(canonicalProvider, capability));
            setModels(Array.isArray(data) ? data : []);
            setFetchedKey(nextKey);
        } catch (e) {
            console.error('[ModelSelector] Error fetching:', e);
            // Silently fail for standard providers if they don't support listing
             setModels([]);
        } finally {
            setLoading(false);
        }
    };

    // If no models available (and not loading), we display a 'Default' state instead of hiding
    // This prevents UI jumping.
    // if ((!models || models.length === 0) && !loading) return null;

    const disabled = loading || (normalizedModels.length === 0 && !loading);
    // console.log('[ModelSelector] Render state:', { providerSlug, modelsLen: models.length, loading, disabled, selectedModel });

    return (
        <div className={cn("animate-in fade-in slide-in-from-top-1 duration-200", className)}>
            <Select
                key={providerSlug} // Force re-mount when provider changes to prevent stale state
                value={selectedModel || undefined}
                onValueChange={(val) => {
                    if (!onSelectModel) { 
                        return; // Prevent crash if handler not provided
                    }
                    if (val === 'default_auto') {
                        onSelectModel(''); 
                    } else {
                        onSelectModel(val);
                    }
                }}
                disabled={disabled}
            >
                <SelectTrigger className={cn("w-full bg-background/50", compact ? "h-8 text-xs" : "h-10", triggerClassName)}>
                    <SelectValue placeholder={
                        loading ? "در حال دریافت..." : 
                        (normalizedModels.length === 0 ? "مدلی یافت نشد (پیش‌فرض)" : "انتخاب مدل (هوش مصنوعی)")
                    } />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default_auto">
                        <span className="text-font-s italic">انتخاب خودکار (پیش‌فرض)</span>
                    </SelectItem>
                    {normalizedModels.map((model) => (
                        <SelectItem key={String(model.rawId)} value={model.id}>
                            <div className="flex flex-col text-right">
                                <span>{model.display}</span>
                                {model.id !== model.display && (
                                     <span className="text-[10px] text-font-s/70 font-mono text-left" dir="ltr">
                                        {model.id}
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
