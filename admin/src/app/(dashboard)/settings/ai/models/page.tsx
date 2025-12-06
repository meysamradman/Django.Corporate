"use client";

import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { MessageSquare, Image, Music, FileText, Search, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { Input } from '@/components/elements/Input';
import { Skeleton } from '@/components/elements/Skeleton';
import { Button } from '@/components/elements/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/elements/Dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { ModelSelector } from './components/ModelSelector';
import { OpenRouterModelSelectorContent } from '@/components/ai/settings/OpenRouterModelSelector';
import { HuggingFaceModelSelectorContent } from '@/components/ai/settings/HuggingFaceModelSelector';
import { useUserPermissions } from '@/core/permissions';
import { useRouter } from 'next/navigation';
import { showError, showSuccess } from '@/core/toast';
import { toast } from '@/core/toast';

type Capability = 'chat' | 'content' | 'image' | 'audio';

const CAPABILITY_CONFIG: Record<Capability, { label: string; icon: React.ElementType; description: string }> = {
    chat: {
        label: 'چت',
        icon: MessageSquare,
        description: 'مدل‌های مناسب برای گفتگو و مکالمه',
    },
    content: {
        label: 'محتوا',
        icon: FileText,
        description: 'مدل‌های مناسب برای تولید محتوا (مقاله، پست، و غیره)',
    },
    image: {
        label: 'تصویر',
        icon: Image,
        description: 'مدل‌های مناسب برای تولید تصویر',
    },
    audio: {
        label: 'صدا / پادکست',
        icon: Music,
        description: 'مدل‌های مناسب برای تولید و تبدیل صدا',
    },
};

export default function AIModelsPage() {
    const router = useRouter();
    const { hasModuleAction, isSuperAdmin } = useUserPermissions();

    const hasAccess = isSuperAdmin && hasModuleAction('ai', 'manage');

    useEffect(() => {
        if (!hasAccess) {
            showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
            router.push('/settings/ai');
        }
    }, [hasAccess, router]);

    const [activeTab, setActiveTab] = useState<Capability>('chat');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showOpenRouterModal, setShowOpenRouterModal] = useState(false);
    const [showHuggingFaceModal, setShowHuggingFaceModal] = useState(false);

    if (!hasAccess) {
        return null;
    }

    const { data: models, isLoading, error } = useQuery({
        queryKey: ['ai-models', activeTab],
        queryFn: async () => {
            const dbResponse = await aiApi.models.getByCapability(activeTab, true);
            const modelsList = dbResponse.metaData.status === 'success' ? (dbResponse.data || []) : [];

            const providers = new Set(modelsList.map((m: any) => m.provider_name || m.provider?.name || 'نامشخص'));

            return modelsList;
        },
        staleTime: 5 * 60 * 1000,
    });

    const filteredModels = useMemo(() => {
        if (!models) return [];
        if (!searchQuery.trim()) return models;

        const query = searchQuery.toLowerCase().trim();
        return models.filter((model: any) => {
            const modelName = (model.model_name || model.name || '').toLowerCase();
            const providerName = (model.provider_name || model.provider?.name || '').toLowerCase();
            const description = (model.description || '').toLowerCase();

            return (
                modelName.includes(query) ||
                providerName.includes(query) ||
                description.includes(query)
            );
        });
    }, [models, searchQuery]);

    const queryClient = useQueryClient();
    const openRouterSaveRef = React.useRef<(() => void) | undefined>(undefined);
    const huggingFaceSaveRef = React.useRef<(() => void) | undefined>(undefined);

    const handleSaveModels = async (selectedModels: any[], providerName: string) => {
        try {
            if (selectedModels.length === 0) {
                return;
            }

            const toastId = toast.loading(`در حال ذخیره ${selectedModels.length} مدل...`);

            const providersResponse = await aiApi.providers.getAll();
            const providers = providersResponse.data || [];

            const targetProvider = providers.find((p: any) =>
                p.name.toLowerCase() === providerName.toLowerCase() ||
                p.slug.toLowerCase() === providerName.toLowerCase() ||
                p.display_name.toLowerCase() === providerName.toLowerCase()
            );

            if (!targetProvider) {
                toast.dismiss(toastId);
                showError(`Provider '${providerName}' یافت نشد`);
                return;
            }

            let createdCount = 0;
            let updatedCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            for (const model of selectedModels) {
                try {
                    const modelData = {
                        provider_id: targetProvider.id,
                        name: model.name,
                        model_id: model.id,
                        display_name: model.name,
                        is_active: true,
                        capabilities: [activeTab],
                        description: model.description,
                        pricing_input: model.pricing?.prompt || null,
                        pricing_output: model.pricing?.completion || null,
                        context_window: model.context_length || null,
                    };

                    const response = await aiApi.models.create(modelData);

                    createdCount++;
                } catch (error: any) {
                    failCount++;

                    const errorMsg = error?.response?.data?.message || error?.message || 'خطای ناشناخته';
                    errors.push(`${model.name}: ${errorMsg}`);
                }
            }

            toast.dismiss(toastId);

            const totalSuccess = createdCount + updatedCount;
            if (totalSuccess > 0) {
                let message = `${totalSuccess} مدل با موفقیت ذخیره شد`;
                if (updatedCount > 0) {
                    message += ` (${updatedCount} مدل به‌روزرسانی شد)`;
                }
                showSuccess(message);
                queryClient.invalidateQueries({ queryKey: ['ai-models'] });
            }

            if (failCount > 0) {
                showError(`${failCount} مدل ذخیره نشد`);
            }

            setShowOpenRouterModal(false);
            setShowHuggingFaceModal(false);

        } catch (error) {
            showError('خطا در ذخیره مدل‌ها');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="page-title">انتخاب و مدیریت مدل‌های AI</h1>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Capability)}>
                <TabsList className="grid w-full grid-cols-4">
                    {Object.entries(CAPABILITY_CONFIG).map(([key, config]) => {
                        const TabIcon = config.icon;
                        return (
                            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                                <TabIcon className="w-4 h-4" />
                                {config.label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {Object.entries(CAPABILITY_CONFIG).map(([key, config]) => {
                    const TabIcon = config.icon;
                    return (
                        <TabsContent key={key} value={key} className="mt-6">
                            <Card className="shadow-sm border hover:shadow-lg transition-all duration-300">
                                <CardHeader className="border-b">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-[320px]">
                                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    placeholder="جستجو..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pr-8 h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-pink rounded-lg">
                                            <TabIcon className="w-5 h-5 text-pink-2" />
                                        </div>
                                        <div>
                                            <div>{config.label}</div>
                                            <p className="text-sm font-normal text-font-s mt-1">
                                                {config.description}
                                            </p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Card className="mb-6 border-blue-1/30 bg-blue/10">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-0 rounded-lg">
                                                        <Sparkles className="w-5 h-5 text-blue-1" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-font-p">OpenRouter</h3>
                                                        <p className="text-xs text-font-s mt-0.5">
                                                            دسترسی به 400+ مدل از 60+ Provider (GPT, Claude, Gemini, Groq, و...)
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowOpenRouterModal(true)}
                                                    className="gap-2"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    انتخاب مدل‌های OpenRouter
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="mb-6 border-purple-1/30 bg-purple/10">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-0 rounded-lg">
                                                        <Sparkles className="w-5 h-5 text-purple-1" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-font-p">Hugging Face</h3>
                                                        <p className="text-xs text-font-s mt-0.5">
                                                            دسترسی به هزاران مدل Open Source (Image, Text, Audio)
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowHuggingFaceModal(true)}
                                                    className="gap-2"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    انتخاب مدل‌های Hugging Face
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {isLoading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <Skeleton key={i} className="h-24 w-full" />
                                            ))}
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-8 text-red-1">
                                            خطا در دریافت مدل‌ها: {error instanceof Error ? error.message : 'خطای ناشناخته'}
                                        </div>
                                    ) : filteredModels.length === 0 ? (
                                        <div className="text-center py-8 text-font-s">
                                            {searchQuery
                                                ? 'هیچ مدلی با این جستجو یافت نشد'
                                                : 'هیچ مدلی برای این capability یافت نشد. برای انتخاب مدل‌های OpenRouter، از دکمه بالا استفاده کنید.'}
                                        </div>
                                    ) : (
                                        <ModelSelector
                                            models={filteredModels}
                                            capability={key as Capability}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>

            <Dialog open={showOpenRouterModal} onOpenChange={setShowOpenRouterModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <Sparkles className="w-6 h-6 text-blue-1" />
                            انتخاب مدل‌های OpenRouter - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            انتخاب مدل‌های مورد نظر از 400+ مدل OpenRouter برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 min-h-0">
                        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                            <OpenRouterModelSelectorContent
                                providerId="openrouter"
                                providerName="OpenRouter"
                                capability={activeTab}
                                onSave={(models) => handleSaveModels(models, 'OpenRouter')}
                                onSelectionChange={() => { }}
                                onSaveRef={openRouterSaveRef}
                            />
                        </Suspense>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-br flex-shrink-0">
                        <Button variant="outline" onClick={() => setShowOpenRouterModal(false)}>
                            بستن
                        </Button>
                        <Button onClick={() => openRouterSaveRef.current?.()}>
                            ذخیره
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showHuggingFaceModal} onOpenChange={setShowHuggingFaceModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <Sparkles className="w-6 h-6 text-purple-1" />
                            انتخاب مدل‌های Hugging Face - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            انتخاب مدل‌های مورد نظر از هزاران مدل Hugging Face برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 min-h-0">
                        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                            <HuggingFaceModelSelectorContent
                                providerId="huggingface"
                                providerName="Hugging Face"
                                capability={activeTab}
                                onSave={(models) => handleSaveModels(models, 'Hugging Face')}
                                onSelectionChange={() => { }}
                                onSaveRef={huggingFaceSaveRef}
                            />
                        </Suspense>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-br flex-shrink-0">
                        <Button variant="outline" onClick={() => setShowHuggingFaceModal(false)}>
                            بستن
                        </Button>
                        <Button onClick={() => huggingFaceSaveRef.current?.()}>
                            ذخیره
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
