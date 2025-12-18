"use client";

import { Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/elements/Card';
import { Badge } from '@/components/elements/Badge';
import { Button } from '@/components/elements/Button';

interface ModelCardProps {
    model: any;
    isExpanded: boolean;
    isActive: boolean;
    isSaving: boolean;
    onToggle: (
        modelId: number | string,
        currentStatus: boolean,
        isOpenRouter?: boolean,
        providerSlug?: string,
        modelName?: string
    ) => void;
    onToggleExpand: (modelId: number | string) => void;
}

export function ModelCard({
    model,
    isExpanded,
    isActive,
    isSaving,
    onToggle,
    onToggleExpand,
}: ModelCardProps) {
    const modelId = typeof model.id === 'string' ? model.id : model.id;
    const isOpenRouter = model.is_openrouter || model.provider_slug === 'openrouter';
    const providerSlug = model.provider_slug || model.provider?.slug || '';
    const displayName = model.display_name || model.model_name || model.name || 'نامشخص';

    return (
        <Card
            className={`transition-all hover:shadow-md ${
                isActive ? 'border-green-1/50 bg-green/10' : 'border-border'
            }`}
        >
            <CardContent className="p-3 space-y-2">
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
                            {displayName}
                        </h3>
                        {isActive ? (
                            <Badge variant="green" className="flex-shrink-0">
                                <Check className="w-3 h-3 ml-1" />
                            </Badge>
                        ) : !isOpenRouter ? (
                            <Badge variant="gray" className="flex-shrink-0">
                                <X className="w-3 h-3 ml-1" />
                            </Badge>
                        ) : null}
                    </div>
                    {model.description && (
                        <p className="text-xs text-font-s line-clamp-2 leading-relaxed">
                            {model.description}
                        </p>
                    )}
                </div>

                {!isOpenRouter && model.capabilities && model.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {model.capabilities.slice(0, 2).map((cap: string) => (
                            <Badge
                                key={cap}
                                variant="outline"
                                className="text-xs"
                            >
                                {cap}
                            </Badge>
                        ))}
                        {model.capabilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{model.capabilities.length - 2}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="pt-2 border-t border-border/50">
                    {isOpenRouter ? (
                        <Badge variant="blue" className="w-full justify-center text-xs py-1.5">
                            از API
                        </Badge>
                    ) : (
                        <Button
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={`w-full text-xs h-8 ${
                                isActive 
                                    ? 'bg-green-1 hover:bg-green-2 text-white border-green-1' 
                                    : 'bg-bg hover:bg-bg-hover text-font-s border-border'
                            }`}
                            onClick={() => onToggle(modelId, isActive, isOpenRouter, providerSlug, displayName)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    در حال ذخیره...
                                </span>
                            ) : isActive ? (
                                <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    فعال
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <X className="w-3 h-3" />
                                    غیرفعال
                                </span>
                            )}
                        </Button>
                    )}
                </div>

                {model.description && model.description.length > 100 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => onToggleExpand(modelId)}
                    >
                        {isExpanded ? 'بستن' : 'جزئیات بیشتر'}
                    </Button>
                )}

                {isExpanded && (
                    <div className="pt-2 border-t space-y-2 text-xs text-font-s">
                        {model.provider_name && (
                            <div>
                                <strong>Provider:</strong> {model.provider_name}
                            </div>
                        )}
                        {model.context_window && (
                            <div>
                                <strong>Context Window:</strong>{' '}
                                {model.context_window.toLocaleString()}
                            </div>
                        )}
                        {model.max_tokens && (
                            <div>
                                <strong>Max Tokens:</strong>{' '}
                                {model.max_tokens.toLocaleString()}
                            </div>
                        )}
                        {model.pricing_input !== null && model.pricing_input !== undefined && (
                            <div>
                                <strong>Pricing Input:</strong> ${model.pricing_input}
                            </div>
                        )}
                        {model.pricing_output !== null && model.pricing_output !== undefined && (
                            <div>
                                <strong>Pricing Output:</strong> ${model.pricing_output}
                            </div>
                        )}
                        {model.is_free && (
                            <Badge variant="green">
                                رایگان
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
