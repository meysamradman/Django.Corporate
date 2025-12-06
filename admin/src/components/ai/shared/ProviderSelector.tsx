"use client";

import { AvailableProvider } from '@/types/ai/ai';
import { getProviderDisplayName, getProviderDescription, getProviderIcon } from './utils';
import { ArrowRight, Check } from 'lucide-react';
import { getAI, getAIUI } from '@/core/messages/modules/ai';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";

interface ProviderSelectorProps {
    providers: AvailableProvider[];
    selectedProvider: string;
    onSelectProvider: (providerName: string) => void;
    type?: 'content' | 'image' | 'chat';
    loading?: boolean;
    compact?: boolean;
}

export function ProviderSelector({ 
    providers, 
    selectedProvider, 
    onSelectProvider, 
    type = 'content',
    loading = false,
    compact = false
}: ProviderSelectorProps) {
    if (loading) {
        if (compact) {
            return <div className="h-10 bg-bg animate-pulse rounded-md" />;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-bg animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (!providers.length) return null;

    if (compact) {
        return (
            <Select
                value={selectedProvider || undefined}
                onValueChange={onSelectProvider}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب مدل AI" />
                </SelectTrigger>
                <SelectContent>
                    {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.provider_name}>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getProviderIcon(provider)}</span>
                                <span>مدل {getProviderDisplayName(provider)}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {providers.map((provider) => {
                const isSelected = selectedProvider === provider.provider_name;
                return (
                    <div
                        key={provider.provider_name}
                        onClick={() => onSelectProvider(provider.provider_name)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'hover:border-primary/50 hover:shadow-sm bg-card'
                        }`}
                    >
                        <ArrowRight className={`absolute top-3 left-3 w-4 h-4 transition-opacity ${
                            isSelected ? 'opacity-100 text-primary' : 'opacity-30'
                        }`} />
                        
                        <div className="flex items-start gap-3 mb-3">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-200 ${
                                isSelected ? 'scale-110 ring-2 ring-primary/30' : ''
                            }`}>
                                {getProviderIcon(provider)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-sm mb-1 ${
                                    isSelected ? 'text-primary' : 'text-font-p'
                                }`}>
                                    {getProviderDisplayName(provider)}
                                </h3>
                                <p className="text-xs text-font-s line-clamp-2">
                                    {getProviderDescription(provider, type)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-br">
                            <div className={`flex items-center gap-2 text-xs ${
                                isSelected ? 'text-primary font-medium' : 'text-font-s'
                            }`}>
                                {isSelected ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        {msg.aiUI('selected')}
                                    </>
                                ) : (
                                    msg.aiUI('clickToSelect')
                                )}
                            </div>
                            {isSelected && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

