"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/elements/Card';
import { Input } from '@/components/elements/Input';
import { Badge } from '@/components/elements/Badge';
import { Search, CheckCircle2, Zap, DollarSign } from 'lucide-react';

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

interface Provider {
    value: string;
    label: string;
    icon: string;
    description: string;
}

interface Capabilities {
    supports_chat: boolean;
    supports_content: boolean;
    supports_image: boolean;
    has_dynamic_models: boolean;
}

interface AIProviderSelectorProps {
    providers: Provider[];
    selectedProvider: string | null;
    onSelect: (providerValue: string) => void;
    capabilities?: Record<string, Capabilities>;
    activeProviders?: string[];
}

export function AIProviderSelector({
    providers,
    selectedProvider,
    onSelect,
    capabilities = {},
    activeProviders = []
}: AIProviderSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProviders = useMemo(() => {
        if (!searchQuery) return providers;
        
        const query = searchQuery.toLowerCase();
        return providers.filter(provider => 
            provider.label.toLowerCase().includes(query) ||
            provider.description.toLowerCase().includes(query) ||
            provider.value.toLowerCase().includes(query)
        );
    }, [providers, searchQuery]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="جستجوی Provider... (مثلاً OpenRouter، Gemini، OpenAI)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProviders.map((provider) => {
                    const isSelected = selectedProvider === provider.value;
                    const isActive = activeProviders.includes(provider.value);
                    const providerCaps = capabilities[provider.value];

                    return (
                        <Card
                            key={provider.value}
                            className={cn(
                                "relative cursor-pointer transition-all hover:shadow-md",
                                isSelected && "ring-2 ring-primary shadow-lg",
                                isActive && "bg-primary/5"
                            )}
                            onClick={() => onSelect(provider.value)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-2xl flex-shrink-0">
                                        {provider.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-sm truncate">
                                                {provider.label}
                                            </h3>
                                            {isActive && (
                                                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {provider.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                                    {isActive && (
                                        <Badge variant="green" className="text-xs h-5">
                                            فعال
                                        </Badge>
                                    )}
                                    
                                    {providerCaps?.supports_chat && (
                                        <Badge variant="outline" className="text-xs h-5">
                                            💬 Chat
                                        </Badge>
                                    )}
                                    
                                    {providerCaps?.supports_content && (
                                        <Badge variant="outline" className="text-xs h-5">
                                            📝 Content
                                        </Badge>
                                    )}
                                    
                                    {providerCaps?.supports_image && (
                                        <Badge variant="outline" className="text-xs h-5">
                                            🖼️ Image
                                        </Badge>
                                    )}
                                    
                                    {providerCaps?.has_dynamic_models && (
                                        <Badge variant="blue" className="text-xs h-5">
                                            <Zap className="h-2.5 w-2.5 mr-1" />
                                            200+ Models
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredProviders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">هیچ Provider ای با این جستجو یافت نشد</p>
                </div>
            )}
        </div>
    );
}
