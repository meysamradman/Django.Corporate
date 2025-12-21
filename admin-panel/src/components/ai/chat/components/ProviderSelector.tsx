import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/elements/Select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/elements/DropdownMenu";
import { Skeleton } from '@/components/elements/Skeleton';
import { ChevronDown, Plus, Check } from 'lucide-react';
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
    variant?: 'default' | 'plus';
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
    variant = 'default',
}: ProviderSelectorProps) {

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

    if (loadingProviders) {
        return <Skeleton className="h-9 w-32 rounded-full" />;
    }

    return (
        <DropdownMenu open={showProviderDropdown} onOpenChange={setShowProviderDropdown}>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={!availableProviders.length}
                    className={`flex items-center gap-2 transition-colors group outline-none ${variant === 'plus'
                        ? 'bg-transparent hover:opacity-80'
                        : 'px-4 py-2 bg-gray hover:bg-bg rounded-full'
                        }`}
                >
                    {variant === 'plus' ? (
                        <>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-br text-font-s group-hover:border-primary group-hover:text-primary transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-font-p">
                                {selectedProviderData
                                    ? getProviderDisplayName(selectedProviderData)
                                    : "انتخاب مدل"}
                            </span>
                        </>
                    ) : (
                        <>
                            {selectedProviderData && (
                                <span className="text-lg">{getProviderIcon(selectedProviderData)}</span>
                            )}
                            <span className="text-sm font-medium text-font-p">
                                {selectedProviderData
                                    ? getProviderDisplayName(selectedProviderData)
                                    : getAIUI('selectModelPlaceholder')}
                            </span>
                            <ChevronDown className="h-4 w-4 text-font-s" />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-[12rem] p-2 max-h-96 overflow-y-auto">
                {availableProviders.length === 0 ? (
                    <div className="p-4 text-sm text-font-s text-center">
                        {getAIUI('noActiveProviders')}
                    </div>
                ) : (
                    availableProviders.map((provider) => {
                        const isSelected = (provider.slug || provider.provider_name || String(provider.id)) === selectedProvider;
                        return (
                            <DropdownMenuItem
                                key={provider.id}
                                onClick={() => setSelectedProvider(provider.slug || provider.provider_name || String(provider.id))}
                                className="flex items-center justify-between p-3 cursor-pointer rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{getProviderIcon(provider)}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-font-p">
                                            {getProviderDisplayName(provider)}
                                        </span>
                                        {provider.slug && (
                                            <span className="text-xs text-font-s opacity-70">{provider.slug}</span>
                                        )}
                                    </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
