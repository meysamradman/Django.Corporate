"use client";

/**
 * کامپوننت انتخاب و مدیریت مدل‌های AI
 * 
 * ✅ بهینه برای 400+ مدل:
 * - Pagination برای کاهش اسکرول
 * - Compact design
 * - Virtual scrolling ready
 */

import React, { useState, useMemo } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/elements/Card';
import { Badge } from '@/components/elements/Badge';
import { Switch } from '@/components/elements/Switch';
import { Label } from '@/components/elements/Label';
import { Button } from '@/components/elements/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';

interface ModelSelectorProps {
    models: any[];
    capability: 'chat' | 'content' | 'image' | 'audio';
}

const MODELS_PER_PAGE = 24; // 4 columns × 6 rows
const PAGINATION_THRESHOLD = 24; // فقط اگر بیشتر از این تعداد مدل داشت، pagination فعال شود

export function ModelSelector({ models, capability }: ModelSelectorProps) {
    const queryClient = useQueryClient();
    const [expandedModels, setExpandedModels] = useState<Set<number | string>>(new Set());
    const [currentPage, setCurrentPage] = useState<Record<string, number>>({});

    // Group models by provider
    const groupedModels = useMemo(() => {
        const groups: Record<string, any[]> = {};
        models.forEach((model) => {
            const providerName = model.provider_name || model.provider?.name || 'نامشخص';
            if (!groups[providerName]) {
                groups[providerName] = [];
            }
            groups[providerName].push(model);
        });
        return groups;
    }, [models]);

    // Pagination for each provider (فقط برای Provider هایی که مدل‌های زیادی دارند)
    const paginatedGroups = useMemo(() => {
        const result: Record<string, { models: any[]; totalPages: number; currentPage: number; needsPagination: boolean }> = {};
        
        Object.entries(groupedModels).forEach(([providerName, providerModels]) => {
            const needsPagination = providerModels.length > PAGINATION_THRESHOLD;
            
            if (needsPagination) {
                const page = currentPage[providerName] || 1;
                const totalPages = Math.ceil(providerModels.length / MODELS_PER_PAGE);
                const startIndex = (page - 1) * MODELS_PER_PAGE;
                const endIndex = startIndex + MODELS_PER_PAGE;
                const paginatedModels = providerModels.slice(startIndex, endIndex);
                
                result[providerName] = {
                    models: paginatedModels,
                    totalPages,
                    currentPage: page,
                    needsPagination: true,
                };
            } else {
                // اگر مدل‌های کمی دارد، همه را نمایش بده
                result[providerName] = {
                    models: providerModels,
                    totalPages: 1,
                    currentPage: 1,
                    needsPagination: false,
                };
            }
        });
        
        return result;
    }, [groupedModels, currentPage]);

    // Toggle model active/inactive (فقط برای مدل‌های دیتابیس)
    const toggleModelMutation = useMutation({
        mutationFn: async ({ modelId, isActive, isOpenRouter }: { modelId: number | string; isActive: boolean; isOpenRouter?: boolean }) => {
            // ✅ مدل‌های OpenRouter قابل toggle نیستند (از API می‌آیند)
            if (isOpenRouter) {
                throw new Error('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            }
            
            // Update model via API (partial update) - فقط برای مدل‌های دیتابیس
            const response = await aiApi.models.update(modelId as number, { is_active: isActive } as any);
            if (response.metaData.status !== 'success') {
                throw new Error(response.metaData.message || 'خطا در به‌روزرسانی مدل');
            }
            return response.data;
        },
        onMutate: async ({ modelId, isActive }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['ai-models', capability] });
            const previousModels = queryClient.getQueryData(['ai-models', capability]);

            queryClient.setQueryData(['ai-models', capability], (old: any) => {
                if (!old) return old;
                return old.map((model: any) =>
                    model.id === modelId ? { ...model, is_active: isActive } : model
                );
            });

            return { previousModels };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-models', capability] });
            showSuccessToast('وضعیت مدل با موفقیت تغییر کرد');
        },
        onError: (error: any, variables, context) => {
            // Rollback
            if (context?.previousModels) {
                queryClient.setQueryData(['ai-models', capability], context.previousModels);
            }
            showErrorToast(error?.message || 'خطا در تغییر وضعیت مدل');
        },
    });

    const handleToggleModel = (modelId: number | string, currentStatus: boolean, isOpenRouter?: boolean) => {
        if (isOpenRouter) {
            showErrorToast('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            return;
        }
        toggleModelMutation.mutate({
            modelId,
            isActive: !currentStatus,
            isOpenRouter,
        });
    };

    const toggleExpand = (modelId: number | string) => {
        setExpandedModels((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(modelId)) {
                newSet.delete(modelId);
            } else {
                newSet.add(modelId);
            }
            return newSet;
        });
    };

    const handlePageChange = (providerName: string, page: number) => {
        setCurrentPage((prev) => ({
            ...prev,
            [providerName]: page,
        }));
        // Scroll to top of provider section
        const element = document.getElementById(`provider-${providerName}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const getProviderIcon = (providerName: string) => {
        const name = providerName.toLowerCase();
        if (name.includes('openai') || name.includes('gpt')) return '🤖';
        if (name.includes('google') || name.includes('gemini')) return '🔷';
        if (name.includes('anthropic') || name.includes('claude')) return '🧠';
        if (name.includes('openrouter')) return '🌐';
        if (name.includes('deepseek')) return '🚀';
        return '⚡';
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedModels).map(([providerName, allProviderModels]) => {
                const { models: paginatedModels, totalPages, currentPage: page, needsPagination } = paginatedGroups[providerName] || { 
                    models: allProviderModels, 
                    totalPages: 1, 
                    currentPage: 1,
                    needsPagination: false
                };
                
                return (
                    <div key={providerName} id={`provider-${providerName}`} className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getProviderIcon(providerName)}</span>
                                <div>
                                    <h3 className="text-lg font-semibold text-font-p">{providerName}</h3>
                                    <p className="text-xs text-font-s mt-0.5">
                                        {allProviderModels.length} مدل {capability === 'chat' ? 'چت' : capability === 'content' ? 'محتوا' : capability === 'image' ? 'تصویر' : 'صدا'}
                                        {needsPagination && totalPages > 1 && ` • صفحه ${page} از ${totalPages}`}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {allProviderModels.length} مدل
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {paginatedModels.map((model) => {
                                const modelId = typeof model.id === 'string' ? model.id : model.id;
                                const isExpanded = expandedModels.has(modelId);
                                const isActive = model.is_active ?? false;
                                const isOpenRouter = model.is_openrouter || model.provider_slug === 'openrouter';
                                const isSaving = toggleModelMutation.isPending;

                                return (
                                    <Card
                                        key={model.id}
                                        className={`transition-all hover:shadow-md ${
                                            isActive ? 'border-green-1/50 bg-green/10' : 'border-border'
                                        }`}
                                    >
                                        <CardContent className="p-3 space-y-2">
                                            {/* Header */}
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
                                                        {model.display_name || model.model_name || model.name || 'نامشخص'}
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

                                            {/* Capabilities - فقط برای مدل‌های غیر OpenRouter */}
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

                                            {/* Toggle Switch */}
                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <Label htmlFor={`model-${modelId}`} className="text-xs text-font-s">
                                                    {isOpenRouter ? 'از API' : isActive ? 'فعال' : 'غیرفعال'}
                                                </Label>
                                                {isOpenRouter ? (
                                                    <Badge variant="blue" className="text-xs px-2 py-0.5">
                                                        API
                                                    </Badge>
                                                ) : (
                                                    <Switch
                                                        id={`model-${modelId}`}
                                                        checked={isActive}
                                                        onCheckedChange={() => handleToggleModel(modelId, isActive, isOpenRouter)}
                                                        disabled={isSaving}
                                                        className="scale-75"
                                                    />
                                                )}
                                            </div>

                                            {/* Expand Button */}
                                            {model.description && model.description.length > 100 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs h-7"
                                                    onClick={() => toggleExpand(modelId)}
                                                >
                                                    {isExpanded ? 'بستن' : 'جزئیات بیشتر'}
                                                </Button>
                                            )}

                                            {/* Expanded Details */}
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
                            })}
                        </div>

                        {/* Pagination - فقط اگر نیاز باشد */}
                        {needsPagination && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(providerName, page - 1)}
                                    disabled={page === 1}
                                    className="gap-1"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                    قبلی
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(providerName, pageNum)}
                                                className="min-w-[2.5rem]"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(providerName, page + 1)}
                                    disabled={page === totalPages}
                                    className="gap-1"
                                >
                                    بعدی
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
