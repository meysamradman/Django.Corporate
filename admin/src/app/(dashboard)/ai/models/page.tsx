"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, Image, Music, FileText, Search, Sparkles, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/elements/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { Input } from '@/components/elements/Input';
import { Skeleton } from '@/components/elements/Skeleton';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/elements/Dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/route';
import { useUserPermissions } from '@/core/permissions';
import { useAuth } from '@/core/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { showError, showSuccess } from '@/core/toast';
import { toast } from '@/core/toast';

// Tab Skeleton
const TabSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  </div>
);

// Dynamic imports
const ModelSelector = dynamic(
  () => import('@/components/ai/models/ModelSelector').then(mod => ({ default: mod.ModelSelector })),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);

const OpenRouterModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/OpenRouterModelSelector').then(mod => ({ default: mod.OpenRouterModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

const HuggingFaceModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/HuggingFaceModelSelector').then(mod => ({ default: mod.HuggingFaceModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

const OpenAIModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/OpenAIModelSelector').then(mod => ({ default: mod.OpenAIModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

const GoogleGeminiModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/GoogleGeminiModelSelector').then(mod => ({ default: mod.GoogleGeminiModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

const DeepSeekModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/DeepSeekModelSelector').then(mod => ({ default: mod.DeepSeekModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

const GroqModelSelectorContent = dynamic(
  () => import('@/components/ai/settings/GroqModelSelector').then(mod => ({ default: mod.GroqModelSelectorContent })),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
  }
);

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
    const { isLoading: isAuthLoading, user } = useAuth();
    const { isSuperAdmin } = useUserPermissions();

    // فقط super admin دسترسی دارد
    const hasAccess = isSuperAdmin;

    const [activeTab, setActiveTab] = useState<Capability>('chat');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showOpenRouterModal, setShowOpenRouterModal] = useState(false);
    const [showHuggingFaceModal, setShowHuggingFaceModal] = useState(false);
    const [showOpenAIModal, setShowOpenAIModal] = useState(false);
    const [showGeminiModal, setShowGeminiModal] = useState(false);
    const [showDeepSeekModal, setShowDeepSeekModal] = useState(false);
    const [showGroqModal, setShowGroqModal] = useState(false);

    // دریافت لیست Provider ها برای ID واقعی
    const { data: providers } = useQuery({
        queryKey: ['ai-providers'],
        queryFn: async () => {
            const response = await aiApi.providers.getAll();
            return response.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // تبدیل slug به ID
    const getProviderIdBySlug = (slug: string) => {
        const provider = providers?.find((p: any) => p.slug === slug);
        return provider?.id?.toString() || '1';
    };

    // همه hooks باید قبل از return صدا زده بشن
    const { data: activeModels, isLoading: isLoadingActiveModels } = useQuery({
        queryKey: ['ai-active-models', activeTab],
        queryFn: async () => {
            // دریافت مدل‌های فعال برای همه Provider ها
            const providers = ['openrouter', 'huggingface', 'openai', 'gemini', 'deepseek', 'groq'];
            const results: Record<string, any> = {};
            
            await Promise.all(
                providers.map(async (provider) => {
                    try {
                        const response = await aiApi.models.getActiveModel(provider, activeTab);
                        if (response.data && response.data.model_id) {
                            results[provider] = response.data;
                        }
                    } catch (error) {
                        // Silent fail - no active model
                    }
                })
            );
            
            return results;
        },
        staleTime: 5 * 60 * 1000,
    });

    const queryClient = useQueryClient();

    // Redirect only after auth is loaded and user doesn't have access
    useEffect(() => {
        if (!isAuthLoading && !hasAccess) {
            showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
            router.replace('/ai/settings');
        }
    }, [isAuthLoading, hasAccess, router]);

    const handleModelSaved = () => {
        // رفرش لیست مدل‌های فعال
        queryClient.invalidateQueries({ queryKey: ['ai-active-models'] });
        // بستن پاپ‌آپ‌ها
        setShowOpenRouterModal(false);
        setShowHuggingFaceModal(false);
        setShowOpenAIModal(false);
        setShowGeminiModal(false);
        setShowDeepSeekModal(false);
        setShowGroqModal(false);
    };

    return (
        <div className="space-y-6" suppressHydrationWarning>
            <div className="flex items-center justify-between">
                <h1 className="page-title">انتخاب و مدیریت مدل‌های AI</h1>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Capability)} suppressHydrationWarning>
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
                        <TabsContent key={key} value={key}>
                            <Card className="shadow-sm border hover:shadow-lg transition-all duration-300">
                                <CardHeader className="border-b">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        <Card className="border-blue-1/30 bg-blue/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-blue-0 rounded-lg flex-shrink-0">
                                                            <Sparkles className="w-5 h-5 text-blue-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">OpenRouter</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                400+ مدل از 60+ Provider
                                                            </p>
                                                            {activeModels?.openrouter ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.openrouter.display_name || activeModels.openrouter.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowOpenRouterModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-purple-1/30 bg-purple/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-purple-0 rounded-lg flex-shrink-0">
                                                            <Sparkles className="w-5 h-5 text-purple-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">Hugging Face</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                هزاران مدل Open Source
                                                            </p>
                                                            {activeModels?.huggingface ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.huggingface.display_name || activeModels.huggingface.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowHuggingFaceModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Card className="border-green-1/30 bg-green/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-green-0 rounded-lg flex-shrink-0">
                                                            <span className="text-xl">🤖</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">OpenAI</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                GPT-4o, DALL-E, Whisper
                                                            </p>
                                                            {activeModels?.openai ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.openai.display_name || activeModels.openai.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowOpenAIModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-orange-1/30 bg-orange/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-orange-0 rounded-lg flex-shrink-0">
                                                            <span className="text-xl">🔷</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">Google Gemini</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                Gemini 2.0 Flash, Pro
                                                            </p>
                                                            {activeModels?.gemini ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.gemini.display_name || activeModels.gemini.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowGeminiModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-yellow-1/30 bg-yellow/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-yellow-0 rounded-lg flex-shrink-0">
                                                            <span className="text-xl">🚀</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">DeepSeek</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                R1, Chat (کم‌هزینه)
                                                            </p>
                                                            {activeModels?.deepseek ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.deepseek.display_name || activeModels.deepseek.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowDeepSeekModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-pink-1/30 bg-pink/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="p-2 bg-pink-0 rounded-lg flex-shrink-0">
                                                            <span className="text-xl">⚡</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-font-p text-sm">Groq</h3>
                                                            <p className="text-xs text-font-s mt-0.5">
                                                                Llama 3.3, Mixtral (رایگان)
                                                            </p>
                                                            {activeModels?.groq ? (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Badge variant="green" className="text-xs">
                                                                        <Check className="w-3 h-3 ml-1" />
                                                                        فعال
                                                                    </Badge>
                                                                    <span className="text-xs text-font-s truncate">
                                                                        {activeModels.groq.display_name || activeModels.groq.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="gray" className="text-xs mt-2">
                                                                    <X className="w-3 h-3 ml-1" />
                                                                    مدل فعالی ندارد
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowGroqModal(true)}
                                                        className="flex-shrink-0"
                                                    >
                                                        انتخاب
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
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

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <OpenRouterModelSelectorContent
                            providerId="openrouter"
                            providerName="OpenRouter"
                            capability={activeTab}
                            onSave={handleModelSaved}
                            onSelectionChange={() => { }}
                        />
                    </div>
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

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <HuggingFaceModelSelectorContent
                            providerId="huggingface"
                            providerName="Hugging Face"
                            capability={activeTab}
                            onSave={handleModelSaved}
                            onSelectionChange={() => { }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showOpenAIModal} onOpenChange={setShowOpenAIModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🤖</span>
                            انتخاب مدل‌های OpenAI - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های OpenAI برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <OpenAIModelSelectorContent
                            providerId={getProviderIdBySlug('openai')}
                            providerName="OpenAI"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showGeminiModal} onOpenChange={setShowGeminiModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🔷</span>
                            انتخاب مدل‌های Google Gemini - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های Gemini برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <GoogleGeminiModelSelectorContent
                            providerId={getProviderIdBySlug('gemini')}
                            providerName="Google Gemini"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeepSeekModal} onOpenChange={setShowDeepSeekModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">🚀</span>
                            انتخاب مدل‌های DeepSeek - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های DeepSeek برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <DeepSeekModelSelectorContent
                            providerId={getProviderIdBySlug('deepseek')}
                            providerName="DeepSeek"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showGroqModal} onOpenChange={setShowGroqModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-br flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-font-p">
                            <span className="text-2xl">⚡</span>
                            انتخاب مدل‌های Groq - {CAPABILITY_CONFIG[activeTab].label}
                        </DialogTitle>
                        <DialogDescription className="text-font-s">
                            مدل‌های رایگان Groq برای {CAPABILITY_CONFIG[activeTab].description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6 min-h-0">
                        <GroqModelSelectorContent
                            providerId={getProviderIdBySlug('groq')}
                            providerName="Groq"
                            capability={activeTab}
                            onSave={handleModelSaved}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
