import { useEffect, useRef } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import { Skeleton } from '@/components/elements/Skeleton';
import { ChevronDown, Check } from 'lucide-react';
import { msg, getAIUI } from '@/core/messages';
import { getProviderDisplayName, getProviderIcon } from '../../shared/utils';
import type { AvailableProvider } from '@/types/ai/ai';

interface ProviderSelectorProps {
    compact?: boolean;
    loadingProviders: boolean;
    availableProviders: AvailableProvider[];
    selectedProvider: string;
    setSelectedProvider: (provider: string) => void;
    showProviderDropdown: boolean;
    setShowProviderDropdown: (show: boolean) => void;
    selectedProviderData?: AvailableProvider;
}

export function ProviderSelector({
    compact = false,
    loadingProviders,
    availableProviders,
    selectedProvider,
    setSelectedProvider,
    showProviderDropdown,
    setShowProviderDropdown,
    selectedProviderData,
}: ProviderSelectorProps) {
    const providerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setShowProviderDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setShowProviderDropdown]);

    if (compact) {
        if (loadingProviders) {
            return <Skeleton className="h-8 w-32" />;
        }

        return (
            <Select
                value={selectedProvider || undefined}
                onValueChange={setSelectedProvider}
            >
                <SelectTrigger className="w-auto min-w-[140px] border-0 bg-card hover:bg-bg shadow-sm px-3 py-1.5 h-8 text-xs">
                    <SelectValue placeholder={msg.aiUI('selectModelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    {availableProviders.length === 0 ? (
                        <div className="p-2 text-sm text-font-s text-center">
                            {getAIUI('noActiveProviders')}
                        </div>
                    ) : (
                        availableProviders.map((provider) => (
                            <SelectItem
                                key={provider.id}
                                value={provider.slug || provider.provider_name || String(provider.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getProviderIcon(provider)}</span>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-medium">{provider.display_name || getProviderDisplayName(provider)}</span>
                                        {provider.slug && (
                                            <span className="text-[10px] text-font-s opacity-70">({provider.slug})</span>
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        );
    }

    return (
        <div className="relative" ref={providerDropdownRef}>
            {loadingProviders ? (
                <Skeleton className="h-9 w-32 rounded-full" />
            ) : (
                <>
                    <button
                        onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                        disabled={!availableProviders.length}
                        className="flex items-center gap-2 px-4 py-2 bg-gray hover:bg-bg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {selectedProviderData && (
                            <span className="text-lg">{getProviderIcon(selectedProviderData)}</span>
                        )}
                        <span className="text-sm font-medium text-font-p">
                            {selectedProviderData
                                ? (selectedProviderData.display_name || getProviderDisplayName(selectedProviderData))
                                : getAIUI('selectModelPlaceholder')}
                        </span>
                        <ChevronDown className="h-4 w-4 text-font-s" />
                    </button>

                    {showProviderDropdown && (
                        <div className="absolute bottom-full right-0 mb-2 w-80 bg-card rounded-xl shadow-xl border border-br py-2 z-50 max-h-96 overflow-y-auto">
                            {availableProviders.length === 0 ? (
                                <div className="p-4 text-sm text-font-s text-center">
                                    {getAIUI('noActiveProviders')}
                                </div>
                            ) : (
                                availableProviders.map((provider) => {
                                    const isSelected = (provider.slug || provider.provider_name || String(provider.id)) === selectedProvider;
                                    return (
                                        <button
                                            key={provider.id}
                                            onClick={() => {
                                                setSelectedProvider(provider.slug || provider.provider_name || String(provider.id));
                                                setShowProviderDropdown(false);
                                            }}
                                            className="w-full px-4 py-3 text-right hover:bg-bg flex items-center justify-between transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-lg">{getProviderIcon(provider)}</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-medium text-font-p">
                                                        {provider.display_name || getProviderDisplayName(provider)}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-blue-1" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
