"use client";

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Badge } from '@/components/elements/Badge';
import { Search, Zap, DollarSign, Sparkles } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/elements/Select';

interface Model {
    id: string;
    name: string;
    provider?: string;
    pricing?: {
        prompt?: number;
        completion?: number;
    };
    context_length?: number;
}

interface AIModelSelectorProps {
    models: Model[];
    selectedModel?: string;
    onModelChange: (modelId: string) => void;
    label?: string;
    hasDynamicModels?: boolean;
}

export function AIModelSelector({
    models,
    selectedModel,
    onModelChange,
    label = "انتخاب مدل",
    hasDynamicModels = false
}: AIModelSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'recommended' | 'free' | 'all'>('recommended');

    const categorizedModels = useMemo(() => {
        const recommendedIds = [
            'google/gemini-2.0-flash-exp',
            'google/gemini-1.5-pro',
            'anthropic/claude-3.5-sonnet',
            'openai/gpt-4o-mini',
            'openai/gpt-4o',
            'openai/dall-e-3',
            'stabilityai/stable-diffusion-xl',
            'black-forest-labs/flux-1.1-pro',
        ];

        const recommended = models.filter(m => recommendedIds.includes(m.id));
        const free = models.filter(m => 
            m.pricing?.prompt === 0 || 
            m.id.includes('free') ||
            m.id.includes('grok')
        );
        
        return { recommended, free, all: models };
    }, [models]);

    const filteredModels = useMemo(() => {
        const modelsToFilter = categorizedModels[activeTab];
        if (!searchQuery) return modelsToFilter;

        const query = searchQuery.toLowerCase();
        return modelsToFilter.filter(model =>
            model.id.toLowerCase().includes(query) ||
            model.name?.toLowerCase().includes(query) ||
            model.provider?.toLowerCase().includes(query)
        );
    }, [categorizedModels, activeTab, searchQuery]);

    if (!hasDynamicModels || models.length < 15) {
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <Select value={selectedModel} onValueChange={onModelChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="مدل را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                    {model.name || model.id}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Label>{label}</Label>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recommended" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        پیشنهادی ({categorizedModels.recommended.length})
                    </TabsTrigger>
                    <TabsTrigger value="free" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        رایگان ({categorizedModels.free.length})
                    </TabsTrigger>
                    <TabsTrigger value="all" className="text-xs">
                        همه ({models.length})
                    </TabsTrigger>
                </TabsList>

                {activeTab === 'all' && (
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="جستجو در 200+ مدل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-xs"
                        />
                    </div>
                )}

                <TabsContent value={activeTab} className="mt-2">
                    <Select value={selectedModel} onValueChange={onModelChange}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="مدل را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectGroup>
                                {filteredModels.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        هیچ مدلی یافت نشد
                                    </div>
                                ) : (
                                    filteredModels.map((model) => {
                                        const isFree = model.pricing?.prompt === 0 || model.id.includes('free');
                                        
                                        return (
                                            <SelectItem key={model.id} value={model.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex-1 truncate text-xs">
                                                        {model.name || model.id}
                                                    </span>
                                                    {isFree && (
                                                        <Badge variant="green" className="text-[10px] h-4 px-1">
                                                            رایگان
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {selectedModel && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            مدل انتخاب شده: <code className="text-foreground">{selectedModel}</code>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
