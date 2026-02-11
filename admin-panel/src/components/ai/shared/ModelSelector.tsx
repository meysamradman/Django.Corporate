import { useState, useEffect } from 'react';
import { aiApi } from '@/api/ai/ai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/elements/Select';
import { Check, ChevronDown, Loader2     } from 'lucide-react';
import type { AIModelList } from '@/types/ai/ai';
import { cn } from '@/core/utils/cn';

interface ModelSelectorProps {
    providerSlug: string;
    selectedModel: string | null;
    onSelectModel: (modelId: string) => void;
    capability: 'chat' | 'image' | 'content';
    className?: string;
    compact?: boolean;
}

export function ModelSelector({
    providerSlug,
    selectedModel,
    onSelectModel,
    capability,
    className,
    compact = false
}: ModelSelectorProps) {
    const [models, setModels] = useState<AIModelList[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [fetchedProvider, setFetchedProvider] = useState<string | null>(null);

    // Providers that support dynamic model fetching
    // const DYNAMIC_PROVIDERS = ['openrouter', 'huggingface'];
    // const isDynamic = DYNAMIC_PROVIDERS.includes(providerSlug.toLowerCase());

    useEffect(() => {
        if (providerSlug && providerSlug !== fetchedProvider) {
            fetchModels();
        } 
    }, [providerSlug, capability]);

    const fetchModels = async () => {
        setLoading(true);
        setError(false);
        try {
            let response;
            if (providerSlug.toLowerCase() === 'openrouter') {
                response = await aiApi[capability].getOpenRouterModels('openrouter');
            } else if (providerSlug.toLowerCase() === 'huggingface') {
                // HuggingFace might accept task filter based on capability
                response = await aiApi[capability].getHuggingFaceModels();
            } else {
                // Try fetching for standard providers using the general models endpoint
                response = await aiApi.models.getModels(providerSlug, capability);
            }

            if (response?.data) {
                setModels(response.data);
            } else {
                setModels([]);
            }
            setFetchedProvider(providerSlug);
        } catch {
            // Silently fail for standard providers if they don't support listing
             setModels([]);
        } finally {
            setLoading(false);
        }
    };

    // If no models available (and not loading), we display a 'Default' state instead of hiding
    // This prevents UI jumping.
    // if ((!models || models.length === 0) && !loading) return null;

    return (
        <div className={cn("animate-in fade-in slide-in-from-top-1 duration-200", className)}>
            <Select
                value={selectedModel || ''}
                onValueChange={(val) => {
                    if (val === 'default_auto') {
                        onSelectModel(''); // Or null, depending on handler
                    } else {
                        onSelectModel(val);
                    }
                }}
                disabled={loading || (models.length === 0 && !loading)}
            >
                <SelectTrigger className={cn("w-full bg-background/50", compact ? "h-8 text-xs" : "h-10")}>
                    <SelectValue placeholder={
                        loading ? "در حال دریافت..." : 
                        (models.length === 0 ? "مدلی یافت نشد (پیش‌فرض)" : "انتخاب مدل (لخنیاری)")
                    } />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default_auto">
                        <span className="text-font-s italic">انتخاب خودکار (پیش‌فرض)</span>
                    </SelectItem>
                    {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col text-right">
                                <span>{model.name || model.id}</span>
                                {model.id !== model.name && (
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
