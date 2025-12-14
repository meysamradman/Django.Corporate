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
import { fetchApi } from '@/core/config/fetch';
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

    // دریافت لیست Provider ها برای ID واقعی - بدون cache
    const { data: providers } = useQuery({
        queryKey: ['ai-providers'],
        queryFn: async () => {
            const response = await aiApi.providers.getAll();
            return response.data || [];
        },
        staleTime: 0,
        gcTime: 0,
    });

    // تبدیل slug به ID
    const getProviderIdBySlug = (slug: string) => {
        const provider = providers?.find((p: any) => p.slug === slug);
        return provider?.id?.toString() || '1';
    };

    // دریافت providerهای واقعی از backend - بدون cache
    const { data: availableProviders, isLoading: isLoadingProviders } = useQuery({
        queryKey: ['ai-available-providers', activeTab],
        queryFn: async () => {
            try {
                const endpoint = `/admin/ai-providers/available/?capability=${activeTab}`;
                const response = await fetchApi.get<any[]>(endpoint);
                if (response.metaData.status === 'success' && response.data) {
                    return Array.isArray(response.data) ? response.data : [];
                }
                return [];
            } catch (error: any) {
                console.error(`Error fetching providers for ${activeTab}:`, error);
                return [];
            }
        },
        staleTime: 0,
        gcTime: 0,
    });

    // تبدیل لیست providerها به map برای دسترسی سریع
    const availableProvidersMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        if (availableProviders) {
            availableProviders.forEach((p: any) => {
                const slug = p.provider_name || p.slug;
                if (slug) {
                    map[slug] = true;
                }
            });
        }
        return map;
    }, [availableProviders]);

    // دریافت مدل‌های فعال - بدون cache frontend (فقط backend Redis cache داره)
    const { data: activeModels, isLoading: isLoadingActiveModels, refetch: refetchActiveModels } = useQuery({
        queryKey: ['ai-active-models', activeTab],
        queryFn: async () => {
            const providers = availableProviders 
                ? availableProviders.map((p: any) => p.provider_name || p.slug).filter(Boolean)
                : [];
            
            const results: Record<string, any> = {};

            // Parallel requests برای سرعت بالا
            await Promise.all(
                providers.map(async (provider: string) => {
                    try {
                        const response = await aiApi.models.getActiveModel(provider, activeTab);
                        
                        if (response.data && response.data.model_id) {
                            const modelCapabilities = response.data.capabilities || [];
                            if (modelCapabilities.includes(activeTab)) {
                                results[provider] = response.data;
                            }
                        }
                    } catch (error: any) {
                        // Silent fail - 404 وقتی مدل فعالی نداریم
                    }
                })
            );

            return results;
        },
        enabled: !!activeTab && !!availableProviders,
        staleTime: 0, // بدون cache - backend cache می‌کنه
        gcTime: 0,
    });

    const queryClient = useQueryClient();

    // Redirect only after auth is loaded and user doesn't have access
    useEffect(() => {
        if (!isAuthLoading && !hasAccess) {
            showError('این صفحه فقط برای سوپر ادمین‌ها قابل دسترسی است');
            router.replace('/ai/settings');
        }
    }, [isAuthLoading, hasAccess, router]);

    const handleModelSaved = async () => {
        // باطل کردن cache فعلی
        queryClient.invalidateQueries({ queryKey: ['ai-active-models', activeTab] });
        
        // نمایش پیام موفقیت
        showSuccess('مدل با موفقیت فعال شد');
        
        // بستن modals
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
                        <TabsContent key={`${key}-${activeTab}`} value={key}>
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
                                    {/* Loading state */}
                                    {isLoadingActiveModels ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                                <Skeleton key={i} className="h-32 w-full" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* OpenRouter - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.openrouter && (
                                            <Card className="border-blue-1/40 bg-blue/5 hover:bg-blue/10 hover:border-blue-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-blue-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <Sparkles className="w-5 h-5 text-blue-1" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">OpenRouter</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        400+ مدل از 60+ Provider
                                                                    </p>
                                                                </div>
                                                                {activeModels?.openrouter ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.openrouter.display_name || activeModels.openrouter.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowOpenRouterModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* HuggingFace - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.huggingface && (
                                            <Card className="border-purple-1/40 bg-purple/5 hover:bg-purple/10 hover:border-purple-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-purple-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <Sparkles className="w-5 h-5 text-purple-1" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">Hugging Face</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        هزاران مدل Open Source
                                                                    </p>
                                                                </div>
                                                                {activeModels?.huggingface ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.huggingface.display_name || activeModels.huggingface.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowHuggingFaceModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* OpenAI - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.openai && (
                                            <Card className="border-green-1/40 bg-green/5 hover:bg-green/10 hover:border-green-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-green-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <span className="text-xl">🤖</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">OpenAI</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        GPT-4o, DALL-E, Whisper
                                                                    </p>
                                                                </div>
                                                                {activeModels?.openai ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.openai.display_name || activeModels.openai.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowOpenAIModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Google Gemini - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.gemini && (
                                            <Card className="border-orange-1/40 bg-orange/5 hover:bg-orange/10 hover:border-orange-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-orange-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <span className="text-xl">🔷</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">Google Gemini</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        Gemini 2.0 Flash, Pro
                                                                    </p>
                                                                </div>
                                                                {activeModels?.gemini ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.gemini.display_name || activeModels.gemini.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowGeminiModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* DeepSeek - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.deepseek && (
                                            <Card className="border-yellow-1/40 bg-yellow/5 hover:bg-yellow/10 hover:border-yellow-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-yellow-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <span className="text-xl">🚀</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">DeepSeek</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        R1, Chat (کم‌هزینه)
                                                                    </p>
                                                                </div>
                                                                {activeModels?.deepseek ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.deepseek.display_name || activeModels.deepseek.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowDeepSeekModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Groq - فقط اگر واقعاً capability را support کند */}
                                        {availableProvidersMap.groq && (
                                            <Card className="border-pink-1/40 bg-pink/5 hover:bg-pink/10 hover:border-pink-1/60 transition-all duration-200 shadow-sm hover:shadow-md">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="p-2.5 bg-pink-0/80 rounded-xl flex-shrink-0 shadow-sm">
                                                                <span className="text-xl">⚡</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div>
                                                                    <h3 className="font-semibold text-font-p text-base leading-tight">Groq</h3>
                                                                    <p className="text-xs text-font-s mt-1 leading-relaxed">
                                                                        Llama 3.3, Mixtral (رایگان)
                                                                    </p>
                                                                </div>
                                                                {activeModels?.groq ? (
                                                                    <div className="mt-2.5 space-y-1.5">
                                                                        <Badge variant="green" className="text-xs px-2 py-0.5 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3" />
                                                                            فعال
                                                                        </Badge>
                                                                        <div className="text-xs text-font-p font-medium leading-relaxed break-words">
                                                                            {activeModels.groq.display_name || activeModels.groq.name}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge variant="gray" className="text-xs mt-2.5 px-2 py-0.5 inline-flex items-center gap-1">
                                                                        <X className="w-3 h-3" />
                                                                        مدل فعالی ندارد
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowGroqModal(true)}
                                                            className="flex-shrink-0 h-9 px-4"
                                                        >
                                                            انتخاب
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>

            {/* OpenRouter Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.openrouter && (
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
            )}

            {/* HuggingFace Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.huggingface && (
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
            )}

            {/* OpenAI Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.openai && (
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
            )}

            {/* Google Gemini Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.gemini && (
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
            )}

            {/* DeepSeek Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.deepseek && (
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
            )}

            {/* Groq Dialog - فقط اگر واقعاً capability را support کند */}
            {availableProvidersMap.groq && (
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
            )}
        </div>
    );
}
