"use client";

import React, { useState, useMemo } from 'react';
import { Check, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/elements/Card';
import { Badge } from '@/components/elements/Badge';
import { Button } from '@/components/elements/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/elements/Dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { showSuccess, showError } from '@/core/toast';

interface ModelSelectorProps {
    models: any[];
    capability: 'chat' | 'content' | 'image' | 'audio';
}

const MODELS_PER_PAGE = 24;
const PAGINATION_THRESHOLD = 24;

export function ModelSelector({ models, capability }: ModelSelectorProps) {
    const queryClient = useQueryClient();
    const [expandedModels, setExpandedModels] = useState<Set<number | string>>(new Set());
    const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        activeModelName: string;
        newModelName: string;
        onConfirm: () => void;
    }>({
        open: false,
        activeModelName: '',
        newModelName: '',
        onConfirm: () => {},
    });

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

    const toggleModelMutation = useMutation({
        mutationFn: async ({ modelId, isActive, isOpenRouter, providerSlug }: { modelId: number | string; isActive: boolean; isOpenRouter?: boolean; providerSlug?: string }) => {
            if (isOpenRouter) {
                throw new Error('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            }
            
            // این فانکشن داخل mutation نمی‌تواند state را تغییر دهد
            // پس فقط مستقیم API را صدا می‌زنیم
            
            const response = await aiApi.models.update(modelId as number, { is_active: isActive } as any);
            if (response.metaData.status !== 'success') {
                throw new Error(response.metaData.message || 'خطا در به‌روزرسانی مدل');
            }
            return response.data;
        },
        onMutate: async ({ modelId, isActive }) => {
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
            showSuccess('وضعیت مدل با موفقیت تغییر کرد');
        },
        onError: (error: any, variables, context) => {
            if (context?.previousModels) {
                queryClient.setQueryData(['ai-models', capability], context.previousModels);
            }
            showError(error?.message || 'خطا در تغییر وضعیت مدل');
        },
    });

    const handleToggleModel = async (modelId: number | string, currentStatus: boolean, isOpenRouter?: boolean, providerSlug?: string, modelName?: string) => {
        if (isOpenRouter) {
            showError('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            return;
        }
        
        const isActivating = !currentStatus;
        
        // اگر میخواد فعال بشه، چک کن مدل دیگه ای فعاله یا نه
        if (isActivating && providerSlug) {
            try {
                const activeModelResponse = await aiApi.models.getActiveModel(providerSlug, capability);
                if (activeModelResponse.data && activeModelResponse.data.id !== modelId) {
                    // یه مدل دیگه فعاله - نمایش dialog
                    const activeModelName = activeModelResponse.data.display_name || activeModelResponse.data.name;
                    setConfirmDialog({
                        open: true,
                        activeModelName,
                        newModelName: modelName || 'مدل جدید',
                        onConfirm: () => {
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                            toggleModelMutation.mutate({
                                modelId,
                                isActive: isActivating,
                                isOpenRouter,
                                providerSlug,
                            });
                        },
                    });
                    return;
                }
            } catch (error: any) {
                // اگر 404 یا 500، ادامه بده (هیچ مدل فعالی نیست)
                console.log('مدل فعالی پیدا نشد - ادامه می‌دهیم');
            }
        }
        
        // مستقیم فعال/غیرفعال کن
        toggleModelMutation.mutate({
            modelId,
            isActive: isActivating,
            isOpenRouter,
            providerSlug,
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
                                const providerSlug = model.provider_slug || model.provider?.slug || providerName.toLowerCase();
                                const isSaving = toggleModelMutation.isPending;

                                return (
                                    <Card
                                        key={model.id}
                                        className={`transition-all hover:shadow-md ${
                                            isActive ? 'border-green-1/50 bg-green/10' : 'border-border'
                                        }`}
                                    >
                                        <CardContent className="p-3 space-y-2">
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
                                                        onClick={() => handleToggleModel(
                                                            modelId, 
                                                            isActive, 
                                                            isOpenRouter, 
                                                            providerSlug,
                                                            model.display_name || model.model_name || model.name
                                                        )}
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
                                                    onClick={() => toggleExpand(modelId)}
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
                            })}
                        </div>

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
            
            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow/10">
                                <AlertTriangle className="h-6 w-6 text-yellow-1" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-right">تغییر مدل فعال</DialogTitle>
                                <DialogDescription className="text-right">
                                    آیا از تغییر مدل فعال اطمینان دارید؟
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-bg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-1"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-font-p mb-1">مدل فعلی (غیرفعال می‌شود):</p>
                                    <p className="text-sm text-font-s">{confirmDialog.activeModelName}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-border pt-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-1"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-font-p mb-1">مدل جدید (فعال می‌شود):</p>
                                        <p className="text-sm text-font-s">{confirmDialog.newModelName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-sm text-font-s text-center">
                            با فعال کردن این مدل، مدل قبلی به صورت خودکار غیرفعال خواهد شد.
                        </p>
                    </div>
                    
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                        >
                            انصراف
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={confirmDialog.onConfirm}
                            className="bg-green-1 hover:bg-green-2"
                        >
                            تایید و فعال‌سازی
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
